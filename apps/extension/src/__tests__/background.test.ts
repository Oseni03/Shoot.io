import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PopupMessage, PopupResponse } from "../types";

const mockStorage: Record<string, string> = {};
let capturedListener:
	| ((message: unknown, _sender: unknown, sendResponse: unknown) => void)
	| null = null;
const mockFetch = vi.fn();

beforeEach(() => {
	for (const key of Object.keys(mockStorage)) {
		delete mockStorage[key];
	}
	capturedListener = null;
	mockFetch.mockReset();

	(globalThis as Record<string, unknown>).chrome = {
		runtime: {
			onMessage: {
				addListener: vi.fn(
					(
						listener: (
							message: unknown,
							_sender: unknown,
							sendResponse: unknown,
						) => void,
					) => {
						capturedListener = listener;
					},
				),
			},
		},
		storage: {
			local: {
				get: vi.fn(
					(
						_keys:
							| string
							| string[]
							| Record<string, unknown>
							| null,
						callback: (result: Record<string, string>) => void,
					) => {
						callback(mockStorage);
					},
				),
				set: vi.fn(
					(items: Record<string, string>, callback?: () => void) => {
						for (const [key, value] of Object.entries(items)) {
							mockStorage[key] = value;
						}
						callback?.();
					},
				),
				remove: vi.fn(
					(keys: string | string[], callback?: () => void) => {
						for (const key of Array.isArray(keys) ? keys : [keys]) {
							delete mockStorage[key];
						}
						callback?.();
					},
				),
			},
		},
	} as unknown as typeof chrome;

	mockFetch.mockImplementation(
		(url: string, init?: { method?: string; body?: string }) => {
			const method = init?.method ?? "GET";
			console.log(`fetch: ${method} ${url}`);
			return Promise.resolve({
				status: 404,
				ok: false,
				json: () => Promise.resolve({ detail: "Not found" }),
			});
		},
	);
	globalThis.fetch = mockFetch;
});

async function loadBackground() {
	vi.resetModules();
	await import("../entrypoints/background");
}

function invokeHandler(message: PopupMessage): Promise<PopupResponse> {
	return new Promise((resolve) => {
		const sendResponse = (response: unknown) => {
			resolve(response as PopupResponse);
		};
		capturedListener?.(
			message,
			null as unknown as chrome.runtime.MessageSender,
			sendResponse,
		);
	});
}

function registerFetchResponse(
	method: string,
	urlSuffix: string,
	status: number,
	body: unknown,
) {
	mockFetch.mockImplementation((url: string, init?: { method?: string }) => {
		const reqMethod = init?.method ?? "GET";
		if (url.endsWith(urlSuffix) && reqMethod === method) {
			return Promise.resolve({
				status,
				ok: status >= 200 && status < 300,
				json: () => Promise.resolve(body),
			});
		}
		return Promise.resolve({
			status: 404,
			ok: false,
			json: () => Promise.resolve({ detail: "Not found" }),
		});
	});
}

