export enum MemberRole {
	VIEWER = "viewer",
	MEMBER = "member",
	ADMIN = "admin",
	OWNER = "owner",
}

export enum PlanTier {
	FREE = "free",
	PRO = "pro",
	// Legacy value — kept only for zero-downtime rollback, see docs/issues/008.
	// Do not use in new code; use ULTIMATE.
	ENTERPRISE = "enterprise",
	ULTIMATE = "ultimate",
}

export enum InvitationStatus {
	PENDING = "pending",
	ACCEPTED = "accepted",
	EXPIRED = "expired",
	REVOKED = "revoked",
}
