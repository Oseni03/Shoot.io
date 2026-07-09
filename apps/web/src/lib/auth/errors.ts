export class AuthError extends Error {
	readonly status: number;
	readonly code: string;

	constructor(message: string, status: number, code?: string) {
		super(message);
		this.name = "AuthError";
		this.status = status;
		this.code = code ?? "UNKNOWN";
	}
}

export class AuthNetworkError extends AuthError {
	readonly cause: unknown;

	constructor(message: string, cause: unknown) {
		super(message, 0, "NETWORK");
		this.name = "AuthNetworkError";
		this.cause = cause;
	}
}

export class AuthValidationError extends AuthError {
	readonly fields?: Record<string, string[]>;

	constructor(
		message: string,
		statusCode: number,
		code?: string,
		fields?: Record<string, string[]>,
	) {
		super(message, statusCode, code ?? "VALIDATION");
		this.name = "AuthValidationError";
		this.fields = fields;
	}
}

export class AuthSessionError extends AuthError {
	constructor(
		message: string,
		statusCode: number,
		code: string = "UNAUTHORIZED",
	) {
		super(message, statusCode, code);
		this.name = "AuthSessionError";
	}
}

export function extractApiError(err: unknown): AuthError {
	if (err instanceof AuthError) return err;

	if (err && typeof err === "object" && "isAxiosError" in err) {
		const axiosErr = err as any;
		const response = axiosErr.response;

		if (!response) {
			return new AuthNetworkError(
				axiosErr.message || "Network error",
				err,
			);
		}

		const status = response.status;
		const body = response.data || {};

		if (status === 401) {
			const code = body?.code ?? "UNAUTHORIZED";
			return new AuthSessionError(
				body?.error || body?.detail || "Unauthorized",
				status,
				code,
			);
		}

		if ([400, 422, 409, 429].includes(status)) {
			return new AuthValidationError(
				body?.error || body?.detail || "Validation error",
				status,
				body?.code,
				body?.fields,
			);
		}

		return new AuthValidationError(
			body?.error || body?.detail || body?.message || "Request failed",
			status,
			body?.code,
		);
	}

	return new AuthNetworkError(
		err instanceof Error ? err.message : "An unexpected error occurred",
		err,
	);
}
