import { z } from "zod";
import { API_ENDPOINTS } from "@/lib/config";
import api from "../api";
import { snakeCaseSchema } from "../utils";

export const healthService = {
	getHealth: async (): Promise<{
		status: string;
		app: string;
	}> => {
		const res = await api.get<any>(API_ENDPOINTS.health.health);

		return snakeCaseSchema(
			z.object({
				status: z.string(),
				app: z.string(),
			}),
		).parse(res.data);
	},

	getReady: async (): Promise<{
		status: string;
	}> => {
		const res = await api.get<any>(API_ENDPOINTS.health.ready);

		return snakeCaseSchema(
			z.object({
				status: z.string(),
			}),
		).parse(res.data);
	},
};
