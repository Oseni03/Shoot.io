"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useOrganization } from "@/contexts/organization";

export function OrganizationGuard({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const { organizations, isFetched } = useOrganization();
	const redirected = useRef(false);

	useEffect(() => {
		if (redirected.current) return;
		if (!isFetched) return;

		if (organizations.length === 0) {
			redirected.current = true;
			router.replace("/onboarding");
		}
	}, [isFetched, organizations, router]);

	if (organizations.length === 0) {
		return null;
	}

	return <>{children}</>;
}
