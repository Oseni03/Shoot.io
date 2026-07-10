import { z } from "zod";

export const StatResponseSchema = z.object({
	user: z.object({
		total: z.number().nullable(),
		verified: z.number().nullable(),
	}),
	organizations: z.object({
		total: z.number().nullable(),
	}),
});

export type StatsResponse = z.infer<typeof StatResponseSchema>;
