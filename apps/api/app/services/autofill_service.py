"""Auto-fill service — maps tailored resume sections to application form fields.

Given a TailoredResume's sections, produces a flat dictionary of field
name → value that the content script can use to fill application form fields.
"""

from typing import Any


class AutoFillService:
    """Maps tailored resume data to form field values.

    The output dict uses field names that map to Indeed's form field
    selectors. Unknown fields are skipped gracefully.
    """

    def map_fields(self, sections: dict[str, Any]) -> dict[str, str]:
        fields: dict[str, str] = {}

        if sections.get("summary"):
            fields["summary"] = sections["summary"]

        experiences = sections.get("experiences", [])
        if experiences:
            latest = experiences[0]
            fields["current_title"] = latest.get("title", "")
            fields["current_company"] = latest.get("company", "")
            if latest.get("bullets"):
                fields["experience_bullets"] = "\n".join(latest["bullets"])

        skills = sections.get("skills", [])
        if skills:
            skill_names = [s.get("name", "") for s in skills]
            fields["skills"] = ", ".join(skill_names)

        educations = sections.get("educations", [])
        if educations:
            latest_edu = educations[0]
            fields["highest_education"] = latest_edu.get("degree", "")
            fields["school"] = latest_edu.get("school", "")

        return fields
