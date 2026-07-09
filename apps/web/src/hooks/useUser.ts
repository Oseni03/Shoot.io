import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { userService } from "@/lib/auth";
import type {
	UserResponse,
	UserUpdateRequest,
	ChangePasswordRequest,
} from "@/schemas";
import type { AuthError } from "@/lib/auth";

import { QUERY_KEYS } from "@/lib/config";
import { ME_KEY } from "./useAuth";

export const USER_KEY = QUERY_KEYS.user;

export function useMyProfile() {
	return useQuery<UserResponse, AuthError>({
		queryKey: USER_KEY,
		queryFn: ({ signal }) => userService.getProfile({ signal }),
		staleTime: 5 * 60 * 1000,
	});
}

export function useUpdateProfile() {
	const qc = useQueryClient();
	return useMutation<UserResponse, AuthError, UserUpdateRequest>({
		mutationFn: (data: UserUpdateRequest) =>
			userService.updateProfile(data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: USER_KEY });
			qc.invalidateQueries({ queryKey: ME_KEY });
		},
	});
}

export function useChangePassword() {
	return useMutation<void, AuthError, ChangePasswordRequest>({
		mutationFn: (data: ChangePasswordRequest) =>
			userService.changePassword(data),
	});
}

export function useDeleteAccount() {
	const qc = useQueryClient();
	return useMutation<void, AuthError, void>({
		mutationFn: () => userService.deleteAccount(),
		onSuccess: () => {
			qc.clear();
		},
	});
}
