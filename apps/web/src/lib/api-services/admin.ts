import { z } from "zod";
import { API_ENDPOINTS } from "@/lib/config";
import {
	type OrgResponse,
	OrgResponseSchema,
	StatResponseSchema,
	type StatsResponse,
	type UserResponse,
	UserResponseSchema,
} from "@/schemas";
import api from "../api";
import { snakeCaseSchema } from "../utils";

export const adminService = {
	/**
	 * Get admin dashboard statistics
	 */
	getStats: async (): Promise<StatsResponse> => {
		const res = await api.get<any>(API_ENDPOINTS.admin.stats);

		return snakeCaseSchema(StatResponseSchema).parse(res.data);
	},

	listUsers: async (
		params: {
			page?: number;
			page_size?: number;
			search?: string;
			is_active?: boolean;
		} = {},
	): Promise<UserResponse[]> => {
		const res = await api.get<any>(API_ENDPOINTS.admin.users, { params });

		return snakeCaseSchema(z.array(UserResponseSchema)).parse(res.data);
	},

	listOrganizations: async (
		params: { page?: number; page_size?: number; search?: string } = {},
	): Promise<OrgResponse[]> => {
		const res = await api.get<any>(API_ENDPOINTS.admin.organizations, {
			params,
		});

		return snakeCaseSchema(z.array(OrgResponseSchema)).parse(res.data);
	},

	deactivateUser: async (userId: string): Promise<UserResponse> => {
		const res = await api.patch<any>(
			API_ENDPOINTS.admin.deactivateUser(userId),
		);

		return snakeCaseSchema(UserResponseSchema).parse(res.data);
	},

	activateUser: async (userId: string): Promise<UserResponse> => {
		const res = await api.patch<any>(
			API_ENDPOINTS.admin.activateUser(userId),
		);

		return snakeCaseSchema(UserResponseSchema).parse(res.data);
	},
};
