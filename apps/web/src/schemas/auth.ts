import { z } from "zod";

export type {
	LoginRequest,
	LoginResponse,
	MfaPendingResponse,
	PasswordResetConfirm,
	PasswordResetRequest,
	RefreshRequest,
	RegisterRequest,
	RegisterResponse,
	TokenPair,
	VerifyEmailRequest,
} from "shared";
export {
	LoginRequestSchema,
	LoginResponseSchema,
	MfaPendingResponseSchema,
	PasswordResetConfirmSchema,
	PasswordResetRequestSchema,
	RefreshRequestSchema,
	RegisterRequestSchema,
	RegisterResponseSchema,
	TokenPairSchema,
	VerifyEmailRequestSchema,
} from "shared";

// ======================
// Client-side Form Schemas (camelCase fields for component use)
// ======================

export const SignUpFormSchema = z.object({
	name: z.string().max(255).optional(),
	email: z.email("Please enter a valid email address."),
	password: z.string().min(8).max(128),
});

export const SignInFormSchema = z.object({
	email: z.email("Please enter a valid email address."),
	password: z.string().min(1, "Password is required."),
});

export const ForgotPasswordFormSchema = z.object({
	email: z.email("Please enter a valid email address."),
});

export const ResetPasswordFormSchema = z
	.object({
		verificationCode: z.string().min(1, "Verification code is required."),
		password: z.string().min(8).max(128),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match.",
		path: ["confirmPassword"],
	});

// Form value types
export type SignUpFormValues = z.infer<typeof SignUpFormSchema>;
export type SignInFormValues = z.infer<typeof SignInFormSchema>;
export type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordFormSchema>;
export type ResetPasswordFormValues = z.infer<typeof ResetPasswordFormSchema>;
