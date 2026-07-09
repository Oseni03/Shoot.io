"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { OrgResponse } from "@/schemas";
import { STORAGE_KEYS } from "@/lib/config";
import { useMe } from "@/hooks/useAuth";

export const ACTIVE_ORG_STORAGE_KEY = STORAGE_KEYS.activeOrganizationId;

interface OrganizationContextValue {
	organizations: OrgResponse[];
	activeOrg: OrgResponse | null;
	setActiveOrg: (org: OrgResponse) => void;
	isLoading: boolean;
	isFetched: boolean;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(
	undefined,
);

export function OrganizationProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
	const initialized = useRef(false);

	const { data: me, isLoading, isFetched } = useMe();
	const organizations = me?.organizations ?? [];

	useEffect(() => {
		if (organizations.length === 0 || initialized.current) return;
		initialized.current = true;

		const stored = localStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
		const target =
			stored && organizations.some((o) => o.id === stored)
				? stored
				: organizations[0].id;

		setActiveOrgId(target);
		localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, target);
	}, [organizations]);

	const activeOrg =
		organizations.find((o) => o.id === activeOrgId) ??
		organizations[0] ??
		null;

	const setActiveOrg = (org: OrgResponse) => {
		setActiveOrgId(org.id);
		localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, org.id);
	};

	return (
		<OrganizationContext.Provider
			value={{
				organizations,
				activeOrg,
				setActiveOrg,
				isLoading,
				isFetched,
			}}
		>
			{children}
		</OrganizationContext.Provider>
	);
}

export function useOrganization() {
	const ctx = useContext(OrganizationContext);
	if (!ctx) {
		throw new Error(
			"useOrganization must be used within OrganizationProvider",
		);
	}
	return ctx;
}
