import axios from "axios";
import type { HttpClient } from "shared";
import { API_ENDPOINTS, ENV, PROJECT, ROUTES, STORAGE_KEYS } from "@/lib/config";

export const tokenStore = {
	getAccess: (): string | null => {
		if (typeof window === "undefined") return null;
		return localStorage.getItem(STORAGE_KEYS.accessToken);
	},

	getRefresh: (): string | null => {
		if (typeof window === "undefined") return null;
		return localStorage.getItem(STORAGE_KEYS.refreshToken);
	},

	set: (access: string, refresh: string): void => {
		if (typeof window === "undefined") return;
		localStorage.setItem(STORAGE_KEYS.accessToken, access);
		localStorage.setItem(STORAGE_KEYS.refreshToken, refresh);
		document.cookie = `${STORAGE_KEYS.loggedIn}=true; path=/; SameSite=Strict; max-age=604800`;
	},

	clear: (): void => {
		if (typeof window === "undefined") return;
		localStorage.removeItem(STORAGE_KEYS.accessToken);
		localStorage.removeItem(STORAGE_KEYS.refreshToken);
		document.cookie = `${STORAGE_KEYS.loggedIn}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
	},
};

const api = axios.create({
	baseURL: ENV.apiUrl,
	headers: {
		"Content-Type": "application/json",
	},
});

api.interceptors.request.use(
	(config) => {
		const token = tokenStore.getAccess();
		if (token) {
			config.headers.Authorization = `${PROJECT.tokenType} ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

interface QueueItem {
	resolve: (token: string) => void;
	reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null = null) {
	failedQueue.forEach(({ resolve, reject }) => {
		if (error) {
			reject(error);
		} else {
			resolve(token!);
		}
	});
	failedQueue = [];
}

function redirectToLogin() {
	if (typeof window !== "undefined") {
		if (!ROUTES.publicPaths.includes(window.location.pathname)) {
			window.location.href = ROUTES.login;
		}
	}
}

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (!originalRequest) return Promise.reject(error);

		if (error.response?.status === 401) {
			const isRefreshRequest =
				typeof originalRequest.url === "string" &&
				originalRequest.url.includes(API_ENDPOINTS.auth.refresh);

			if (isRefreshRequest || (originalRequest as Record<string, unknown>)._retry) {
				tokenStore.clear();
				redirectToLogin();
				return Promise.reject(error);
			}

			const refreshToken = tokenStore.getRefresh();
			if (!refreshToken) {
				tokenStore.clear();
				redirectToLogin();
				return Promise.reject(error);
			}

			if (isRefreshing) {
				return new Promise<string>((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				}).then((token) => {
					originalRequest.headers.Authorization = `${PROJECT.tokenType} ${token}`;
					return api(originalRequest);
				});
			}

			(originalRequest as Record<string, unknown>)._retry = true;
			isRefreshing = true;

			try {
				const response = await api.post(API_ENDPOINTS.auth.refresh, {
					refresh_token: refreshToken,
				});
				const data = response.data as Record<string, unknown>;
				if (
					typeof data.access_token !== "string" ||
					typeof data.refresh_token !== "string"
				) {
					throw new Error("Invalid refresh response");
				}
				const { access_token, refresh_token } = data as {
					access_token: string;
					refresh_token: string;
				};
				tokenStore.set(access_token, refresh_token);
				processQueue(null, access_token);
				originalRequest.headers.Authorization = `${PROJECT.tokenType} ${access_token}`;
				return api(originalRequest);
			} catch (refreshError) {
				processQueue(refreshError, null);
				tokenStore.clear();
				redirectToLogin();
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		return Promise.reject(error);
	},
);

export function axiosHttpClient(
	url: string,
	init?: {
		method?: string;
		headers?: Record<string, string>;
		body?: string;
		signal?: AbortSignal;
	},
): ReturnType<HttpClient> {
	return api
		.request({
			url,
			method: init?.method ?? "GET",
			headers: init?.headers,
			data: init?.body ? JSON.parse(init.body) : undefined,
			signal: init?.signal,
			transformResponse: (data) => data,
		})
		.then((response) => ({
			status: response.status,
			ok: response.status >= 200 && response.status < 300,
			json: () => {
				try {
					return Promise.resolve(JSON.parse(response.data as string));
				} catch {
					return Promise.resolve({});
				}
			},
		}));
}

export default api;
