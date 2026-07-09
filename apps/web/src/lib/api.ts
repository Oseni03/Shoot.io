import axios from "axios";
import { ENV, STORAGE_KEYS, ROUTES, PROJECT } from "@/lib/config";

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
		document.cookie = `${STORAGE_KEYS.accessToken}=${access}; path=/; SameSite=Strict; max-age=604800`;
	},

	clear: (): void => {
		if (typeof window === "undefined") return;
		localStorage.removeItem(STORAGE_KEYS.accessToken);
		localStorage.removeItem(STORAGE_KEYS.refreshToken);
		document.cookie = `${STORAGE_KEYS.accessToken}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
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

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response?.status === 401) {
			tokenStore.clear();

			if (typeof window !== "undefined") {
				if (!ROUTES.publicPaths.includes(window.location.pathname)) {
					window.location.href = ROUTES.login;
				}
			}
		}
		return Promise.reject(error);
	},
);

export default api;
