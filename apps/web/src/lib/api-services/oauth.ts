import { API_ENDPOINTS } from "@/lib/config";
import { type TokenPair, TokenPairSchema } from "@/schemas";
import api from "../api";
import { snakeCaseSchema } from "../utils";

export const oauthService = {
	googleLogin: () => {
		window.location.href = API_ENDPOINTS.oauth.google;
	},

	githubLogin: () => {
		window.location.href = API_ENDPOINTS.oauth.github;
	},

	googleCallback: async (code: string): Promise<TokenPair> => {
		const res = await api.get<any>(
			`${API_ENDPOINTS.oauth.googleCallback}?code=${code}`,
		);

		return snakeCaseSchema(TokenPairSchema).parse(res.data);
	},

	githubCallback: async (code: string): Promise<TokenPair> => {
		const res = await api.get<any>(
			`${API_ENDPOINTS.oauth.githubCallback}?code=${code}`,
		);

		return snakeCaseSchema(TokenPairSchema).parse(res.data);
	},
};
