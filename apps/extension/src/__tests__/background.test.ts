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

	const alarmListeners: Array<(alarm: { name: string }) => void> = [];
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
		alarms: {
			create: vi.fn(),
			onAlarm: {
				addListener: vi.fn(
					(listener: (alarm: { name: string }) => void) => {
						alarmListeners.push(listener);
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

	describe("REFRESH", () => {
		describe("authenticated", () => {
			beforeEach(async () => {
				mockStorage.access_token = "at_expired";
				mockStorage.refresh_token = "rt_valid";
				const { initializeTokenStore } = await import("../token-store");
				await initializeTokenStore();
			});

			it("refreshes tokens when refresh token is valid", async () => {
				registerFetchResponse("POST", "/auth/refresh", 200, {
					access_token: "at_new",
					refresh_token: "rt_new",
					token_type: "bearer",
				});

				const response = await invokeHandler({ type: "REFRESH" });

				expect(response.success).toBe(true);
				expect(mockStorage.access_token).toBe("at_new");
				expect(mockStorage.refresh_token).toBe("rt_new");
			});

			it("returns failure when API returns 401", async () => {
				registerFetchResponse("POST", "/auth/refresh", 401, {
					detail: "Invalid refresh token",
				});

				const response = await invokeHandler({ type: "REFRESH" });

				expect(response.success).toBe(false);
			});

			it("deduplicates concurrent refresh requests", async () => {
				let resolveSlowRefresh: (value: unknown) => void = () => {};
				const slowRefresh = new Promise((resolve) => {
					resolveSlowRefresh = resolve;
				});

				mockFetch.mockImplementation(
					(url: string, init?: { method?: string }) => {
						if (
							url.includes("/auth/refresh") &&
							init?.method === "POST"
						) {
							return slowRefresh.then(() =>
								Promise.resolve({
									status: 200,
									ok: true,
									json: () =>
										Promise.resolve({
											access_token: "at_slow",
											refresh_token: "rt_slow",
											token_type: "bearer",
										}),
								}),
							);
						}
						return Promise.resolve({
							status: 404,
							ok: false,
							json: () =>
								Promise.resolve({ detail: "Not found" }),
						});
					},
				);

				const p1 = invokeHandler({ type: "REFRESH" });
				const p2 = invokeHandler({ type: "REFRESH" });

				resolveSlowRefresh(undefined);

				const [r1, r2] = await Promise.all([p1, p2]);

				expect(r1.success).toBe(true);
				expect(r2.success).toBe(true);
				const refreshCalls = mockFetch.mock.calls.filter(
					(call: unknown[]) =>
						(call[0] as string).includes("/auth/refresh"),
				);
				expect(refreshCalls.length).toBe(1);
			});
		});

		describe("unauthenticated", () => {
			it("returns failure when no refresh token is stored", async () => {
				const response = await invokeHandler({ type: "REFRESH" });

				expect(response.success).toBe(false);
				if (!response.success) {
					expect(response.error).toBe("Session expired");
				}
			});
		});

		describe("alarm", () => {
			it("fires refresh when token-refresh alarm triggers", async () => {
				mockStorage.access_token = "at";
				mockStorage.refresh_token = "rt";
				const { initializeTokenStore } = await import("../token-store");
				await initializeTokenStore();

				registerFetchResponse("POST", "/auth/refresh", 200, {
					access_token: "at_alarm",
					refresh_token: "rt_alarm",
					token_type: "bearer",
				});

				const addListenerMock = (
					globalThis.chrome as unknown as {
						alarms: {
							onAlarm: { addListener: ReturnType<typeof vi.fn> };
						};
					}
				).alarms.onAlarm.addListener;

				const callback = addListenerMock.mock.calls[0][0] as (alarm: {
					name: string;
				}) => void;
				callback({ name: "token-refresh" });

				// Wait for microtask chain (attemptRefresh → refresh → store tokens)
				await new Promise<void>((resolve) => setTimeout(resolve, 0));

				expect(mockStorage.access_token).toBe("at_alarm");
				expect(mockStorage.refresh_token).toBe("rt_alarm");
			});
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

	describe("SHOOT_JOB", () => {
		describe("authenticated", () => {
			beforeEach(async () => {
				mockStorage.access_token = "at_valid";
				mockStorage.refresh_token = "rt_valid";
				const { initializeTokenStore } = await import("../token-store");
				await initializeTokenStore();
			});

			it("sends shoot request with job details and returns auto-fill fields", async () => {
				registerFetchResponse("POST", "/resumes/shoot", 200, {
					tailored_resume_id: "tr_123",
					auto_fill_fields: {
						summary: "Experienced engineer",
						skills: "Python, React",
					},
				});

				const response = await invokeHandler({
					type: "SHOOT_JOB",
					payload: {
						jobDescriptionText: "We need a Python developer",
						sourceUrl: "https://indeed.com/viewjob?jk=123",
						jobTitle: "Python Developer",
						company: "Tech Corp",
					},
				});

				expect(response.success).toBe(true);
				if (response.success) {
					const data = response.data as Record<string, unknown>;
					expect(data.tailored_resume_id).toBe("tr_123");
					expect(
						(data.auto_fill_fields as Record<string, string>).summary,
					).toBe("Experienced engineer");
				}
			});

			it("returns error on shoot failure", async () => {
				mockFetch.mockImplementation(
					(url: string, init?: { method?: string }) => {
						if (
							url.includes("/resumes/shoot") &&
							init?.method === "POST"
						) {
							return Promise.resolve({
								status: 402,
								ok: false,
								json: () =>
									Promise.resolve({
										detail:
											"Your plan allows 3 shots per month. Upgrade to PRO for unlimited shots.",
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
					type: "SHOOT_JOB",
					payload: {
						jobDescriptionText: "Test JD",
						sourceUrl: "https://indeed.com",
					},
				});

				expect(response.success).toBe(false);
				if (!response.success) {
					expect(response.error).toContain("Upgrade to PRO");
				}
			});
		});

		describe("unauthenticated", () => {
			it("returns error when not authenticated", async () => {
				const response = await invokeHandler({
					type: "SHOOT_JOB",
					payload: {
						jobDescriptionText: "Test JD",
						sourceUrl: "https://indeed.com",
					},
				});

				expect(response.success).toBe(false);
				if (!response.success) {
					expect(response.code).toBe("UNAUTHORIZED");
				}
			});
		});
	});
});
