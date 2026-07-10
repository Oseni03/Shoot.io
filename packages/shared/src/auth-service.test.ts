import { describe, expect, it, vi } from "vitest";
import { AuthService } from "./auth-service";
import type { HttpClient } from "./errors";
import type { TokenStore } from "./token-store";

function createMockHttpClient(): {
	httpClient: HttpClient;
	responses: Map<string, { status: number; body: unknown }>;
} {
	const responses = new Map<string, { status: number; body: unknown }>();

	const httpClient: HttpClient = vi.fn(
		(url: string, init?: { method?: string; body?: string }) => {
			const key = `${init?.method ?? "GET"} ${url}`;
			const match = responses.get(key) ?? {
				status: 404,
				body: { detail: "Not found" },
			};
			return Promise.resolve({
				status: match.status,
				ok: match.status >= 200 && match.status < 300,
				json: () => Promise.resolve(match.body),
			});
		},
	);

	return { httpClient, responses };
}

function createMockTokenStore(): TokenStore {
	let access: string | null = null;
	let refresh: string | null = null;
	return {
		getAccess: () => access,
		getRefresh: () => refresh,
		set: (a: string, r: string) => {
			access = a;
			refresh = r;
		},
		clear: () => {
			access = null;
			refresh = null;
		},
	};
}