describe("background message handlers", () => {
	beforeEach(async () => {
		await loadBackground();
	});

	describe("REGISTER", () => {
		it("calls register endpoint and stores tokens", async () => {
			registerFetchResponse("POST", "/auth/register", 201, {
				access_token: "at_reg",
				refresh_token: "rt_reg",
				token_type: "bearer",
				user: {
					id: "u1",
					email: "a@b.com",
					full_name: "Alice",
					avatar_url: null,
					is_verified: false,
					is_active: true,
					mfa_enabled: false,
					created_at: "2026-01-01T00:00:00Z",
					organizations: [],
				},
			});

			const response = await invokeHandler({
				type: "REGISTER",
				payload: {
					email: "a@b.com",
					password: "Strong1",
					full_name: "Alice",
				},
			});

			expect(response.success).toBe(true);
			if (response.success) {
				const data = response.data as Record<string, unknown>;
				expect(data.access_token).toBe("at_reg");
			}
			expect(mockStorage.access_token).toBe("at_reg");
		});

		it("returns error on 409 conflict", async () => {
			registerFetchResponse("POST", "/auth/register", 409, {
				detail: "Email already registered",
				fields: { email: ["Email already registered"] },
			});

			const response = await invokeHandler({
				type: "REGISTER",
				payload: { email: "taken@b.com", password: "Strong1" },
			});

			expect(response.success).toBe(false);
			if (!response.success) {
				expect(response.error).toContain("already registered");
			}
		});
	});

	describe("MFA_VALIDATE", () => {
		it("validates TOTP and returns tokens with user", async () => {
			mockFetch.mockImplementation(
				(url: string, init?: { method?: string }) => {
					if (
						url.includes("/mfa/validate") &&
						init?.method === "POST"
					) {
						return Promise.resolve({
							status: 200,
							ok: true,
							json: () =>
								Promise.resolve({
									access_token: "at_mfa",
									refresh_token: "rt_mfa",
									token_type: "bearer",
								}),
						});
					}
					if (url.includes("/auth/me")) {
						return Promise.resolve({
							status: 200,
							ok: true,
							json: () =>
								Promise.resolve({
									id: "u1",
									email: "a@b.com",
									full_name: "Alice",
									avatar_url: null,
									is_verified: true,
									is_active: true,
									mfa_enabled: true,
									created_at: "2026-01-01T00:00:00Z",
									organizations: [],
								}),
						});
					}
					return Promise.resolve({
						status: 404,
						ok: false,
						json: () => Promise.resolve({ detail: "Not found" }),
					});
				},
			);

			const response = await invokeHandler({
				type: "MFA_VALIDATE",
				payload: { code: "123456", mfaToken: "mfa_token_val" },
			});

			expect(response.success).toBe(true);
			if (response.success) {
				const data = response.data as Record<string, unknown>;
				expect(data.access_token).toBe("at_mfa");
				expect(data.user).toBeDefined();
			}
			expect(mockStorage.access_token).toBe("at_mfa");
		});

		it("returns error on invalid TOTP", async () => {
			mockFetch.mockImplementation(
				(url: string, init?: { method?: string }) => {
					if (
						url.includes("/mfa/validate") &&
						init?.method === "POST"
					) {
						return Promise.resolve({
							status: 401,
							ok: false,
							json: () =>
								Promise.resolve({
									detail: "Invalid or expired TOTP code.",
								}),
						});
					}
					return Promise.resolve({
						status: 404,
						ok: false,
						json: () => Promise.resolve({ detail: "Not found" }),
					});
				},
			);

			const response = await invokeHandler({
				type: "MFA_VALIDATE",
				payload: { code: "000000", mfaToken: "bad_token" },
			});

			expect(response.success).toBe(false);
			if (!response.success) {
				expect(response.error).toContain(
					"Invalid or expired TOTP code",
				);
			}
		});
	});

	describe("FORGOT_PASSWORD", () => {
		it("sends forgot password request", async () => {
			registerFetchResponse("POST", "/auth/forgot-password", 200, {
				message: "Password reset email sent",
			});

			const response = await invokeHandler({
				type: "FORGOT_PASSWORD",
				payload: { email: "a@b.com" },
			});

			expect(response.success).toBe(true);
		});
	});

	describe("RESET_PASSWORD", () => {
		it("sends reset password request", async () => {
			registerFetchResponse("POST", "/auth/reset-password", 200, {
				id: "u1",
				email: "a@b.com",
				full_name: "Alice",
				avatar_url: null,
				is_verified: true,
				is_active: true,
				mfa_enabled: false,
				created_at: "2026-01-01T00:00:00Z",
				organizations: [],
			});

			const response = await invokeHandler({
				type: "RESET_PASSWORD",
				payload: { token: "reset_token", new_password: "NewStrong1" },
			});

			expect(response.success).toBe(true);
		});
	});

	describe("GET_ME", () => {
		it("returns user when authenticated", async () => {
			mockStorage.access_token = "at";
			mockStorage.refresh_token = "rt";

			registerFetchResponse("GET", "/auth/me", 200, {
				id: "u1",
				email: "a@b.com",
				full_name: "Alice",
				avatar_url: null,
				is_verified: true,
				is_active: true,
				mfa_enabled: false,
				created_at: "2026-01-01T00:00:00Z",
				organizations: [],
			});

			const response = await invokeHandler({ type: "GET_ME" });

			expect(response.success).toBe(true);
			if (response.success) {
				const data = response.data as Record<string, unknown>;
				expect(data.email).toBe("a@b.com");
			}
		});
	});

	describe("LOGIN", () => {
		it("returns user on successful login", async () => {
			registerFetchResponse("POST", "/auth/login", 200, {
				access_token: "at_login",
				refresh_token: "rt_login",
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
			});

			const response = await invokeHandler({
				type: "LOGIN",
				payload: { email: "a@b.com", password: "Strong1" },
			});

			expect(response.success).toBe(true);
			expect(mockStorage.access_token).toBe("at_login");
		});

		it("returns mfaPending when MFA is required", async () => {
			registerFetchResponse("POST", "/auth/login", 200, {
				mfa_pending: "mfa_token_123",
				expires_in: 300,
			});

			const response = await invokeHandler({
				type: "LOGIN",
				payload: { email: "a@b.com", password: "Strong1" },
			});

			expect(response.success).toBe(true);
			if (response.success && "mfaPending" in response) {
				expect(response.mfaPending).toBe(true);
			}
			expect(mockStorage.access_token).toBeUndefined();
		});

		it("returns error on invalid credentials", async () => {
			registerFetchResponse("POST", "/auth/login", 401, {
				detail: "Invalid credentials",
			});

			const response = await invokeHandler({
				type: "LOGIN",
				payload: { email: "a@b.com", password: "wrong" },
			});

			expect(response.success).toBe(false);
			if (!response.success) {
				expect(response.error).toContain("Invalid credentials");
			}
		});
	});

	describe("LOGOUT", () => {
		it("clears tokens", async () => {
			mockStorage.access_token = "at";
			mockStorage.refresh_token = "rt";

			registerFetchResponse("POST", "/auth/logout", 200, {
				message: "Logged out",
			});

			const response = await invokeHandler({ type: "LOGOUT" });

			expect(response.success).toBe(true);
			expect(mockStorage.access_token).toBeUndefined();
			expect(mockStorage.refresh_token).toBeUndefined();
		});
	});

	describe("API_REQUEST", () => {
		describe("authenticated", () => {
			beforeEach(async () => {
				mockStorage.access_token = "at_valid";
				mockStorage.refresh_token = "rt_valid";
				const { initializeTokenStore } = await import("../token-store");
				await initializeTokenStore();
			});

			it("makes a GET request with auth token", async () => {
				registerFetchResponse("GET", "/organizations/org1", 200, {
					id: "org1",
					name: "Test Org",
					slug: "test-org",
					plan: "free",
					member_count: 3,
					logo_url: null,
					created_at: "2026-01-01T00:00:00Z",
				});

				const response = await invokeHandler({
					type: "API_REQUEST",
					payload: { path: "/organizations/org1" },
				});

				expect(response.success).toBe(true);
				if (response.success) {
					const data = response.data as Record<string, unknown>;
					expect(data.name).toBe("Test Org");
					expect(data.member_count).toBe(3);
				}
			});

			it("returns error on API failure", async () => {
				mockFetch.mockImplementation(
					(url: string, init?: { method?: string }) => {
						const method = init?.method ?? "GET";
						if (
							url.includes("/organizations/bad") &&
							method === "GET"
						) {
							return Promise.resolve({
								status: 404,
								ok: false,
								json: () =>
									Promise.resolve({
										detail: "Organization not found",
									}),
							});
						}
						return Promise.resolve({
							status: 404,
							ok: false,
							json: () =>
								Promise.resolve({ detail: "Not found" }),
						});
					},
				);

				const response = await invokeHandler({
					type: "API_REQUEST",
					payload: { path: "/organizations/bad" },
				});

				expect(response.success).toBe(false);
				if (!response.success) {
					expect(response.error).toContain("Organization not found");
				}
			});

			it("makes a POST request with body", async () => {
				registerFetchResponse("POST", "/test", 201, {
					message: "Created",
				});

				const response = await invokeHandler({
					type: "API_REQUEST",
					payload: {
						path: "/test",
						method: "POST",
						body: { name: "test" },
					},
				});

				expect(response.success).toBe(true);
				if (response.success) {
					const data = response.data as Record<string, unknown>;
					expect(data.message).toBe("Created");
				}
			});
		});

		describe("unauthenticated", () => {
			it("returns error when not authenticated", async () => {
				const response = await invokeHandler({
					type: "API_REQUEST",
					payload: { path: "/organizations/org1" },
				});

				expect(response.success).toBe(false);
				if (!response.success) {
					expect(response.code).toBe("UNAUTHORIZED");
				}
			});
		});
	});
});
