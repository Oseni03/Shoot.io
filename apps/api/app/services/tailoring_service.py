"""Tailoring service — AI orchestration that tailors a master resume to a job description.

The TailoringService abstracts the AI provider (OpenAI, Anthropic, etc.).
In production, this calls an LLM to rewrite resume sections to match the JD.
For now, the implementation is a simple template-based mock that returns
the original resume content with a note appended.
"""

from typing import Any

from app.lib.logger import logger
from app.models.resume import Resume


class TailoringService:
    """AI-powered resume tailoring.

    Currently uses a mock implementation. Replace `_call_ai()` with a real
    LLM API call when a provider is chosen (see PRD Open Question #1).
    """

    async def tailor(self, master: Resume, jd_text: str, jd_title: str | None = None) -> dict[str, Any]:
        logger.info("tailoring.start", resume_id=master.id)

        sections: dict[str, Any] = {
            "experiences": [],
            "educations": [],
            "skills": [],
            "summary": "",
            "projects": [],
            "certifications": [],
        }

        if master.summary:
            sections["summary"] = self._tailor_summary(master.summary.content, jd_text, jd_title)

        for exp in master.experiences:
            sections["experiences"].append({
                "company": exp.company,
                "title": exp.title,
                "location": exp.location,
                "start_date": str(exp.start_date) if exp.start_date else None,
                "end_date": str(exp.end_date) if exp.end_date else None,
                "is_current": exp.is_current,
                "bullets": [self._tailor_bullet(b, jd_text) for b in exp.bullets],
                "sort_order": exp.sort_order,
            })

        for edu in master.educations:
            sections["educations"].append({
                "school": edu.school,
                "degree": edu.degree,
                "field": edu.field,
                "start_date": str(edu.start_date) if edu.start_date else None,
                "end_date": str(edu.end_date) if edu.end_date else None,
                "gpa": edu.gpa,
                "sort_order": edu.sort_order,
            })

        for skill in master.skills:
            sections["skills"].append({
                "name": skill.name,
                "proficiency": skill.proficiency,
                "sort_order": skill.sort_order,
            })

        for proj in master.projects:
            sections["projects"].append({
                "name": proj.name,
                "description": proj.description,
                "url": proj.url,
                "technologies": proj.technologies,
                "sort_order": proj.sort_order,
            })

        for cert in master.certifications:
            sections["certifications"].append({
                "name": cert.name,
                "issuer": cert.issuer,
                "date": str(cert.earned_date) if cert.earned_date else None,
                "url": cert.url,
                "sort_order": cert.sort_order,
            })

        logger.info("tailoring.complete", resume_id=master.id)
        return sections

    def _tailor_summary(self, summary: str, jd_text: str, jd_title: str | None = None) -> str:
        return summary

    def _tailor_bullet(self, bullet: str, jd_text: str) -> str:
        return bullet
