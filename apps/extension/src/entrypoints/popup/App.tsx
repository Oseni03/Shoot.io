import { useCallback, useEffect, useId, useRef, useState } from "react";
import type {
	LoginRequest,
	MfaPendingResponse,
	RegisterRequest,
	TokenPair,
	UserResponse,
} from "shared";
import { PROJECT } from "shared";
import type { PopupMessage, PopupResponse } from "../../types";

type ViewState =
	| { screen: "loading" }
	| { screen: "login" }
	| { screen: "register" }
	| { screen: "mfa"; mfaToken: string }
	| { screen: "authenticated"; user: UserResponse };

const FRONTEND_URL =
	(import.meta.env.VITE_FRONTEND_URL as string) ?? "http://localhost:3000";

const PASSWORD_MIN = PROJECT.password.minLength;
const PASSWORD_REQUIRE_UPPER = PROJECT.password.requireUppercase;
const PASSWORD_REQUIRE_DIGIT = PROJECT.password.requireDigit;

function validatePassword(password: string): string | null {
	if (password.length < PASSWORD_MIN) {
		return `Password must be at least ${PASSWORD_MIN} characters`;
	}
	if (PASSWORD_REQUIRE_UPPER && !/[A-Z]/.test(password)) {
		return "Password must contain at least one uppercase letter";
	}
	if (PASSWORD_REQUIRE_DIGIT && !/\d/.test(password)) {
		return "Password must contain at least one digit";
	}
	return null;
}

function sendMessage(message: PopupMessage): Promise<PopupResponse> {
	return chrome.runtime.sendMessage(message);
}

