import { z } from "zod";
import { PROJECT } from "@/lib/config";
import { UserResponseSchema } from "./user";

const {
	minLength,
	maxLength,
	requireUppercase,
	requireDigit,
} = PROJECT.password;

export const RegisterRequestSchema = z.object({
	email: z.email(),
	password: (() => {
		let schema = z.string().min(minLength).max(maxLength);
		if (requireUppercase) {
			schema = schema.refine((val) => /[A-Z]/.test(val), {
				message: "Password must contain at least one uppercase letter.",
			});
		}
		if (requireDigit) {
			schema = schema.refine((val) => /\d/.test(val), {
				message: "Password must contain at least one digit.",
			});
		}
		return schema;
	})(),
	full_name: z.string().max(255).nullable().optional(),
});

export const LoginRequestSchema = z.object({
	email: z.email(),
	password: z.string(),
});

export const TokenPairSchema = z.object({
	access_token: z.string(),
	refresh_token: z.string(),
	token_type: z.literal(PROJECT.tokenType).default(PROJECT.tokenType),
});

export const RefreshRequestSchema = z.object({
	refresh_token: z.string(),
});

export const VerifyEmailRequestSchema = z.object({
	token: z.string(),
});

export const PasswordResetRequestSchema = z.object({
	email: z.email(),
});

export const PasswordResetConfirmSchema = z.object({
	token: z.string(),
	new_password: (() => {
		let schema = z.string().min(minLength).max(maxLength);
		if (requireUppercase) {
			schema = schema.refine((val) => /[A-Z]/.test(val), {
				message: "Password must contain at least one uppercase letter.",
			});
		}
		if (requireDigit) {
			schema = schema.refine((val) => /\d/.test(val), {
				message: "Password must contain at least one digit.",
			});
		}
		return schema;
	})(),
});

export const LoginResponseSchema = z.object({
	access_token: z.string(),
	refresh_token: z.string(),
	token_type: z.literal(PROJECT.tokenType).default(PROJECT.tokenType),
	user: UserResponseSchema.optional(),
});

export const RegisterResponseSchema = z.object({
	access_token: z.string(),
	refresh_token: z.string(),
	token_type: z.literal(PROJECT.tokenType).default(PROJECT.tokenType),
	id: z.string(),
	email: z.email(),
	full_name: z.string().nullable().optional(),
	avatar_url: z.string().nullable().optional(),
	is_verified: z.boolean(),
	is_active: z.boolean(),
	mfa_enabled: z.boolean(),
	created_at: z.string(),
});

export const MfaPendingResponseSchema = z.object({
	mfa_pending: z.string(),
	expires_in: z.number(),
});

// ======================
// Client-side Form Schemas (camelCase fields for component use)
// ======================

export const SignUpFormSchema = z.object({
	name: z.string().max(255).optional(),
	email: z.email("Please enter a valid email address."),
	password: RegisterRequestSchema.shape.password,
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
		password: PasswordResetConfirmSchema.shape.new_password,
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match.",
		path: ["confirmPassword"],
	});

// Types
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type TokenPair = z.infer<typeof TokenPairSchema>;
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;
export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetConfirm = z.infer<typeof PasswordResetConfirmSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type MfaPendingResponse = z.infer<typeof MfaPendingResponseSchema>;

// Form value types
export type SignUpFormValues = z.infer<typeof SignUpFormSchema>;
export type SignInFormValues = z.infer<typeof SignInFormSchema>;
export type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordFormSchema>;
export type ResetPasswordFormValues = z.infer<typeof ResetPasswordFormSchema>;
