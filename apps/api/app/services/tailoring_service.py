"""Tailoring service — AI orchestration that tailors a master resume to a job description."""

import json
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, BadRequestError
from app.lib.ai import call_ai
from app.lib.logger import logger
from app.lib.ulid import new_ulid
from app.models.resume import JobDescription, Resume, TailoredResume
from app.repositories.resume_repo import ResumeRepository
from app.services.resume_service import ResumeService

TAILOR_PROMPT_V1 = """You are an expert resume tailor. Rewrite the following resume to match the job description below.
Preserve the same section structure (summary, experiences, educations, skills, projects, certifications) but rephrase content to emphasize relevant skills, experience, and achievements that match the job.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks, no extra text):
{{
  "summary": "tailored summary text",
  "experiences": [
    {{"company": "...", "title": "...", "location": "...", "start_date": "YYYY-MM-DD or null", "end_date": "YYYY-MM-DD or null", "is_current": true/false, "bullets": ["..."], "sort_order": 0}}
  ],
  "educations": [
    {{"school": "...", "degree": "...", "field": "...", "start_date": "YYYY-MM-DD or null", "end_date": "YYYY-MM-DD or null", "gpa": null or number, "sort_order": 0}}
  ],
  "skills": [
    {{"name": "...", "proficiency": 0-5 or null, "sort_order": 0}}
  ],
  "projects": [
    {{"name": "...", "description": "... or null", "url": "... or null", "technologies": ["..."], "sort_order": 0}}
  ],
  "certifications": [
    {{"name": "...", "issuer": "... or null", "date": "YYYY-MM-DD or null", "url": "... or null", "sort_order": 0}}
  ]
}}"""


class TailoringService:
    """AI-powered resume tailoring.

    Constructs a structured prompt from the master resume and job description,
    calls the configured AI provider, parses the response, stores a
    TailoredResume snapshot and JobDescription record, and returns the result.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.resume_svc = ResumeService(db)
        self.repo = ResumeRepository(db)

    async def tailor(
        self,
        master_resume_id: str,
        jd_text: str,
        user_id: str,
        jd_source_url: str | None = None,
        jd_title: str | None = None,
        jd_company: str | None = None,
    ) -> TailoredResume:
        """Load master resume, call AI, create JD + TailoredResume, return it."""
        if len(jd_text.strip()) < 50:
            raise BadRequestError("Job description too short")

        resume = await self.resume_svc.get_by_id(master_resume_id, user_id)
        logger.info("tailoring.start", resume_id=resume.id)

        prompt = self._build_prompt(resume, jd_text)

        try:
            response = await call_ai(prompt)
        except Exception as e:
            raise AppError(status_code=502, detail=f"AI call failed: {e}") from e

        sections = self._parse_response(response, resume)

        jd = JobDescription(
            id=new_ulid(),
            raw_text=jd_text,
            source_url=jd_source_url,
            job_title=jd_title,
            company=jd_company,
        )
        jd = await self.repo.create_job_description(jd)

        tailored = TailoredResume(
            id=new_ulid(),
            user_id=user_id,
            source_resume_id=resume.id,
            job_description_id=jd.id,
            sections=sections,
        )
        tailored = await self.repo.create_tailored_resume(tailored)

        logger.info("tailoring.complete", resume_id=resume.id, tailored_id=tailored.id)
        return tailored

    # ── Prompt construction ───────────────────────────────────────────

    def _build_prompt(self, resume: Resume, jd_text: str) -> str:
        return TAILOR_PROMPT_V1.format(
            resume_text=self._serialize_resume(resume),
            jd_text=jd_text,
        )

    def _serialize_resume(self, resume: Resume) -> str:
        parts: list[str] = []

        if resume.summary:
            parts.append(f"SUMMARY:\n{resume.summary.content}\n")

        if resume.experiences:
            parts.append("EXPERIENCE:")
            for exp in resume.experiences:
                dates = ""
                if exp.start_date:
                    dates = f" ({exp.start_date.isoformat()}"
                    if exp.end_date:
                        dates += f" - {exp.end_date.isoformat()}"
                    elif exp.is_current:
                        dates += " - Present"
                    dates += ")"
                parts.append(f"- {exp.title} at {exp.company}{dates}")
                if exp.location:
                    parts.append(f"  Location: {exp.location}")
                for bullet in exp.bullets:
                    parts.append(f"  * {bullet}")
                parts.append("")

        if resume.educations:
            parts.append("EDUCATION:")
            for edu in resume.educations:
                parts.append(f"- {edu.degree or ''} in {edu.field or ''} at {edu.school}")
                if edu.gpa is not None:
                    parts.append(f"  GPA: {edu.gpa}")
                parts.append("")

        if resume.skills:
            skills_str = ", ".join(s.name for s in resume.skills)
            parts.append(f"SKILLS:\n{skills_str}\n")

        if resume.projects:
            parts.append("PROJECTS:")
            for proj in resume.projects:
                tech = ", ".join(proj.technologies) if proj.technologies else ""
                parts.append(f"- {proj.name} ({tech})")
                if proj.description:
                    parts.append(f"  {proj.description}")
                if proj.url:
                    parts.append(f"  URL: {proj.url}")
                parts.append("")

        if resume.certifications:
            parts.append("CERTIFICATIONS:")
            for cert in resume.certifications:
                parts.append(f"- {cert.name} ({cert.issuer or 'N/A'})")
                parts.append("")

        return "\n".join(parts).strip()

    # ── Response parsing ──────────────────────────────────────────────

    def _parse_response(self, response: str, _resume: Resume) -> dict[str, Any]:
        try:
            sections = json.loads(response)
        except json.JSONDecodeError as e:
            raise AppError(
                status_code=502,
                detail=f"AI returned invalid JSON: {e}",
            )

        required_keys = {
            "experiences", "educations", "skills",
            "summary", "projects", "certifications",
        }
        missing = required_keys - sections.keys()
        if missing:
            raise AppError(
                status_code=502,
                detail=f"AI response missing required sections: {', '.join(sorted(missing))}",
            )

        return sections
