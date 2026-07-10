import { z } from "zod";

export type {
	ChangePasswordRequest,
	UserResponse,
	UserUpdateRequest,
} from "shared";
export {
	ChangePasswordRequestSchema,
	UserResponseSchema,
	UserUpdateRequestSchema,
} from "shared";

// ======================
// Client-side Form Schemas
// ======================

export const ProfileUpdateFormSchema = z.object({
	fullName: z.string().max(255).optional(),
});

export const ChangePasswordFormSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required."),
		newPassword: z.string().min(8).max(128),
		confirmPassword: z.string(),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords don't match.",
		path: ["confirmPassword"],
	});
