import { useMutation, useQuery } from "@tanstack/react-query";

import { authService } from "@/lib/auth";
import type {
	LoginRequest,
	RegisterRequest,
	VerifyEmailRequest,
	PasswordResetRequest,
	PasswordResetConfirm,
	UserResponse,
	TokenPair,
	MfaPendingResponse,
} from "@/schemas";
import type { AuthError } from "@/lib/auth";
import type { SignupResponse } from "@/lib/auth";
import { ROUTES, QUERY_KEYS } from "@/lib/config";

export const ME_KEY = QUERY_KEYS.me;

export function useLogin() {
	return useMutation<(TokenPair & { user?: UserResponse }) | MfaPendingResponse, AuthError, LoginRequest>({
		mutationFn: (data: LoginRequest) => authService.login(data),
	});
}

export function useSignup() {
	return useMutation<SignupResponse, AuthError, RegisterRequest>({
		mutationFn: (data: RegisterRequest) => authService.register(data),
	});
}

export function useRefreshToken() {
	return useMutation<TokenPair, AuthError, { refresh_token: string }>({
		mutationFn: (data: { refresh_token: string }) =>
			authService.refresh(data),
	});
}

export function useLogout() {
	return useMutation<void, AuthError, void>({
		mutationFn: () => authService.logout(),
		onSuccess: () => {
			if (typeof window !== "undefined") {
				window.location.href = ROUTES.login;
			}
		},
	});
}

export function useVerifyEmail() {
	return useMutation<UserResponse, AuthError, VerifyEmailRequest>({
		mutationFn: (data: VerifyEmailRequest) => authService.verifyEmail(data),
	});
}

export function useForgotPassword() {
	return useMutation<{ message: string }, AuthError, PasswordResetRequest>({
		mutationFn: (data: PasswordResetRequest) =>
			authService.forgotPassword(data),
	});
}

export function useResetPassword() {
	return useMutation<UserResponse, AuthError, PasswordResetConfirm>({
		mutationFn: (data: PasswordResetConfirm) =>
			authService.resetPassword(data),
	});
}

export function useMe() {
	return useQuery<UserResponse, AuthError>({
		queryKey: ME_KEY,
		queryFn: ({ signal }) => authService.getMe({ signal }),
		retry: (failureCount, error) => {
			if (error?.status === 0 && failureCount < 2) return true;
			return false;
		},
		staleTime: Infinity,
	});
}

export function useIsAuthenticated(): boolean {
	return authService.isAuthenticated();
}
