import { z } from "zod";
import { PROJECT } from "../config";
import { UserResponseSchema } from "./user";

const { minLength, maxLength, requireUppercase, requireDigit } =
	PROJECT.password;

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