describe("AuthService", () => {
	const BASE = "http://localhost:8000/api/v1";

	describe("login", () => {
		it("sends POST to /auth/login with email and password", async () => {
			const { httpClient, responses } = createMockHttpClient();
			const tokenStore = createMockTokenStore();
			const auth = new AuthService(httpClient, BASE, tokenStore);

			responses.set("POST http://localhost:8000/api/v1/auth/login", {
				status: 200,
				body: {
					access_token: "at1",
					refresh_token: "rt1",
					token_type: "bearer",
					user: {
						id: "u1",
						email: "a@b.com",
						full_name: "Alice",
						avatar_url: null,
						is_verified: true,
						is_active: true,
						mfa_enabled: false,
						created_at: "2026-01-01T00:00:00Z",
						organizations: [],
					},
				},
			});

			const result = await auth.login({
				email: "a@b.com",
				password: "Secret1",
			});

			expect(result).toHaveProperty("access_token", "at1");
			expect(result).toHaveProperty("refresh_token", "rt1");
		});

		it("stores tokens on success", async () => {
			const { httpClient, responses } = createMockHttpClient();
			const tokenStore = createMockTokenStore();
			const auth = new AuthService(httpClient, BASE, tokenStore);

			responses.set("POST http://localhost:8000/api/v1/auth/login", {
				status: 200,
				body: {
					access_token: "at2",
					refresh_token: "rt2",
					token_type: "bearer",
					user: {
						id: "u1",
						email: "a@b.com",
						full_name: "Alice",
						avatar_url: null,
						is_verified: true,
						is_active: true,
						mfa_enabled: false,
						created_at: "2026-01-01T00:00:00Z",
						organizations: [],
					},
				},
			});

			await auth.login({ email: "a@b.com", password: "Secret1" });

			expect(tokenStore.getAccess()).toBe("at2");
			expect(tokenStore.getRefresh()).toBe("rt2");
		});

		it("returns user on success", async () => {
			const { httpClient, responses } = createMockHttpClient();
			const tokenStore = createMockTokenStore();
			const auth = new AuthService(httpClient, BASE, tokenStore);

			responses.set("POST http://localhost:8000/api/v1/auth/login", {
				status: 200,
				body: {
					access_token: "at3",
					refresh_token: "rt3",
					token_type: "bearer",
					user: {
						id: "u1",
						email: "a@b.com",
						full_name: "Alice",
						avatar_url: null,
						is_verified: true,
						is_active: true,
						mfa_enabled: false,
						created_at: "2026-01-01T00:00:00Z",
						organizations: [],
					},
				},
			});

			const result = await auth.login({
				email: "a@b.com",
				password: "Secret1",
			});

			if ("user" in result && result.user) {
				expect(result.user.email).toBe("a@b.com");
				expect(result.user.full_name).toBe("Alice");
			} else {
				expect("user" in result).toBe(true);
			}
		});

		it("handles MFA pending response", async () => {
			const { httpClient, responses } = createMockHttpClient();
			const tokenStore = createMockTokenStore();
			const auth = new AuthService(httpClient, BASE, tokenStore);

			responses.set("POST http://localhost:8000/api/v1/auth/login", {
				status: 200,
				body: {
					mfa_pending: "mfa_token_123",
					expires_in: 300,
				},
			});

			const result = await auth.login({
				email: "a@b.com",
				password: "Secret1",
			});

			expect("mfa_pending" in result).toBe(true);
			if ("mfa_pending" in result) {
				expect(result.mfa_pending).toBe("mfa_token_123");
			}
		});

		it("does not store tokens when MFA is pending", async () => {
			const { httpClient, responses } = createMockHttpClient();
			const tokenStore = createMockTokenStore();
			const auth = new AuthService(httpClient, BASE, tokenStore);

			responses.set("POST http://localhost:8000/api/v1/auth/login", {
				status: 200,
				body: {
					mfa_pending: "mfa_token_123",
					expires_in: 300,
				},
			});

			await auth.login({ email: "a@b.com", password: "Secret1" });

			expect(tokenStore.getAccess()).toBeNull();
			expect(tokenStore.getRefresh()).toBeNull();
		});

		it("throws AuthSessionError on invalid credentials (401)", async () => {
			const { httpClient, responses } = createMockHttpClient();
			const tokenStore = createMockTokenStore();
			const auth = new AuthService(httpClient, BASE, tokenStore);

			responses.set("POST http://localhost:8000/api/v1/auth/login", {
				status: 401,
				body: { detail: "Invalid credentials" },
			});

			await expect(
				auth.login({ email: "a@b.com", password: "wrong" }),
			).rejects.toThrow("Invalid credentials");
		});
	});

	describe("register", () => {
		it("sends POST to /auth/register and stores tokens", async () => {
			const { httpClient, responses } = createMockHttpClient();
			const tokenStore = createMockTokenStore();
			const auth = new AuthService(httpClient, BASE, tokenStore);

			responses.set("POST http://localhost:8000/api/v1/auth/register", {
				status: 201,
				body: {
					access_token: "at_reg",
					refresh_token: "rt_reg",
					token_type: "bearer",
					user: {
						id: "u2",
						email: "b@c.com",
						full_name: "Bob",
						avatar_url: null,
						is_verified: false,
						is_active: true,
						mfa_enabled: false,
						created_at: "2026-01-01T00:00:00Z",
						organizations: [],
					},
				},
			});

			const result = await auth.register({
				email: "b@c.com",
				password: "Strong1",
			});

			expect(result.access_token).toBe("at_reg");
			expect(tokenStore.getAccess()).toBe("at_reg");
			expect(result.user.email).toBe("b@c.com");
		});
	});

	describe("refresh", () => {
		it("sends POST to /auth/refresh and updates tokens", async () => {
			const { httpClient, responses } = createMockHttpClient();
			const tokenStore = createMockTokenStore();
			const auth = new AuthService(httpClient, BASE, tokenStore);

			tokenStore.set("old_at", "old_rt");

			responses.set("POST http://localhost:8000/api/v1/auth/refresh", {
				status: 200,
				body: {
					access_token: "new_at",
					refresh_token: "new_rt",
					token_type: "bearer",
				},
			});

			const result = await auth.refresh({
				refresh_token: "old_rt",
			});

			expect(result.access_token).toBe("new_at");
			expect(result.refresh_token).toBe("new_rt");
			expect(tokenStore.getAccess()).toBe("new_at");
			expect(tokenStore.getRefresh()).toBe("new_rt");
		});
	});

	describe("logout", () => {
		it("clears tokens locally", async () => {
			const { httpClient, responses } = createMockHttpClient();
			const tokenStore = createMockTokenStore();
			const auth = new AuthService(httpClient, BASE, tokenStore);

			tokenStore.set("at", "rt");

			responses.set("POST http://localhost:8000/api/v1/auth/logout", {
				status: 200,
				body: { message: "Logged out" },
			});

			await auth.logout();

			expect(tokenStore.getAccess()).toBeNull();
			expect(tokenStore.getRefresh()).toBeNull();
		});

		it("clears tokens even if server request fails", async () => {
			const { httpClient } = createMockHttpClient();
			const tokenStore = createMockTokenStore();
			const auth = new AuthService(httpClient, BASE, tokenStore);

			tokenStore.set("at", "rt");

			// No response registered — will return 404, logout should still clear
			await auth.logout();

			expect(tokenStore.getAccess()).toBeNull();
			expect(tokenStore.getRefresh()).toBeNull();
		});
	});

	describe("getMe", () => {
		it("sends GET to /auth/me and returns user", async () => {
			const { httpClient, responses } = createMockHttpClient();
			const tokenStore = createMockTokenStore();
			const auth = new AuthService(httpClient, BASE, tokenStore);

			tokenStore.set("at", "rt");

			responses.set("GET http://localhost:8000/api/v1/auth/me", {
				status: 200,
				body: {
					id: "u1",
					email: "a@b.com",
					full_name: "Alice",
					avatar_url: null,
					is_verified: true,
					is_active: true,
					mfa_enabled: false,
					created_at: "2026-01-01T00:00:00Z",
					organizations: [],
				},
			});

			const user = await auth.getMe();

			expect(user.email).toBe("a@b.com");
			expect(user.full_name).toBe("Alice");
		});
	});

	describe("isAuthenticated", () => {
		it("returns true when access token exists", () => {
			const tokenStore = createMockTokenStore();
			const auth = new AuthService(
				vi.fn() as unknown as HttpClient,
				BASE,
				tokenStore,
			);

			tokenStore.set("at", "rt");
			expect(auth.isAuthenticated()).toBe(true);
		});

		it("returns false when no access token", () => {
			const tokenStore = createMockTokenStore();
			const auth = new AuthService(
				vi.fn() as unknown as HttpClient,
				BASE,
				tokenStore,
			);

			expect(auth.isAuthenticated()).toBe(false);
		});
	});

	describe("refreshIfNeeded", () => {
		it("returns null when no refresh token", async () => {
			const { httpClient } = createMockHttpClient();
			const tokenStore = createMockTokenStore();
			const auth = new AuthService(httpClient, BASE, tokenStore);

			const result = await auth.refreshIfNeeded();
			expect(result).toBeNull();
		});

		it("refreshes when refresh token exists", async () => {
			const { httpClient, responses } = createMockHttpClient();
			const tokenStore = createMockTokenStore();
			const auth = new AuthService(httpClient, BASE, tokenStore);

			tokenStore.set("old_at", "valid_rt");

			responses.set("POST http://localhost:8000/api/v1/auth/refresh", {
				status: 200,
				body: {
					access_token: "new_at",
					refresh_token: "new_rt",
					token_type: "bearer",
				},
			});

			const result = await auth.refreshIfNeeded();
			expect(result).not.toBeNull();
			expect(result?.access_token).toBe("new_at");
		});

		it("returns null when refresh fails", async () => {
			const { httpClient } = createMockHttpClient();
			const tokenStore = createMockTokenStore();
			const auth = new AuthService(httpClient, BASE, tokenStore);

			tokenStore.set("old_at", "expired_rt");

			// No response for refresh — will 404
			const result = await auth.refreshIfNeeded();
			expect(result).toBeNull();
		});
	});
});
