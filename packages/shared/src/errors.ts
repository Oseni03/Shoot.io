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

export interface HttpResponse {
	status: number;
	ok: boolean;
	json(): Promise<unknown>;
}

export type HttpClient = (
	url: string,
	init?: {
		method?: string;
		headers?: Record<string, string>;
		body?: string;
		signal?: AbortSignal;
	},
) => Promise<HttpResponse>;

export function extractApiError(err: unknown): AuthError {
	if (err instanceof AuthError) return err;

	if (err && typeof err === "object") {
		const obj = err as Record<string, unknown>;

		if ("status" in obj && typeof obj.status === "number") {
			const status = obj.status as number;
			const body = (obj.body as Record<string, unknown>) || {};

			if (status === 401) {
				const code =
					typeof body?.code === "string" ? body.code : "UNAUTHORIZED";
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

		if ("message" in obj && typeof obj.message === "string") {
			return new AuthNetworkError(obj.message as string, err);
		}
	}

	if (err instanceof Error) {
		return new AuthNetworkError(err.message, err);
	}

	return new AuthNetworkError("An unexpected error occurred", err);
}
