export const API_ENDPOINTS = {
	auth: {
		login: "/auth/login",
		register: "/auth/register",
		refresh: "/auth/refresh",
		logout: "/auth/logout",
		verifyEmail: "/auth/verify-email",
		forgotPassword: "/auth/forgot-password",
		resetPassword: "/auth/reset-password",
		me: "/auth/me",
	},
	users: {
		me: "/users/me",
		changePassword: "/users/me/change-password",
	},
	organizations: {
		root: "/organizations/",
		members: (orgId: string) => `/organizations/${orgId}/members`,
		member: (orgId: string, userId: string) =>
			`/organizations/${orgId}/members/${userId}`,
		invitations: (orgId: string) => `/organizations/${orgId}/invitations`,
		invitation: (orgId: string, invitationId: string) =>
			`/organizations/${orgId}/invitations/${invitationId}`,
		acceptInvitation: "/organizations/invitations/accept",
	},
	billing: {
		verify: "/billing/verify",
		initialize: (orgId: string) =>
			`/billing/organizations/${orgId}/initialize`,
		manage: (orgId: string) => `/billing/organizations/${orgId}/manage`,
		cancel: (orgId: string) => `/billing/organizations/${orgId}/cancel`,
	},
	mfa: {
		setup: "/mfa/setup",
		verify: "/mfa/verify",
		disable: "/mfa/disable",
		validate: "/mfa/validate",
	},
	notifications: {
		root: "/notifications/",
		markRead: (id: string) => `/notifications/${id}/read`,
		markAllRead: "/notifications/mark-all-read",
	},
	admin: {
		stats: "/admin/stats",
		users: "/admin/users",
		organizations: "/admin/organizations",
		deactivateUser: (userId: string) => `/admin/users/${userId}/deactivate`,
		activateUser: (userId: string) => `/admin/users/${userId}/activate`,
	},
	health: {
		health: "/health",
		ready: "/ready",
	},
	resumes: {
		root: "/resumes",
		shoot: "/resumes/shoot",
		shotsRemaining: "/resumes/shots/remaining",
		resume: (id: string) => `/resumes/${id}`,
		setMaster: (id: string) => `/resumes/${id}/master`,
		tailored: "/resumes/tailored",
	},
} as const;

export const STORAGE_KEYS = {
	accessToken: "access_token",
	refreshToken: "refresh_token",
	activeOrganizationId: "active_organization_id",
} as const;

export const PROJECT = {
	name: "Resumio",
	version: "1.0.0",
	apiPrefix: "/api/v1",
	password: {
		minLength: 8,
		maxLength: 128,
		requireUppercase: true,
		requireDigit: true,
	},
	tokenType: "bearer" as const,
	mfaPendingExpiresInSeconds: 300,
	roleRank: {
		VIEWER: 0,
		MEMBER: 1,
		ADMIN: 2,
		OWNER: 3,
	},
	planLimits: {
		FREE: {
			maxMembers: 5,
			maxProjects: 3,
			auditLogRetentionDays: 7,
			mfaRequired: false,
			ssoEnabled: false,
			prioritySupport: false,
			maxShotsPerMonth: 3,
		},
		PRO: {
			maxMembers: 50,
			maxProjects: null as number | null,
			auditLogRetentionDays: 90,
			mfaRequired: false,
			ssoEnabled: false,
			prioritySupport: true,
			maxShotsPerMonth: null as number | null,
		},
		ENTERPRISE: {
			maxMembers: null as number | null,
			maxProjects: null as number | null,
			auditLogRetentionDays: 365,
			mfaRequired: true,
			ssoEnabled: true,
			prioritySupport: true,
			maxShotsPerMonth: null as number | null,
		},
	},
	expiry: {
		invitationDays: 7,
		passwordResetHours: 1,
		verificationHours: 24,
	},
} as const;
