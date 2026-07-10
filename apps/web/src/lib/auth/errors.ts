import {
	AuthError,
	AuthNetworkError,
	AuthSessionError,
	AuthValidationError,
	extractApiError as sharedExtractApiError,
} from "shared";

export { AuthError, AuthNetworkError, AuthSessionError, AuthValidationError };

export function extractApiError(err: unknown): AuthError {
	if (err instanceof AuthError) return err;

	if (err && typeof err === "object" && "isAxiosError" in err) {
		const axiosErr = err as Record<string, unknown>;
		const response = axiosErr.response as
			| { status: number; data: Record<string, unknown> }
			| undefined;

		if (!response) {
			return new AuthNetworkError(
				(axiosErr.message as string) || "Network error",
				err,
			);
		}

		const status = response.status;
		const body = response.data || {};

		if (status === 401) {
			const code = (body?.code as string) ?? "UNAUTHORIZED";
			return new AuthSessionError(
				(body?.error as string) ||
					(body?.detail as string) ||
					"Unauthorized",
				status,
				code,
			);
		}

		if ([400, 422, 409, 429].includes(status)) {
			return new AuthValidationError(
				(body?.error as string) ||
					(body?.detail as string) ||
					"Validation error",
				status,
				body?.code as string | undefined,
				body?.fields as Record<string, string[]> | undefined,
			);
		}

		return new AuthValidationError(
			(body?.error as string) ||
				(body?.detail as string) ||
				(body?.message as string) ||
				"Request failed",
			status,
			body?.code as string | undefined,
		);
	}

	return sharedExtractApiError(err);
}