function App() {
	const [view, setView] = useState<ViewState>({ screen: "loading" });

	// Login form state
	const [loginEmail, setLoginEmail] = useState("");
	const [loginPassword, setLoginPassword] = useState("");
	const [loginError, setLoginError] = useState<string | null>(null);
	const [loginFieldErrors, setLoginFieldErrors] = useState<
		Record<string, string>
	>({});
	const [loginPending, setLoginPending] = useState(false);

	// Register form state
	const [regName, setRegName] = useState("");
	const [regEmail, setRegEmail] = useState("");
	const [regPassword, setRegPassword] = useState("");
	const [regError, setRegError] = useState<string | null>(null);
	const [regFieldErrors, setRegFieldErrors] = useState<
		Record<string, string>
	>({});
	const [regPending, setRegPending] = useState(false);

	// MFA form state
	const [mfaCode, setMfaCode] = useState("");
	const [mfaError, setMfaError] = useState<string | null>(null);
	const [mfaPending, setMfaPending] = useState(false);

	// Network error banner
	const [networkError, setNetworkError] = useState<string | null>(null);
	const lastAction = useRef<(() => Promise<void>) | null>(null);

	const loginId = useId();
	const loginPasswordId = useId();
	const regNameId = useId();
	const regEmailId = useId();
	const regPasswordId = useId();
	const mfaCodeId = useId();

	const clearLoginErrors = useCallback(() => {
		setLoginError(null);
		setLoginFieldErrors({});
	}, []);

	const clearRegErrors = useCallback(() => {
		setRegError(null);
		setRegFieldErrors({});
	}, []);

	const resetLoginForm = useCallback(() => {
		setLoginEmail("");
		setLoginPassword("");
		clearLoginErrors();
		setLoginPending(false);
	}, [clearLoginErrors]);

	const resetRegForm = useCallback(() => {
		setRegName("");
		setRegEmail("");
		setRegPassword("");
		clearRegErrors();
		setRegPending(false);
	}, [clearRegErrors]);

	const handleApiError = useCallback(
		(res: PopupResponse & { success: false }, forRegister: boolean) => {
			if (res.code === "NETWORK") {
				setNetworkError(res.error);
				return;
			}

			const mappedFields: Record<string, string> = {};
			if (res.fields) {
				for (const [field, msgs] of Object.entries(res.fields)) {
					mappedFields[field] = msgs[0] ?? "Invalid value";
				}
			}

			if (forRegister) {
				setRegError(res.error);
				setRegFieldErrors(mappedFields);
			} else {
				setLoginError(res.error);
				setLoginFieldErrors(mappedFields);
			}
		},
		[],
	);

	const doLogin = useCallback(async () => {
		if (!loginEmail.trim() || !loginPassword.trim()) return;
		clearLoginErrors();
		setNetworkError(null);
		setLoginPending(true);

		const payload: LoginRequest = {
			email: loginEmail.trim(),
			password: loginPassword,
		};
		const res = await sendMessage({ type: "LOGIN", payload });

		if (!res.success) {
			handleApiError(res, false);
			setLoginPending(false);
			return;
		}

		if ("mfaPending" in res && res.mfaPending) {
			const data = res.data as MfaPendingResponse;
			setLoginPending(false);
			setView({ screen: "mfa", mfaToken: data.mfa_pending });
			return;
		}

		const loginData = res.data as TokenPair & { user?: UserResponse };
		if (loginData.user) {
			setLoginPending(false);
			setView({ screen: "authenticated", user: loginData.user });
		}
	}, [loginEmail, loginPassword, clearLoginErrors, handleApiError]);

	const handleLogin = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			lastAction.current = doLogin;
			await doLogin();
		},
		[doLogin],
	);

	const doRegister = useCallback(async () => {
		if (!regEmail.trim() || !regPassword.trim()) return;

		const passwordErr = validatePassword(regPassword);
		if (passwordErr) {
			setRegFieldErrors({ password: passwordErr });
			return;
		}

		clearRegErrors();
		setNetworkError(null);
		setRegPending(true);

		const payload: RegisterRequest = {
			email: regEmail.trim(),
			password: regPassword,
			full_name: regName.trim() || null,
		};
		const res = await sendMessage({ type: "REGISTER", payload });

		if (!res.success) {
			handleApiError(res, true);
			setRegPending(false);
			return;
		}

		const regData = res.data as TokenPair & { user?: UserResponse };
		if (regData.user) {
			setRegPending(false);
			resetRegForm();
			setView({ screen: "authenticated", user: regData.user });
		}
	}, [
		regEmail,
		regPassword,
		regName,
		clearRegErrors,
		handleApiError,
		resetRegForm,
	]);

	const handleRegister = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			lastAction.current = doRegister;
			await doRegister();
		},
		[doRegister],
	);

	const doMfaValidate = useCallback(async () => {
		if (!mfaCode.trim()) return;
		setMfaError(null);
		setNetworkError(null);
		setMfaPending(true);

		const payload = { code: mfaCode.trim(), mfaToken: "" };
		const viewState = view;
		if (viewState.screen === "mfa") {
			payload.mfaToken = viewState.mfaToken;
		}

		const res = await sendMessage({
			type: "MFA_VALIDATE",
			payload,
		});

		if (!res.success) {
			if (res.code === "NETWORK") {
				setNetworkError(res.error);
			} else {
				setMfaError(res.error);
			}
			setMfaPending(false);
			return;
		}

		const tokenData = res.data as TokenPair & { user?: UserResponse };
		if (tokenData.user) {
			setMfaPending(false);
			setView({ screen: "authenticated", user: tokenData.user });
		}
	}, [mfaCode, view]);

	const handleMfaSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			lastAction.current = doMfaValidate;
			await doMfaValidate();
		},
		[doMfaValidate],
	);

	const handleLogout = useCallback(async () => {
		await sendMessage({ type: "LOGOUT" });
		resetLoginForm();
		setView({ screen: "login" });
	}, [resetLoginForm]);

	const handleForgotPassword = useCallback(() => {
		window.open(`${FRONTEND_URL}/reset-password`, "_blank");
	}, []);

	const handleRetry = useCallback(() => {
		setNetworkError(null);
		if (lastAction.current) {
			lastAction.current();
		}
	}, []);

	const switchToLogin = useCallback(() => {
		resetRegForm();
		setNetworkError(null);
		setView({ screen: "login" });
	}, [resetRegForm]);

	const switchToRegister = useCallback(() => {
		resetLoginForm();
		setNetworkError(null);
		setView({ screen: "register" });
	}, [resetLoginForm]);

	// Auth check on mount
	const checkAuth = useCallback(async () => {
		await sendMessage({ type: "REFRESH" });
		const res = await sendMessage({ type: "GET_ME" });
		if (res.success && res.data) {
			setView({
				screen: "authenticated",
				user: res.data as UserResponse,
			});
		} else {
			setView({ screen: "login" });
		}
	}, []);

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	const containerStyle: Record<string, string | number> = {
		width: 360,
		padding: 24,
		fontFamily: "system-ui, sans-serif",
		position: "relative",
	};

	if (view.screen === "loading") {
		return (
			<div style={containerStyle}>
				<p style={{ color: "#6b7280", fontSize: 14 }}>Loading...</p>
			</div>
		);
	}

	if (view.screen === "authenticated") {
		const { user } = view;
		return (
			<div style={containerStyle}>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 12,
						marginBottom: 16,
					}}
				>
					{user.avatar_url ? (
						<img
							src={user.avatar_url}
							alt=""
							style={{
								width: 40,
								height: 40,
								borderRadius: "50%",
								objectFit: "cover",
							}}
						/>
					) : (
						<div
							style={{
								width: 40,
								height: 40,
								borderRadius: "50%",
								backgroundColor: "#e5e7eb",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 16,
								fontWeight: 600,
								color: "#6b7280",
							}}
						>
							{user.full_name?.charAt(0)?.toUpperCase() ??
								user.email.charAt(0).toUpperCase()}
						</div>
					)}
					<div>
						<p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
							{user.full_name ?? "User"}
						</p>
						<p
							style={{
								fontSize: 12,
								color: "#6b7280",
								margin: 0,
							}}
						>
							{user.email}
						</p>
					</div>
				</div>
				<button
					type="button"
					onClick={handleLogout}
					style={{
						width: "100%",
						padding: "8px 16px",
						backgroundColor: "#ef4444",
						color: "#fff",
						border: "none",
						borderRadius: 6,
						fontSize: 14,
						cursor: "pointer",
					}}
				>
					Log out
				</button>
			</div>
		);
	}

	return (
		<div style={containerStyle}>
			{networkError && (
				<div
					style={{
						backgroundColor: "#fef2f2",
						border: "1px solid #fecaca",
						borderRadius: 6,
						padding: "12px 16px",
						marginBottom: 16,
						fontSize: 13,
						color: "#991b1b",
					}}
				>
					<p style={{ margin: 0 }}>
						<strong>Network Error:</strong> {networkError}
					</p>
					<button
						type="button"
						onClick={handleRetry}
						style={{
							marginTop: 8,
							padding: "6px 12px",
							backgroundColor: "#dc2626",
							color: "#fff",
							border: "none",
							borderRadius: 4,
							fontSize: 12,
							cursor: "pointer",
						}}
					>
						Retry
					</button>
				</div>
			)}

			{view.screen === "mfa" && (
				<>
					<h2
						style={{
							fontSize: 18,
							fontWeight: 600,
							marginBottom: 8,
						}}
					>
						Two-Factor Authentication
					</h2>
					<p
						style={{
							fontSize: 14,
							color: "#6b7280",
							marginBottom: 16,
						}}
					>
						Enter the 6-digit code from your authenticator app.
					</p>

					{mfaError && (
						<p
							style={{
								color: "#ef4444",
								fontSize: 13,
								marginBottom: 12,
							}}
						>
							{mfaError}
						</p>
					)}

					<form onSubmit={handleMfaSubmit}>
						<div style={{ marginBottom: 16 }}>
							<label
								htmlFor={mfaCodeId}
								style={{
									display: "block",
									fontSize: 13,
									fontWeight: 500,
									marginBottom: 4,
								}}
							>
								Authentication code
							</label>
							<input
								id={mfaCodeId}
								type="text"
								inputMode="numeric"
								autoComplete="one-time-code"
								value={mfaCode}
								onChange={(e) =>
									setMfaCode(
										e.target.value
											.replace(/\D/g, "")
											.slice(0, 6),
									)
								}
								placeholder="000000"
								required
								disabled={mfaPending}
								style={{
									width: "100%",
									padding: "8px 12px",
									border: "1px solid #d1d5db",
									borderRadius: 6,
									fontSize: 14,
									boxSizing: "border-box",
									letterSpacing: 8,
									textAlign: "center",
								}}
							/>
						</div>

						<button
							type="submit"
							disabled={mfaPending}
							style={{
								width: "100%",
								padding: "8px 16px",
								backgroundColor: mfaPending
									? "#93c5fd"
									: "#2563eb",
								color: "#fff",
								border: "none",
								borderRadius: 6,
								fontSize: 14,
								cursor: mfaPending ? "not-allowed" : "pointer",
							}}
						>
							{mfaPending ? "Verifying..." : "Verify"}
						</button>
					</form>
				</>
			)}

			{(view.screen === "login" || view.screen === "register") && (
				<>
					<h2
						style={{
							fontSize: 18,
							fontWeight: 600,
							marginBottom: 16,
						}}
					>
						{view.screen === "login"
							? "Sign in to Resumio"
							: "Create an account"}
					</h2>

					{view.screen === "login" && loginError && (
						<p
							style={{
								color: "#ef4444",
								fontSize: 13,
								marginBottom: 12,
							}}
						>
							{loginError}
						</p>
					)}

					{view.screen === "register" && regError && (
						<p
							style={{
								color: "#ef4444",
								fontSize: 13,
								marginBottom: 12,
							}}
						>
							{regError}
						</p>
					)}

					{view.screen === "login" && (
						<form onSubmit={handleLogin}>
							<div style={{ marginBottom: 12 }}>
								<label
									htmlFor={loginId}
									style={{
										display: "block",
										fontSize: 13,
										fontWeight: 500,
										marginBottom: 4,
									}}
								>
									Email
								</label>
								<input
									id={loginId}
									type="email"
									value={loginEmail}
									onChange={(e) =>
										setLoginEmail(e.target.value)
									}
									required
									disabled={loginPending}
									style={{
										width: "100%",
										padding: "8px 12px",
										border: `1px solid ${loginFieldErrors.email ? "#ef4444" : "#d1d5db"}`,
										borderRadius: 6,
										fontSize: 14,
										boxSizing: "border-box",
									}}
								/>
								{loginFieldErrors.email && (
									<p
										style={{
											color: "#ef4444",
											fontSize: 12,
											marginTop: 2,
											margin: 0,
										}}
									>
										{loginFieldErrors.email}
									</p>
								)}
							</div>

							<div style={{ marginBottom: 12 }}>
								<label
									htmlFor={loginPasswordId}
									style={{
										display: "block",
										fontSize: 13,
										fontWeight: 500,
										marginBottom: 4,
									}}
								>
									Password
								</label>
								<input
									id={loginPasswordId}
									type="password"
									value={loginPassword}
									onChange={(e) =>
										setLoginPassword(e.target.value)
									}
									required
									disabled={loginPending}
									style={{
										width: "100%",
										padding: "8px 12px",
										border: `1px solid ${loginFieldErrors.password ? "#ef4444" : "#d1d5db"}`,
										borderRadius: 6,
										fontSize: 14,
										boxSizing: "border-box",
									}}
								/>
								{loginFieldErrors.password && (
									<p
										style={{
											color: "#ef4444",
											fontSize: 12,
											marginTop: 2,
											margin: 0,
										}}
									>
										{loginFieldErrors.password}
									</p>
								)}
							</div>

							<div
								style={{ textAlign: "right", marginBottom: 16 }}
							>
								<button
									type="button"
									onClick={handleForgotPassword}
									style={{
										background: "none",
										border: "none",
										color: "#2563eb",
										fontSize: 13,
										cursor: "pointer",
										padding: 0,
										textDecoration: "underline",
									}}
								>
									Forgot password?
								</button>
							</div>

							<button
								type="submit"
								disabled={loginPending}
								style={{
									width: "100%",
									padding: "8px 16px",
									backgroundColor: loginPending
										? "#93c5fd"
										: "#2563eb",
									color: "#fff",
									border: "none",
									borderRadius: 6,
									fontSize: 14,
									cursor: loginPending
										? "not-allowed"
										: "pointer",
								}}
							>
								{loginPending ? "Signing in..." : "Sign in"}
							</button>
						</form>
					)}

					{view.screen === "register" && (
						<form onSubmit={handleRegister}>
							<div style={{ marginBottom: 12 }}>
								<label
									htmlFor={regNameId}
									style={{
										display: "block",
										fontSize: 13,
										fontWeight: 500,
										marginBottom: 4,
									}}
								>
									Name
								</label>
								<input
									id={regNameId}
									type="text"
									value={regName}
									onChange={(e) => setRegName(e.target.value)}
									disabled={regPending}
									style={{
										width: "100%",
										padding: "8px 12px",
										border: `1px solid ${regFieldErrors.full_name ? "#ef4444" : "#d1d5db"}`,
										borderRadius: 6,
										fontSize: 14,
										boxSizing: "border-box",
									}}
								/>
								{regFieldErrors.full_name && (
									<p
										style={{
											color: "#ef4444",
											fontSize: 12,
											marginTop: 2,
											margin: 0,
										}}
									>
										{regFieldErrors.full_name}
									</p>
								)}
							</div>

							<div style={{ marginBottom: 12 }}>
								<label
									htmlFor={regEmailId}
									style={{
										display: "block",
										fontSize: 13,
										fontWeight: 500,
										marginBottom: 4,
									}}
								>
									Email
								</label>
								<input
									id={regEmailId}
									type="email"
									value={regEmail}
									onChange={(e) =>
										setRegEmail(e.target.value)
									}
									required
									disabled={regPending}
									style={{
										width: "100%",
										padding: "8px 12px",
										border: `1px solid ${regFieldErrors.email ? "#ef4444" : "#d1d5db"}`,
										borderRadius: 6,
										fontSize: 14,
										boxSizing: "border-box",
									}}
								/>
								{regFieldErrors.email && (
									<p
										style={{
											color: "#ef4444",
											fontSize: 12,
											marginTop: 2,
											margin: 0,
										}}
									>
										{regFieldErrors.email}
									</p>
								)}
							</div>

							<div style={{ marginBottom: 16 }}>
								<label
									htmlFor={regPasswordId}
									style={{
										display: "block",
										fontSize: 13,
										fontWeight: 500,
										marginBottom: 4,
									}}
								>
									Password
								</label>
								<input
									id={regPasswordId}
									type="password"
									value={regPassword}
									onChange={(e) =>
										setRegPassword(e.target.value)
									}
									required
									disabled={regPending}
									style={{
										width: "100%",
										padding: "8px 12px",
										border: `1px solid ${regFieldErrors.password ? "#ef4444" : "#d1d5db"}`,
										borderRadius: 6,
										fontSize: 14,
										boxSizing: "border-box",
									}}
								/>
								{regFieldErrors.password && (
									<p
										style={{
											color: "#ef4444",
											fontSize: 12,
											marginTop: 2,
											margin: 0,
										}}
									>
										{regFieldErrors.password}
									</p>
								)}
								<p
									style={{
										fontSize: 11,
										color: "#6b7280",
										marginTop: 4,
										margin: 0,
									}}
								>
									At least {PASSWORD_MIN} characters
									{PASSWORD_REQUIRE_UPPER &&
										", 1 uppercase letter"}
									{PASSWORD_REQUIRE_DIGIT && ", 1 digit"}
								</p>
							</div>

							<button
								type="submit"
								disabled={regPending}
								style={{
									width: "100%",
									padding: "8px 16px",
									backgroundColor: regPending
										? "#93c5fd"
										: "#2563eb",
									color: "#fff",
									border: "none",
									borderRadius: 6,
									fontSize: 14,
									cursor: regPending
										? "not-allowed"
										: "pointer",
								}}
							>
								{regPending
									? "Creating account..."
									: "Create account"}
							</button>
						</form>
					)}

					<div
						style={{
							marginTop: 16,
							textAlign: "center",
							fontSize: 13,
							color: "#6b7280",
						}}
					>
						{view.screen === "login" ? (
							<>
								Don&apos;t have an account?{" "}
								<button
									type="button"
									onClick={switchToRegister}
									style={{
										background: "none",
										border: "none",
										color: "#2563eb",
										cursor: "pointer",
										padding: 0,
										fontSize: 13,
										textDecoration: "underline",
									}}
								>
									Sign up
								</button>
							</>
						) : (
							<>
								Already have an account?{" "}
								<button
									type="button"
									onClick={switchToLogin}
									style={{
										background: "none",
										border: "none",
										color: "#2563eb",
										cursor: "pointer",
										padding: 0,
										fontSize: 13,
										textDecoration: "underline",
									}}
								>
									Sign in
								</button>
							</>
						)}
					</div>
				</>
			)}
		</div>
	);
}

export default App;
