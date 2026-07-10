import { API_ENDPOINTS, PROJECT } from "./config";
import { extractApiError, type HttpClient } from "./errors";
import {
	type LoginRequest,
	type MfaPendingResponse,
	MfaPendingResponseSchema,
	type PasswordResetConfirm,
	type PasswordResetRequest,
	type RefreshRequest,
	type RegisterRequest,
	type TokenPair,
	TokenPairSchema,
	type UserResponse,
	UserResponseSchema,
	type VerifyEmailRequest,
} from "./schemas";
import type { CallOptions, TokenStore } from "./token-store";
import { snakeCaseSchema } from "./utils";

interface SignupResponse {
	user: UserResponse;
	access_token: string;
	refresh_token: string;
	token_type: typeof PROJECT.tokenType;
}

export class AuthService {
	constructor(
		private readonly httpClient: HttpClient,
		private readonly baseUrl: string,
		private readonly tokenStore: TokenStore,
	) {}

	private buildUrl(path: string): string {
		return `${this.baseUrl}${path}`;
	}

	private async request(
		path: string,
		options?: { method?: string; body?: unknown; signal?: AbortSignal },
	): Promise<{ status: number; body: unknown }> {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};

		const access = this.tokenStore.getAccess();
		if (access) {
			headers.Authorization = `${PROJECT.tokenType} ${access}`;
		}

		const url = this.buildUrl(path);
		const init: {
			method?: string;
			headers?: Record<string, string>;
			body?: string;
			signal?: AbortSignal;
		} = { headers };

		if (options?.method) init.method = options.method;
		if (options?.signal) init.signal = options.signal;
		if (options?.body) init.body = JSON.stringify(options.body);

		const response = await this.httpClient(url, init);

		let body: unknown;
		try {
			body = await response.json();
		} catch {
			body = {};
		}

		if (!response.ok) {
			const httpError = {
				status: response.status,
				body,
				message: `HTTP ${response.status}`,
			};
			throw extractApiError(httpError);
		}

		return { status: response.status, body };
	}

	async login(
		data: LoginRequest,
		options?: CallOptions,
	): Promise<(TokenPair & { user?: UserResponse }) | MfaPendingResponse> {
		const { body } = await this.request(API_ENDPOINTS.auth.login, {
			method: "POST",
			body: data,
			signal: options?.signal,
		});

		const parsed = body as Record<string, unknown>;

		if (parsed.mfa_pending) {
			return snakeCaseSchema(MfaPendingResponseSchema).parse(parsed);
		}

		const tokens = snakeCaseSchema(TokenPairSchema).parse(parsed);
		const user = parsed.user
			? snakeCaseSchema(UserResponseSchema).parse(parsed.user)
			: undefined;
		this.tokenStore.set(tokens.access_token, tokens.refresh_token);
		return { ...tokens, user };
	}

	async register(
		data: RegisterRequest,
		options?: CallOptions,
	): Promise<SignupResponse> {
		const { body } = await this.request(API_ENDPOINTS.auth.register, {
			method: "POST",
			body: data,
			signal: options?.signal,
		});

		const parsed = body as Record<string, unknown>;
		const tokens = snakeCaseSchema(TokenPairSchema).parse(parsed);
		const user = snakeCaseSchema(UserResponseSchema).parse(parsed.user);
		this.tokenStore.set(tokens.access_token, tokens.refresh_token);
		return { ...tokens, user };
	}

	async refresh(
		data: RefreshRequest,
		options?: CallOptions,
	): Promise<TokenPair> {
		const { body } = await this.request(API_ENDPOINTS.auth.refresh, {
			method: "POST",
			body: data,
			signal: options?.signal,
		});

		const tokens = snakeCaseSchema(TokenPairSchema).parse(body);
		this.tokenStore.set(tokens.access_token, tokens.refresh_token);
		return tokens;
	}

	async logout(options?: CallOptions): Promise<void> {
		const refresh = this.tokenStore.getRefresh();
		if (refresh) {
			try {
				await this.request(API_ENDPOINTS.auth.logout, {
					method: "POST",
					body: { refresh_token: refresh },
					signal: options?.signal,
				});
			} catch {
				// Silent — clear locally regardless
			}
		}
		this.tokenStore.clear();
	}

	async verifyEmail(
		data: VerifyEmailRequest,
		options?: CallOptions,
	): Promise<UserResponse> {
		const { body } = await this.request(API_ENDPOINTS.auth.verifyEmail, {
			method: "POST",
			body: data,
			signal: options?.signal,
		});

		return snakeCaseSchema(UserResponseSchema).parse(body);
	}

	async forgotPassword(
		data: PasswordResetRequest,
		options?: CallOptions,
	): Promise<{ message: string }> {
		const { body } = await this.request(API_ENDPOINTS.auth.forgotPassword, {
			method: "POST",
			body: data,
			signal: options?.signal,
		});

		const { z } = await import("zod");
		return snakeCaseSchema(z.object({ message: z.string() })).parse(body);
	}

	async resetPassword(
		data: PasswordResetConfirm,
		options?: CallOptions,
	): Promise<UserResponse> {
		const { body } = await this.request(API_ENDPOINTS.auth.resetPassword, {
			method: "POST",
			body: data,
			signal: options?.signal,
		});

		return snakeCaseSchema(UserResponseSchema).parse(body);
	}

	async getMe(options?: CallOptions): Promise<UserResponse> {
		const { body } = await this.request(API_ENDPOINTS.auth.me, {
			signal: options?.signal,
		});

		return snakeCaseSchema(UserResponseSchema).parse(body);
	}

	async refreshIfNeeded(options?: CallOptions): Promise<TokenPair | null> {
		const refresh = this.tokenStore.getRefresh();
		if (!refresh) return null;

		try {
			return await this.refresh({ refresh_token: refresh }, options);
		} catch {
			return null;
		}
	}

	isAuthenticated(): boolean {
		return this.tokenStore.getAccess() !== null;
	}
}

export type { SignupResponse };
