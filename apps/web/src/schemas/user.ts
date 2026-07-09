import { z } from "zod";
import { MembershipOrgResponseSchema } from "./organization";

export const UserResponseSchema = z.object({
	id: z.string(),
	email: z.email(),
	full_name: z.string().nullable().optional(),
	avatar_url: z.url().nullable().optional(),
	is_verified: z.boolean(),
	is_active: z.boolean(),
	mfa_enabled: z.boolean(),
	created_at: z.iso.datetime(), // ISO datetime string
	organizations: z.array(MembershipOrgResponseSchema).optional().default([]),
});

export const UserUpdateRequestSchema = z.object({
	full_name: z.string().max(255).nullable().optional(),
	avatar_url: z.url().nullable().optional(),
});

export const ChangePasswordRequestSchema = z.object({
	current_password: z.string(),
	new_password: z
		.string()
		.min(8)
		.max(128)
		.refine((val) => /[A-Z]/.test(val), {
			message: "Password must contain at least one uppercase letter.",
		})
		.refine((val) => /\d/.test(val), {
			message: "Password must contain at least one digit.",
		}),
});

// ======================
// Client-side Form Schemas
// ======================

export const ProfileUpdateFormSchema = z.object({
	fullName: z.string().max(255).optional(),
});

export const ChangePasswordFormSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required."),
		newPassword: ChangePasswordRequestSchema.shape.new_password,
		confirmPassword: z.string(),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords don't match.",
		path: ["confirmPassword"],
	});

export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
