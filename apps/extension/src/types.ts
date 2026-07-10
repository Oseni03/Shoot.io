import type {
	LoginRequest,
	MfaPendingResponse,
	TokenPair,
	UserResponse,
} from "shared";

export type PopupMessage =
	| { type: "LOGIN"; payload: LoginRequest }
	| { type: "GET_ME" }
	| { type: "LOGOUT" };

export type PopupResponse =
	| { success: true; data: TokenPair & { user?: UserResponse } }
	| { success: true; data: MfaPendingResponse; mfaPending: true }
	| { success: true; data: UserResponse }
	| { success: true; data: null }
	| { success: false; error: string };
