import { z } from "zod";
import { InvitationStatus, MemberRole, PlanTier } from "./enums";

export const OrgCreateRequestSchema = z.object({
	name: z.string().min(1),
});

export const OrgUpdateRequestSchema = z.object({
	name: z.string().min(1).optional().nullable(),
	logo_url: z.string().url().optional().nullable(),
});

const planEnum = z.enum(PlanTier);
const planSchema = z.preprocess(
	(val) => (typeof val === "string" ? val.toLowerCase() : val),
	planEnum,
);

export const OrgResponseSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	logo_url: z.string().nullable(),
	plan: planSchema,
	role: z.enum(MemberRole).optional(),
	member_count: z.number(),
	created_at: z.iso.datetime(),
});

export const MembershipOrgResponseSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	logo_url: z.string().nullable(),
	plan: planSchema,
	role: z.enum(MemberRole),
	member_count: z.number(),
	created_at: z.iso.datetime(),
});

export const MembershipResponseSchema = z.object({
	user_id: z.string(),
	organization_id: z.string(),
	role: z.enum(MemberRole),
	created_at: z.string().datetime(),
	name: z.string().optional(),
	email: z.string().optional(),
	avatar_url: z.string().nullable().optional(),
});

export const InvitationSchema = z.object({
	id: z.string(),
	organization_id: z.string(),
	email: z.string(),
	status: z.enum(InvitationStatus),
	expires_at: z.iso.datetime(),
});

export const InviteMemberRequestSchema = z.object({
	email: z.email(),
	role: z.enum(MemberRole).default(MemberRole.MEMBER),
});

export const UpdateMemberRoleRequestSchema = z.object({
	role: z.enum(MemberRole),
});

export const AcceptInvitationRequestSchema = z.object({
	token: z.string(),
});

export const BillingInitSchemaSchema = z.object({
	plan: z.enum(PlanTier),
	callback_url: z.string().url(),
});

export const BillingVerifyResponseSchema = z.object({
	plan: planSchema,
	organization_id: z.string(),
});

export type OrgCreateRequest = z.infer<typeof OrgCreateRequestSchema>;
export type OrgUpdateRequest = z.infer<typeof OrgUpdateRequestSchema>;
export type OrgResponse = z.infer<typeof OrgResponseSchema>;
export type MembershipOrgResponse = z.infer<typeof MembershipOrgResponseSchema>;
export type MembershipResponse = z.infer<typeof MembershipResponseSchema>;
export type InvitationResponse = z.infer<typeof InvitationSchema>;
export type InviteMemberRequest = z.infer<typeof InviteMemberRequestSchema>;
export type UpdateMemberRoleRequest = z.infer<
	typeof UpdateMemberRoleRequestSchema
>;
export type AcceptInvitationRequest = z.infer<
	typeof AcceptInvitationRequestSchema
>;
export type BillingInitSchema = z.infer<typeof BillingInitSchemaSchema>;
export type BillingVerifyResponse = z.infer<typeof BillingVerifyResponseSchema>;
