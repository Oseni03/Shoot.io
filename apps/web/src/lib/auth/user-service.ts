import type { AxiosInstance } from "axios";

import { snakeCaseSchema } from "@/lib/utils";
import {
	type UserResponse,
	type UserUpdateRequest,
	type ChangePasswordRequest,
	UserResponseSchema,
} from "@/schemas";
import api from "@/lib/api";
import { extractApiError } from "./errors";
import type { CallOptions } from "./types";
import { API_ENDPOINTS } from "@/lib/config";

export class UserService {
	constructor(private readonly api: AxiosInstance) {}

	async getProfile(options?: CallOptions): Promise<UserResponse> {
		try {
			const res = await this.api.get<any>(API_ENDPOINTS.users.me, {
				signal: options?.signal,
			});
			return snakeCaseSchema(UserResponseSchema).parse(res.data);
		} catch (err) {
			throw extractApiError(err);
		}
	}

	async updateProfile(
		data: UserUpdateRequest,
		options?: CallOptions,
	): Promise<UserResponse> {
		try {
			const res = await this.api.patch<any>(
				API_ENDPOINTS.users.me,
				data,
				{
					signal: options?.signal,
				},
			);
			return snakeCaseSchema(UserResponseSchema).parse(res.data);
		} catch (err) {
			throw extractApiError(err);
		}
	}

	async changePassword(
		data: ChangePasswordRequest,
		options?: CallOptions,
	): Promise<void> {
		try {
			await this.api.post(API_ENDPOINTS.users.changePassword, data, {
				signal: options?.signal,
			});
		} catch (err) {
			throw extractApiError(err);
		}
	}

	async deleteAccount(options?: CallOptions): Promise<void> {
		try {
			await this.api.delete(API_ENDPOINTS.users.me, {
				signal: options?.signal,
			});
		} catch (err) {
			throw extractApiError(err);
		}
	}
}

export const userService = new UserService(api);
