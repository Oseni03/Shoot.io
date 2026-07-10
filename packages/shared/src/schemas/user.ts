import { z } from "zod";
import { PROJECT } from "../config";
import { MembershipOrgResponseSchema } from "./organization";

export const UserResponseSchema = z.object({
	id: z.string(),
	email: z.email(),
	full_name: z.string().nullable().optional(),
	avatar_url: z.string().url().nullable().optional(),
	is_verified: z.boolean(),
	is_active: z.boolean(),
	mfa_enabled: z.boolean(),
	created_at: z.iso.datetime(),
	organizations: z.array(MembershipOrgResponseSchema).optional().default([]),
});

export const UserUpdateRequestSchema = z.object({
	full_name: z.string().max(255).nullable().optional(),
	avatar_url: z.string().url().nullable().optional(),
});

export const ChangePasswordRequestSchema = z.object({
	current_password: z.string(),
	new_password: z
		.string()
		.min(PROJECT.password.minLength)
		.max(PROJECT.password.maxLength)
		.refine((val) => /[A-Z]/.test(val), {
			message: "Password must contain at least one uppercase letter.",
		})
		.refine((val) => /\d/.test(val), {
			message: "Password must contain at least one digit.",
		}),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
