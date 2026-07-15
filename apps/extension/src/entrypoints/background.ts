import {
	AuthError,
	AuthNetworkError,
	AuthService,
	AuthSessionError,
	AuthValidationError,
	PROJECT,
	snakeCaseSchema,
	TokenPairSchema,
} from "shared";
import { chromeTokenStore, initializeTokenStore } from "../token-store";
import type { PopupMessage, PopupResponse } from "../types";

const API_BASE = import.meta.env.VITE_API_URL as string;

const authService = new AuthService(
	fetch.bind(globalThis),
	API_BASE,
	chromeTokenStore,
);

await initializeTokenStore();

let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
	if (refreshPromise) return refreshPromise;

	refreshPromise = (async () => {
		try {
			const result = await authService.refreshIfNeeded();
			return result !== null;
		} catch {
			return false;
		} finally {
			refreshPromise = null;
		}
	})();

	return refreshPromise;
}

chrome.alarms.create("token-refresh", { periodInMinutes: 15 });

chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === "token-refresh") {
		attemptRefresh();
	}
});

chrome.runtime.onMessage.addListener(
	(
		message: PopupMessage,
		_sender: chrome.runtime.MessageSender,
		sendResponse: (response: unknown) => void,
	) => {
		handleMessage(message, sendResponse);
		return true;
	},
);

async function handleMessage(
	message: PopupMessage,
	sendResponse: (response: unknown) => void,
): Promise<void> {
	try {
		switch (message.type) {
			case "LOGIN": {
				const result = await authService.login(message.payload);
				const mfaPending = "mfa_pending" in result;
				if (mfaPending) {
					sendResponse({
						success: true,
						data: result,
						mfaPending: true,
					});
				} else {
					sendResponse({ success: true, data: result });
				}
				break;
			}

			case "REGISTER": {
				const result = await authService.register(message.payload);
				sendResponse({ success: true, data: result });
				break;
			}

			case "MFA_VALIDATE": {
				const { code, mfaToken } = message.payload;
				const url = `${API_BASE}${"/mfa/validate"}?code=${encodeURIComponent(code)}`;

				const response = await fetch(url, {
					method: "POST",
					headers: {
						Authorization: `${PROJECT.tokenType} ${mfaToken}`,
					},
				});

				let body: unknown;
				try {
					body = await response.json();
				} catch {
					body = {};
				}

				if (!response.ok) {
					const detail =
						(body as Record<string, unknown>)?.detail ??
						(body as Record<string, unknown>)?.message ??
						"MFA validation failed";
					sendResponse({ success: false, error: String(detail) });
					return;
				}

				const tokens = snakeCaseSchema(TokenPairSchema).parse(body);
				chromeTokenStore.set(tokens.access_token, tokens.refresh_token);

				const user = await authService.getMe();
				sendResponse({
					success: true,
					data: { ...tokens, user },
				});
				break;
			}

			case "FORGOT_PASSWORD": {
				const result = await authService.forgotPassword(
					message.payload,
				);
				sendResponse({ success: true, data: result });
				break;
			}

			case "RESET_PASSWORD": {
				const result = await authService.resetPassword(message.payload);
				sendResponse({ success: true, data: result });
				break;
			}

			case "GET_ME": {
				const user = await authService.getMe();
				sendResponse({ success: true, data: user });
				break;
			}

			case "LOGOUT": {
				await authService.logout();
				sendResponse({ success: true, data: null });
				break;
			}

			case "REFRESH": {
				const refreshed = await attemptRefresh();
				if (refreshed) {
					sendResponse({ success: true, data: null });
				} else {
					sendResponse({
						success: false,
						error: "Session expired",
					});
				}
				break;
			}

			case "API_REQUEST": {
				const { path, method, body } = message.payload;
				const access = chromeTokenStore.getAccess();
				if (!access) {
					sendResponse({
						success: false,
						error: "Not authenticated",
						code: "UNAUTHORIZED",
					});
					return;
				}

				const url = `${API_BASE}${path}`;
				const headers: Record<string, string> = {
					Authorization: `${PROJECT.tokenType} ${access}`,
					"Content-Type": "application/json",
				};

				const init: RequestInit & { headers: Record<string, string> } =
					{
						method: method ?? "GET",
						headers,
					};
				if (body) init.body = JSON.stringify(body);

				const response = await fetch(url, init);
				let responseBody: unknown;
				try {
					responseBody = await response.json();
				} catch {
					responseBody = {};
				}

				if (!response.ok) {
					const detail =
						(responseBody as Record<string, unknown>)?.detail ??
						(responseBody as Record<string, unknown>)?.message ??
						`Request failed with status ${response.status}`;
					sendResponse({ success: false, error: String(detail) });
					return;
				}

				sendResponse({ success: true, data: responseBody });
				break;
			}

			case "SHOOT_JOB": {
				const { jobDescriptionText, sourceUrl, jobTitle, company } =
					message.payload;
				const access = chromeTokenStore.getAccess();
				if (!access) {
					sendResponse({
						success: false,
						error: "Not authenticated",
						code: "UNAUTHORIZED",
					});
					return;
				}

				const url = `${API_BASE}/resumes/shoot`;
				const body = {
					job_description_text: jobDescriptionText,
					source_url: sourceUrl,
					job_title: jobTitle,
					company,
				};

				const doFetch = async (token: string) => {
					return await fetch(url, {
						method: "POST",
						headers: {
							Authorization: `${PROJECT.tokenType} ${token}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify(body),
					});
				};

				let response = await doFetch(access);

				if (response.status === 401) {
					const refreshed = await attemptRefresh();
					if (refreshed) {
						const newAccess = chromeTokenStore.getAccess();
						if (newAccess) {
							response = await doFetch(newAccess);
						}
					}
				}

				let responseBody: unknown;
				try {
					responseBody = await response.json();
				} catch {
					responseBody = {};
				}

				if (!response.ok) {
					const detail =
						(responseBody as Record<string, unknown>)?.detail ??
						(responseBody as Record<string, unknown>)?.message ??
						`Shoot failed with status ${response.status}`;
					sendResponse({ success: false, error: String(detail) });
					return;
				}

				sendResponse({ success: true, data: responseBody });
				break;
			}

			default:
				sendResponse({
					success: false,
					error: `Unknown message type: ${(message as Record<string, string>).type}`,
				});
		}
	} catch (err: unknown) {
		const errorResponse: PopupResponse & { success: false } = {
			success: false,
			error: "An unexpected error occurred",
		};

		if (err instanceof AuthValidationError) {
			errorResponse.error = err.message;
			errorResponse.code = err.code;
			errorResponse.fields = err.fields;
		} else if (err instanceof AuthSessionError) {
			errorResponse.error = err.message;
			errorResponse.code = err.code;
		} else if (err instanceof AuthNetworkError) {
			errorResponse.error = err.message;
			errorResponse.code = "NETWORK";
		} else if (err instanceof AuthError) {
			errorResponse.error = err.message;
			errorResponse.code = err.code;
		} else if (err instanceof Error) {
			errorResponse.error = err.message;
		}

		sendResponse(errorResponse);
	}
}
