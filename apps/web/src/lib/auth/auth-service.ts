import { AuthService, type SignupResponse } from "shared";
import api, { axiosHttpClient, tokenStore } from "@/lib/api";
import { ENV } from "@/lib/config";

export { AuthService };
export type { SignupResponse };

export const authService = new AuthService(
	axiosHttpClient,
	ENV.apiUrl,
	tokenStore,
);
