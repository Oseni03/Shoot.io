import { z } from "zod";
import { API_ENDPOINTS } from "@/lib/config";
import { type TokenPair, TokenPairSchema } from "@/schemas";
import api from "../api";
import { snakeCaseSchema } from "../utils";

export const mfaService = {
	setup: async (): Promise<{
		secret: string;
		otpauth_url: string;
		message?: string;
	}> => {
		const res = await api.post<any>(API_ENDPOINTS.mfa.setup);

		return snakeCaseSchema(
			z.object({
				secret: z.string(),
				otpauth_url: z.string(),
				message: z.string().optional(),
			}),
		).parse(res.data);
	},

	verify: async (code: string): Promise<void> => {
		await api.post<any>(API_ENDPOINTS.mfa.verify, { code });
	},

	disable: async (code: string): Promise<void> => {
		await api.post<any>(API_ENDPOINTS.mfa.disable, { code });
	},

	validate: async (
		code: string,
		pendingToken?: string,
	): Promise<TokenPair> => {
		const res = await api.post<any>(API_ENDPOINTS.mfa.validate, {
			code,
			mfa_pending: pendingToken,
		});

		return snakeCaseSchema(TokenPairSchema).parse(res.data);
	},
};
