export function extractApiErrorMessage(
	error: unknown,
	fallback = "An unexpected error occurred",
): string {
	if (error instanceof Error) return error.message;

	if (error && typeof error === "object") {
		const err = error as Record<string, unknown>;

		if ("response" in err) {
			const response = err.response as
				| Record<string, unknown>
				| undefined;
			const data = response?.data as Record<string, unknown> | undefined;
			if (typeof data?.error === "string") return data.error;
			if (typeof data?.detail === "string") return data.detail;
			if (typeof data?.message === "string") return data.message;
		}

		if ("message" in err && typeof err.message === "string")
			return err.message;
	}

	return fallback;
}
