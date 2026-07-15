import { z } from "zod";

export type {
	Experience as ExperienceResponse,
	Education as EducationResponse,
	Skill as SkillResponse,
	Summary as SummaryResponse,
	Project as ProjectResponse,
	Certification as CertificationResponse,
	Resume as ResumeResponse,
	ResumeListEntry,
} from "shared";
export {
	ExperienceSchema as ExperienceResponseSchema,
	EducationSchema as EducationResponseSchema,
	SkillSchema as SkillResponseSchema,
	SummarySchema as SummaryResponseSchema,
	ProjectSchema as ProjectResponseSchema,
	CertificationSchema as CertificationResponseSchema,
	ResumeSchema as ResumeResponseSchema,
	ResumeListEntrySchema,
} from "shared";

export const ExperienceFormSchema = z.object({
	_id: z.string().optional(),
	id: z.string().optional(),
	company: z.string().min(1, "Company is required"),
	title: z.string().min(1, "Title is required"),
	location: z.string().optional().default(""),
	startDate: z.string().optional().default(""),
	endDate: z.string().optional().default(""),
	isCurrent: z.boolean().default(false),
	bullets: z.array(z.string()).default([""]),
});

export const EducationFormSchema = z.object({
	_id: z.string().optional(),
	id: z.string().optional(),
	school: z.string().min(1, "School is required"),
	degree: z.string().optional().default(""),
	field: z.string().optional().default(""),
	startDate: z.string().optional().default(""),
	endDate: z.string().optional().default(""),
	gpa: z.coerce.number().nullable().optional(),
});

export const SkillFormSchema = z.object({
	_id: z.string().optional(),
	id: z.string().optional(),
	name: z.string().min(1, "Skill name is required"),
	proficiency: z.coerce.number().int().min(1).max(5).nullable().optional(),
});

export const SummaryFormSchema = z.object({
	content: z.string(),
});

export const ProjectFormSchema = z.object({
	_id: z.string().optional(),
	id: z.string().optional(),
	name: z.string().min(1, "Project name is required"),
	description: z.string().optional().default(""),
	url: z.string().optional().default(""),
	technologies: z.array(z.string()).default([""]),
});

export const CertificationFormSchema = z.object({
	_id: z.string().optional(),
	id: z.string().optional(),
	name: z.string().min(1, "Certification name is required"),
	issuer: z.string().optional().default(""),
	earnedDate: z.string().optional().default(""),
	url: z.string().optional().default(""),
});

export const ResumeSettingsSchema = z.object({
	template: z.string().default("default"),
	fontFamily: z.string().default("Inter"),
	fontSize: z.number().default(11),
	accentColor: z.string().default("#4f46e5"),
	sectionOrder: z.array(z.string()).default([
		"summary",
		"experience",
		"education",
		"skills",
		"projects",
		"certifications",
	]),
	margins: z.number().min(0.25).max(2).default(0.75),
});

export type ExperienceFormData = z.infer<typeof ExperienceFormSchema>;
export type EducationFormData = z.infer<typeof EducationFormSchema>;
export type SkillFormData = z.infer<typeof SkillFormSchema>;
export type SummaryFormData = z.infer<typeof SummaryFormSchema>;
export type ProjectFormData = z.infer<typeof ProjectFormSchema>;
export type CertificationFormData = z.infer<typeof CertificationFormSchema>;
export type ResumeSettingsData = z.infer<typeof ResumeSettingsSchema>;
