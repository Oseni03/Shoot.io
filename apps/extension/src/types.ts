import type {
	LoginRequest,
	MfaPendingResponse,
	PasswordResetConfirm,
	PasswordResetRequest,
	RegisterRequest,
	TokenPair,
	UserResponse,
} from "shared";

export type PopupMessage =
	| { type: "LOGIN"; payload: LoginRequest }
	| { type: "REGISTER"; payload: RegisterRequest }
	| { type: "MFA_VALIDATE"; payload: { code: string; mfaToken: string } }
	| { type: "FORGOT_PASSWORD"; payload: PasswordResetRequest }
	| { type: "RESET_PASSWORD"; payload: PasswordResetConfirm }
	| { type: "GET_ME" }
	| { type: "LOGOUT" }
	| {
			type: "API_REQUEST";
			payload: { path: string; method?: string; body?: unknown };
	  };

export type PopupResponse =
	| { success: true; data: TokenPair & { user?: UserResponse } }
	| { success: true; data: MfaPendingResponse; mfaPending: true }
	| { success: true; data: UserResponse }
	| { success: true; data: { message: string } }
	| { success: true; data: null }
	| { success: true; data: unknown }
	| {
			success: false;
			error: string;
			code?: string;
			fields?: Record<string, string[]>;
	  };
