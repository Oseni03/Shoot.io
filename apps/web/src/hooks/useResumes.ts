import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	resumeService,
	type ShotsRemainingResponse,
} from "@/lib/api-services/resume";
import type { ResumeListEntry, ResumeResponse } from "@/schemas";

export const RESUMES_KEY = ["resumes"] as const;
export const RESUME_KEY = (id: string) => ["resumes", id] as const;

export function useResumes() {
	return useQuery<ResumeListEntry[]>({
		queryKey: RESUMES_KEY,
		queryFn: () => resumeService.list(),
	});
}

export function useResume(id: string | undefined) {
	return useQuery<ResumeResponse>({
		queryKey: RESUME_KEY(id!),
		queryFn: () => resumeService.getById(id!),
		enabled: !!id,
	});
}

export function useCreateResume() {
	const queryClient = useQueryClient();
	return useMutation<ResumeResponse, Error, Record<string, unknown>>({
		mutationFn: (data) => resumeService.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: RESUMES_KEY });
		},
	});
}

export function useUpdateResume() {
	const queryClient = useQueryClient();
	return useMutation<
		ResumeResponse,
		Error,
		{ id: string; data: Record<string, unknown> }
	>({
		mutationFn: ({ id, data }) => resumeService.update(id, data),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({ queryKey: RESUMES_KEY });
			queryClient.setQueryData(RESUME_KEY(updated.id), updated);
		},
	});
}

export function useDeleteResume() {
	const queryClient = useQueryClient();
	return useMutation<void, Error, string>({
		mutationFn: (id) => resumeService.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: RESUMES_KEY });
		},
	});
}

export function useSetMasterResume() {
	const queryClient = useQueryClient();
	return useMutation<ResumeResponse, Error, string>({
		mutationFn: (id) => resumeService.setMaster(id),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({ queryKey: RESUMES_KEY });
			queryClient.setQueryData(RESUME_KEY(updated.id), updated);
		},
	});
}

export const SHOTS_REMAINING_KEY = ["shots-remaining"] as const;

export function useShotsRemaining() {
	return useQuery<ShotsRemainingResponse>({
		queryKey: SHOTS_REMAINING_KEY,
		queryFn: () => resumeService.getShotsRemaining(),
		staleTime: 5 * 60 * 1000,
	});
}
