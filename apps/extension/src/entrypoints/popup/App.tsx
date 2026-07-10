import type {
	LoginRequest,
	MfaPendingResponse,
	TokenPair,
	UserResponse,
} from "@resumio/shared";
import { useCallback, useEffect, useId, useState } from "react";
import type { PopupMessage, PopupResponse } from "../../types";

type ViewState =
	| { screen: "loading" }
	| { screen: "login"; error?: string }
	| { screen: "mfa"; mfaToken: string }
	| { screen: "authenticated"; user: UserResponse };

function sendMessage(message: PopupMessage): Promise<PopupResponse> {
	return chrome.runtime.sendMessage(message);
}

function App() {
	const [view, setView] = useState<ViewState>({ screen: "loading" });
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const emailId = useId();
	const passwordId = useId();

	const checkAuth = useCallback(async () => {
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

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim() || !password.trim()) return;

		const payload: LoginRequest = { email: email.trim(), password };
		const res = await sendMessage({ type: "LOGIN", payload });

		if (!res.success) {
			setView({ screen: "login", error: res.error });
			return;
		}

		if ("mfaPending" in res && res.mfaPending) {
			const data = res.data as MfaPendingResponse;
			setView({ screen: "mfa", mfaToken: data.mfa_pending });
			return;
		}

		const loginData = res.data as TokenPair & { user?: UserResponse };
		if (loginData.user) {
			setView({ screen: "authenticated", user: loginData.user });
		}
	};

	const handleLogout = async () => {
		await sendMessage({ type: "LOGOUT" });
		setView({ screen: "login" });
	};

	if (view.screen === "loading") {
		return (
			<div
				style={{
					width: 360,
					padding: 24,
					fontFamily: "system-ui, sans-serif",
				}}
			>
				<p style={{ color: "#6b7280", fontSize: 14 }}>Loading...</p>
			</div>
		);
	}

	if (view.screen === "mfa") {
		return (
			<div
				style={{
					width: 360,
					padding: 24,
					fontFamily: "system-ui, sans-serif",
				}}
			>
				<h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
					MFA Required
				</h2>
				<p style={{ fontSize: 14, color: "#6b7280" }}>
					This account has multi-factor authentication enabled. Please
					log in via the web app.
				</p>
			</div>
		);
	}

	if (view.screen === "authenticated") {
		const { user } = view;
		return (
			<div
				style={{
					width: 360,
					padding: 24,
					fontFamily: "system-ui, sans-serif",
				}}
			>
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
		<div
			style={{
				width: 360,
				padding: 24,
				fontFamily: "system-ui, sans-serif",
			}}
		>
			<h2
				style={{
					fontSize: 18,
					fontWeight: 600,
					marginBottom: 16,
				}}
			>
				Sign in to Resumio
			</h2>

			{view.error && (
				<p
					style={{
						color: "#ef4444",
						fontSize: 13,
						marginBottom: 12,
					}}
				>
					{view.error}
				</p>
			)}

			<form onSubmit={handleLogin}>
				<div style={{ marginBottom: 12 }}>
					<label
						htmlFor={emailId}
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
						id={emailId}
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						style={{
							width: "100%",
							padding: "8px 12px",
							border: "1px solid #d1d5db",
							borderRadius: 6,
							fontSize: 14,
							boxSizing: "border-box",
						}}
					/>
				</div>

				<div style={{ marginBottom: 16 }}>
					<label
						htmlFor={passwordId}
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
						id={passwordId}
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						style={{
							width: "100%",
							padding: "8px 12px",
							border: "1px solid #d1d5db",
							borderRadius: 6,
							fontSize: 14,
							boxSizing: "border-box",
						}}
					/>
				</div>

				<button
					type="submit"
					style={{
						width: "100%",
						padding: "8px 16px",
						backgroundColor: "#2563eb",
						color: "#fff",
						border: "none",
						borderRadius: 6,
						fontSize: 14,
						cursor: "pointer",
					}}
				>
					Sign in
				</button>
			</form>
		</div>
	);
}

export default App;
