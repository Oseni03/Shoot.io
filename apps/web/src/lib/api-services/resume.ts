import { z } from "zod";
import { API_ENDPOINTS } from "@/lib/config";
import {
	type ResumeListEntry,
	ResumeListEntrySchema,
	type ResumeResponse,
	ResumeResponseSchema,
} from "@/schemas";
import api from "../api";
import { snakeCaseSchema } from "../utils";

export type ShotsRemainingResponse = {
	shots_remaining: number | null;
	period_end: string;
};

export const resumeService = {
	list: async (): Promise<ResumeListEntry[]> => {
		const res = await api.get<any>(API_ENDPOINTS.resumes.root);
		return snakeCaseSchema(z.array(ResumeListEntrySchema)).parse(res.data);
	},

	getById: async (id: string): Promise<ResumeResponse> => {
		const res = await api.get<any>(API_ENDPOINTS.resumes.resume(id));
		return snakeCaseSchema(ResumeResponseSchema).parse(res.data);
	},

	create: async (data: Record<string, unknown>): Promise<ResumeResponse> => {
		const res = await api.post<any>(API_ENDPOINTS.resumes.root, data);
		return snakeCaseSchema(ResumeResponseSchema).parse(res.data);
	},

	update: async (
		id: string,
		data: Record<string, unknown>,
	): Promise<ResumeResponse> => {
		const res = await api.put<any>(API_ENDPOINTS.resumes.resume(id), data);
		return snakeCaseSchema(ResumeResponseSchema).parse(res.data);
	},

	getShotsRemaining: async (): Promise<ShotsRemainingResponse> => {
		const res = await api.get<any>(API_ENDPOINTS.resumes.shotsRemaining);
		return snakeCaseSchema(
			z.object({
				shots_remaining: z.number().nullable(),
				period_end: z.string(),
			}),
		).parse(res.data);
	},

	delete: async (id: string): Promise<void> => {
		await api.delete(API_ENDPOINTS.resumes.resume(id));
	},

	setMaster: async (id: string): Promise<ResumeResponse> => {
		const res = await api.post<any>(API_ENDPOINTS.resumes.setMaster(id));
		return snakeCaseSchema(ResumeResponseSchema).parse(res.data);
	},
};
