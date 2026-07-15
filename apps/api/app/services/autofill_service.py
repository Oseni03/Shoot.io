"""Auto-fill service — maps tailored resume sections to application form fields.

Given a TailoredResume's sections, produces a flat dictionary of field
name → value that the content script can use to fill application form fields.
"""

from typing import Any


class AutoFillService:
    """Maps tailored resume data to form field values.

    The output dict uses field names that map to common job application form
    field identifiers (name, email, phone, headline, summary, etc.).
    Unknown fields are skipped gracefully.
    """

    def map_fields(
        self,
        sections: dict[str, Any],
        user: dict[str, str] | None = None,
    ) -> dict[str, str]:
        fields: dict[str, str] = {}

        if user:
            fields["name"] = user.get("full_name", "")
            fields["email"] = user.get("email", "")

        fields["phone"] = ""

        experiences = sections.get("experiences", [])
        if experiences:
            latest = experiences[0]
            fields["headline"] = latest.get("title", "")

        if sections.get("summary"):
            fields["summary"] = sections["summary"]

        for i, exp in enumerate(experiences):
            prefix = f"experience_{i}"
            fields[f"{prefix}_title"] = exp.get("title", "")
            fields[f"{prefix}_company"] = exp.get("company", "")
            if exp.get("bullets"):
                fields[f"{prefix}_bullets"] = "\n".join(exp["bullets"])

        skills = sections.get("skills", [])
        if skills:
            skill_names = [s.get("name", "") for s in skills]
            fields["skills"] = ", ".join(skill_names)

        for i, edu in enumerate(sections.get("educations", [])):
            prefix = f"education_{i}"
            fields[f"{prefix}_degree"] = edu.get("degree", "")
            fields[f"{prefix}_school"] = edu.get("school", "")

        return fields
