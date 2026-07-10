import { useCallback, useEffect, useId, useState } from "react";
import type { MembershipOrgResponse, UserResponse } from "shared";
import { PROJECT, STORAGE_KEYS } from "shared";
import type { PopupMessage, PopupResponse } from "../../types";

type Screen = "loading" | "unauthenticated" | "authenticated";
type Section = "profile" | "organization" | "billing";

interface OrgDetails {
	id: string;
	name: string;
	slug: string;
	logo_url: string | null;
	plan: string;
	member_count: number;
}

const ACTIVE_ORG_KEY = STORAGE_KEYS.activeOrganizationId;
const FRONTEND_URL =
	(import.meta.env.VITE_FRONTEND_URL as string) ?? "http://localhost:3000";

function sendMessage(message: PopupMessage): Promise<PopupResponse> {
	return chrome.runtime.sendMessage(message);
}

function App() {
	const [screen, setScreen] = useState<Screen>("loading");
	const [activeSection, setActiveSection] = useState<Section>("profile");
	const [user, setUser] = useState<UserResponse | null>(null);
	const [orgs, setOrgs] = useState<MembershipOrgResponse[]>([]);
	const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
	const [orgDetails, setOrgDetails] = useState<OrgDetails | null>(null);
	const [loadingOrg, setLoadingOrg] = useState(false);
	const [orgError, setOrgError] = useState<string | null>(null);
	const [globalError, _setGlobalError] = useState<string | null>(null);
	const orgSwitcherId = useId();

	const fetchOrgDetails = useCallback(async (orgId: string) => {
		setLoadingOrg(true);
		setOrgError(null);
		const res = await sendMessage({
			type: "API_REQUEST",
			payload: { path: `/organizations/${orgId}` },
		});
		if (!res.success) {
			setOrgError(res.error);
			setLoadingOrg(false);
			return;
		}
		const data = res.data as OrgDetails;
		setOrgDetails(data);
		setLoadingOrg(false);
	}, []);

	const switchOrg = useCallback(
		async (orgId: string) => {
			setActiveOrgId(orgId);
			chrome.storage.local.set({ [ACTIVE_ORG_KEY]: orgId });
			await fetchOrgDetails(orgId);
		},
		[fetchOrgDetails],
	);

	const handleLogout = useCallback(async () => {
		await sendMessage({ type: "LOGOUT" });
		chrome.storage.local.remove(ACTIVE_ORG_KEY);
		setScreen("unauthenticated");
	}, []);

	useEffect(() => {
		(async () => {
			await sendMessage({ type: "REFRESH" });
			const res = await sendMessage({ type: "GET_ME" });
			if (!res.success || !res.data) {
				setScreen("unauthenticated");
				return;
			}

			const userData = res.data as UserResponse;
			setUser(userData);

			const userOrgs: MembershipOrgResponse[] =
				((userData as Record<string, unknown>)
					.organizations as MembershipOrgResponse[]) ?? [];
			setOrgs(userOrgs);

			if (userOrgs.length === 0) {
				setScreen("authenticated");
				return;
			}

			const stored = await new Promise<string | null>((resolve) => {
				chrome.storage.local.get(ACTIVE_ORG_KEY, (result) => {
					resolve((result[ACTIVE_ORG_KEY] as string) ?? null);
				});
			});

			const initialOrgId =
				stored && userOrgs.some((o) => o.id === stored)
					? stored
					: userOrgs[0].id;

			setActiveOrgId(initialOrgId);
			setScreen("authenticated");
			await fetchOrgDetails(initialOrgId);
		})();
	}, [fetchOrgDetails]);

	const planLimits =
		PROJECT.planLimits[
			orgDetails?.plan?.toUpperCase() as keyof typeof PROJECT.planLimits
		] ?? null;

	const sharedLinkStyle: Record<string, string | number> = {
		color: "#2563eb",
		textDecoration: "underline",
		cursor: "pointer",
		fontSize: 14,
		background: "none",
		border: "none",
		padding: 0,
	};

	if (screen === "loading") {
		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: "100vh",
					fontFamily: "system-ui, sans-serif",
					color: "#6b7280",
				}}
			>
				<p>Loading...</p>
			</div>
		);
	}

	if (screen === "unauthenticated") {
		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: "100vh",
					fontFamily: "system-ui, sans-serif",
					flexDirection: "column",
					gap: 16,
				}}
			>
				<p style={{ color: "#6b7280", fontSize: 14 }}>
					You are not signed in.
				</p>
				<p style={{ color: "#6b7280", fontSize: 14 }}>
					Please open the extension popup to sign in.
				</p>
			</div>
		);
	}

	const sidebarWidth = 220;

	return (
		<div
			style={{
				display: "flex",
				height: "100vh",
				fontFamily: "system-ui, sans-serif",
			}}
		>
			{/* Sidebar */}
			<nav
				style={{
					width: sidebarWidth,
					height: "100vh",
					backgroundColor: "#f9fafb",
					borderRight: "1px solid #e5e7eb",
					display: "flex",
					flexDirection: "column",
					flexShrink: 0,
				}}
			>
				<div style={{ padding: "20px 16px" }}>
					<h1
						style={{
							fontSize: 16,
							fontWeight: 700,
							margin: 0,
						}}
					>
						Resumio
					</h1>
				</div>

				<div style={{ flex: 1, padding: "0 8px" }}>
					{(["profile", "organization", "billing"] as const).map(
						(section) => (
							<button
								key={section}
								type="button"
								onClick={() => setActiveSection(section)}
								style={{
									display: "block",
									width: "100%",
									padding: "10px 12px",
									textAlign: "left",
									fontSize: 14,
									fontWeight:
										activeSection === section ? 600 : 400,
									color:
										activeSection === section
											? "#111827"
											: "#4b5563",
									backgroundColor:
										activeSection === section
											? "#e5e7eb"
											: "transparent",
									border: "none",
									borderRadius: 6,
									cursor: "pointer",
									marginBottom: 2,
								}}
							>
								{section === "profile"
									? "Profile"
									: section === "organization"
										? "Organization"
										: "Billing"}
							</button>
						),
					)}
				</div>

				<div style={{ padding: "8px", borderTop: "1px solid #e5e7eb" }}>
					<button
						type="button"
						onClick={handleLogout}
						style={{
							display: "block",
							width: "100%",
							padding: "10px 12px",
							textAlign: "left",
							fontSize: 14,
							color: "#dc2626",
							backgroundColor: "transparent",
							border: "none",
							borderRadius: 6,
							cursor: "pointer",
						}}
					>
						Logout
					</button>
				</div>
			</nav>

			{/* Content */}
			<main
				style={{
					flex: 1,
					padding: 32,
					overflowY: "auto",
				}}
			>
				{globalError && (
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
						{globalError}
					</div>
				)}

				{activeSection === "profile" && user && (
					<section>
						<h2
							style={{
								fontSize: 20,
								fontWeight: 600,
								marginBottom: 24,
								margin: 0,
							}}
						>
							Profile
						</h2>

						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 16,
								marginBottom: 24,
							}}
						>
							{user.avatar_url ? (
								<img
									src={user.avatar_url}
									alt=""
									style={{
										width: 64,
										height: 64,
										borderRadius: "50%",
										objectFit: "cover",
									}}
								/>
							) : (
								<div
									style={{
										width: 64,
										height: 64,
										borderRadius: "50%",
										backgroundColor: "#e5e7eb",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										fontSize: 24,
										fontWeight: 600,
										color: "#6b7280",
									}}
								>
									{user.full_name?.charAt(0)?.toUpperCase() ??
										user.email.charAt(0).toUpperCase()}
								</div>
							)}
							<div>
								<p
									style={{
										fontSize: 16,
										fontWeight: 600,
										margin: 0,
									}}
								>
									{user.full_name ?? "User"}
								</p>
								<p
									style={{
										fontSize: 14,
										color: "#6b7280",
										margin: 0,
										marginTop: 4,
									}}
								>
									{user.email}
								</p>
							</div>
						</div>

						<div
							style={{
								display: "grid",
								gridTemplateColumns: "120px 1fr",
								gap: "8px 16px",
								fontSize: 14,
							}}
						>
							<span style={{ color: "#6b7280" }}>Name</span>
							<span>{user.full_name ?? "—"}</span>
							<span style={{ color: "#6b7280" }}>Email</span>
							<span>{user.email}</span>
						</div>
					</section>
				)}

				{activeSection === "organization" && (
					<section>
						<h2
							style={{
								fontSize: 20,
								fontWeight: 600,
								marginBottom: 24,
								margin: 0,
							}}
						>
							Organization
						</h2>

						{orgs.length > 1 && (
							<div style={{ marginBottom: 24 }}>
								<label
									htmlFor={orgSwitcherId}
									style={{
										display: "block",
										fontSize: 13,
										fontWeight: 500,
										marginBottom: 6,
										color: "#4b5563",
									}}
								>
									Switch organization
								</label>
								<select
									id={orgSwitcherId}
									value={activeOrgId ?? ""}
									onChange={(e) => switchOrg(e.target.value)}
									style={{
										width: "100%",
										maxWidth: 320,
										padding: "8px 12px",
										border: "1px solid #d1d5db",
										borderRadius: 6,
										fontSize: 14,
									}}
								>
									{orgs.map((o) => (
										<option key={o.id} value={o.id}>
											{o.name}
										</option>
									))}
								</select>
							</div>
						)}

						{loadingOrg && (
							<p style={{ color: "#6b7280", fontSize: 14 }}>
								Loading organization details...
							</p>
						)}

						{orgError && (
							<p
								style={{
									color: "#ef4444",
									fontSize: 14,
								}}
							>
								{orgError}
							</p>
						)}

						{orgDetails && !loadingOrg && (
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "140px 1fr",
									gap: "8px 16px",
									fontSize: 14,
								}}
							>
								<span style={{ color: "#6b7280" }}>Name</span>
								<span>{orgDetails.name}</span>
								<span style={{ color: "#6b7280" }}>Plan</span>
								<span style={{ textTransform: "capitalize" }}>
									{orgDetails.plan}
								</span>
								<span style={{ color: "#6b7280" }}>
									Members
								</span>
								<span>{orgDetails.member_count}</span>
							</div>
						)}

						{!loadingOrg && !orgError && activeOrgId && (
							<div style={{ marginTop: 24 }}>
								<button
									type="button"
									onClick={() =>
										window.open(
											`${FRONTEND_URL}/org/${activeOrgId}/settings`,
											"_blank",
										)
									}
									style={sharedLinkStyle}
								>
									Organization settings →
								</button>
							</div>
						)}
					</section>
				)}

				{activeSection === "billing" && (
					<section>
						<h2
							style={{
								fontSize: 20,
								fontWeight: 600,
								marginBottom: 24,
								margin: 0,
							}}
						>
							Billing
						</h2>

						{orgDetails && (
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "140px 1fr",
									gap: "8px 16px",
									fontSize: 14,
									marginBottom: 24,
								}}
							>
								<span style={{ color: "#6b7280" }}>
									Current plan
								</span>
								<span style={{ textTransform: "capitalize" }}>
									{orgDetails.plan}
								</span>
								{planLimits && (
									<>
										<span style={{ color: "#6b7280" }}>
											Member limit
										</span>
										<span>
											{planLimits.maxMembers === null
												? "Unlimited"
												: planLimits.maxMembers}
										</span>
										<span style={{ color: "#6b7280" }}>
											Project limit
										</span>
										<span>
											{planLimits.maxProjects === null
												? "Unlimited"
												: planLimits.maxProjects}
										</span>
									</>
								)}
							</div>
						)}

						{activeOrgId && (
							<button
								type="button"
								onClick={() =>
									window.open(
										`${FRONTEND_URL}/org/${activeOrgId}/billing`,
										"_blank",
									)
								}
								style={sharedLinkStyle}
							>
								Manage billing →
							</button>
						)}
					</section>
				)}
			</main>
		</div>
	);
}

export default App;
