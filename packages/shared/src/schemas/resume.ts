import { z } from "zod";

export const ExperienceSchema = z.object({
	id: z.string(),
	resume_id: z.string(),
	company: z.string(),
	title: z.string(),
	location: z.string().nullable().optional(),
	start_date: z.string().nullable().optional(),
	end_date: z.string().nullable().optional(),
	is_current: z.boolean().default(false),
	bullets: z.array(z.string()).default([]),
	sort_order: z.number().int().default(0),
});

export const EducationSchema = z.object({
	id: z.string(),
	resume_id: z.string(),
	school: z.string(),
	degree: z.string().nullable().optional(),
	field: z.string().nullable().optional(),
	start_date: z.string().nullable().optional(),
	end_date: z.string().nullable().optional(),
	gpa: z.number().nullable().optional(),
	sort_order: z.number().int().default(0),
});

export const SkillSchema = z.object({
	id: z.string(),
	resume_id: z.string(),
	name: z.string(),
	proficiency: z.number().int().nullable().optional(),
	sort_order: z.number().int().default(0),
});

export const SummarySchema = z.object({
	id: z.string(),
	resume_id: z.string(),
	content: z.string(),
});

export const ProjectSchema = z.object({
	id: z.string(),
	resume_id: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	url: z.string().nullable().optional(),
	technologies: z.array(z.string()).default([]),
	sort_order: z.number().int().default(0),
});

export const CertificationSchema = z.object({
	id: z.string(),
	resume_id: z.string(),
	name: z.string(),
	issuer: z.string().nullable().optional(),
	earned_date: z.string().nullable().optional(),
	url: z.string().nullable().optional(),
	sort_order: z.number().int().default(0),
});

export const ResumeSchema = z.object({
	id: z.string(),
	user_id: z.string(),
	title: z.string(),
	is_master: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
	experiences: z.array(ExperienceSchema).default([]),
	educations: z.array(EducationSchema).default([]),
	skills: z.array(SkillSchema).default([]),
	summary: SummarySchema.nullable().optional(),
	projects: z.array(ProjectSchema).default([]),
	certifications: z.array(CertificationSchema).default([]),
});

export const ResumeListEntrySchema = z.object({
	id: z.string(),
	user_id: z.string(),
	title: z.string(),
	is_master: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
});

export const ShootRequestSchema = z.object({
	job_description_text: z.string(),
	source_url: z.string().nullable().optional(),
	job_title: z.string().nullable().optional(),
	company: z.string().nullable().optional(),
});

export const ShootResponseSchema = z.object({
	tailored_resume_id: z.string(),
	auto_fill_fields: z.record(z.string(), z.string()),
});

export const ShotRemainingSchema = z.object({
	shots_remaining: z.number().int().nullable(),
	period_end: z.string(),
});

export type Resume = z.infer<typeof ResumeSchema>;
export type ResumeListEntry = z.infer<typeof ResumeListEntrySchema>;
export type ShootRequest = z.infer<typeof ShootRequestSchema>;
export type ShootResponse = z.infer<typeof ShootResponseSchema>;
export type ShotRemaining = z.infer<typeof ShotRemainingSchema>;
