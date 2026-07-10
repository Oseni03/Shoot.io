import { z } from "zod";
import { MemberRole, PlanTier } from "./enums";

export type {
	AcceptInvitationRequest,
	BillingInitSchema,
	BillingVerifyResponse,
	InvitationResponse,
	InviteMemberRequest,
	MembershipOrgResponse,
	MembershipResponse,
	OrgCreateRequest,
	OrgResponse,
	OrgUpdateRequest,
	UpdateMemberRoleRequest,
} from "shared";
export {
	AcceptInvitationRequestSchema,
	BillingInitSchemaSchema,
	BillingVerifyResponseSchema,
	InvitationSchema,
	InviteMemberRequestSchema,
	MembershipOrgResponseSchema,
	MembershipResponseSchema,
	OrgCreateRequestSchema,
	OrgResponseSchema,
	OrgUpdateRequestSchema,
	UpdateMemberRoleRequestSchema,
} from "shared";

// ======================
// Client-side Form Schemas
// ======================

export const OrgUpdateFormSchema = z.object({
	name: z.string().min(1, "Organization name is required."),
	logoUrl: z.string().optional(),
});

export const InviteMemberFormSchema = z.object({
	email: z.email("Please enter a valid email address."),
	role: z.enum(MemberRole).default(MemberRole.MEMBER),
});

export const OrgCreateFormSchema = z.object({
	name: z.string().min(1, "Organization name is required."),
	plan: z.enum(PlanTier).default(PlanTier.FREE),
});
