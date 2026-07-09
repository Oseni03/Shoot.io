import api from "../api";
import { snakeCaseSchema } from "../utils";
import { z } from "zod";
import {
	type OrgCreateRequest,
	type OrgUpdateRequest,
	type OrgResponse,
	type InviteMemberRequest,
	type UpdateMemberRoleRequest,
	type AcceptInvitationRequest,
	type MembershipResponse,
	MembershipResponseSchema,
	OrgResponseSchema,
	InvitationResponse,
	InvitationSchema,
} from "@/schemas";
import { API_ENDPOINTS } from "@/lib/config";

export const organizationService = {
	// ── Organizations ─────────────────────────────────────────────────────

	/**
	 * Create a new organization
	 */
	create: async (data: OrgCreateRequest): Promise<OrgResponse> => {
		const res = await api.post<any>(API_ENDPOINTS.organizations.root, data);
		return snakeCaseSchema(OrgResponseSchema).parse(res.data);
	},

	list: async (): Promise<OrgResponse[]> => {
		const res = await api.get<any>(API_ENDPOINTS.organizations.root);
		return snakeCaseSchema(z.array(OrgResponseSchema)).parse(res.data);
	},

	getOne: async (orgId: string): Promise<OrgResponse> => {
		const res = await api.get<any>(
			`${API_ENDPOINTS.organizations.root}${orgId}`,
		);
		return snakeCaseSchema(OrgResponseSchema).parse(res.data);
	},

	update: async (
		orgId: string,
		data: OrgUpdateRequest,
	): Promise<OrgResponse> => {
		const res = await api.patch<any>(
			`${API_ENDPOINTS.organizations.root}${orgId}`,
			data,
		);
		return snakeCaseSchema(OrgResponseSchema).parse(res.data);
	},

	remove: async (orgId: string): Promise<void> => {
		await api.delete<any>(`${API_ENDPOINTS.organizations.root}${orgId}`);
	},

	listMembers: async (orgId: string): Promise<MembershipResponse[]> => {
		const res = await api.get<any>(
			API_ENDPOINTS.organizations.members(orgId),
		);
		return snakeCaseSchema(z.array(MembershipResponseSchema)).parse(
			res.data,
		);
	},

	removeMember: async (
		orgId: string,
		userId: string,
	): Promise<{ message: string }> => {
		const res = await api.delete<any>(
			API_ENDPOINTS.organizations.member(orgId, userId),
		);

		return snakeCaseSchema(
			z.object({
				message: z.string(),
			}),
		).parse(res.data);
	},

	updateMemberRole: async (
		orgId: string,
		userId: string,
		data: UpdateMemberRoleRequest,
	): Promise<MembershipResponse> => {
		const res = await api.patch<any>(
			API_ENDPOINTS.organizations.member(orgId, userId),
			data,
		);
		return snakeCaseSchema(MembershipResponseSchema).parse(res.data);
	},

	listInvitations: async (orgId: string): Promise<InvitationResponse[]> => {
		const res = await api.get<any>(
			API_ENDPOINTS.organizations.invitations(orgId),
		);
		return snakeCaseSchema(z.array(InvitationSchema)).parse(res.data);
	},

	inviteMember: async (
		orgId: string,
		data: InviteMemberRequest,
	): Promise<{ message: string }> => {
		const res = await api.post<any>(
			API_ENDPOINTS.organizations.invitations(orgId),
			data,
		);

		return snakeCaseSchema(
			z.object({
				message: z.string(),
			}),
		).parse(res.data);
	},

	revokeInvitation: async (
		orgId: string,
		invitationId: string,
	): Promise<{ message: string }> => {
		const res = await api.delete<any>(
			API_ENDPOINTS.organizations.invitation(orgId, invitationId),
		);

		return snakeCaseSchema(
			z.object({
				message: z.string(),
			}),
		).parse(res.data);
	},

	acceptInvitation: async (
		data: AcceptInvitationRequest,
	): Promise<OrgResponse> => {
		const res = await api.post<any>(
			API_ENDPOINTS.organizations.acceptInvitation,
			data,
		);

		return snakeCaseSchema(OrgResponseSchema).parse(res.data);
	},
};
