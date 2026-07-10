"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ACTIVE_ORG_STORAGE_KEY } from "@/contexts/organization";
import { ME_KEY } from "@/hooks/useAuth";
import { organizationService } from "@/lib/api-services";
import { extractApiErrorMessage } from "@/lib/error";
import type { MembershipOrgResponse, UserResponse } from "@/schemas";

export default function AcceptInvitationPage() {
	return (
		<Suspense fallback={null}>
			<AcceptContent />
		</Suspense>
	);
}

type AcceptState =
	| { status: "loading" }
	| { status: "success" }
	| { status: "error"; message: string };

function AcceptContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();
	const token = searchParams.get("token");

	const [state, setState] = useState<AcceptState>({ status: "loading" });

	useEffect(() => {
		if (!token) {
			setState({
				status: "error",
				message: "No invitation token provided.",
			});
			return;
		}

		let cancelled = false;

		organizationService
			.acceptInvitation({ token })
			.then((org) => {
				if (cancelled) return;
				setState({ status: "success" });
				queryClient.setQueryData<UserResponse>(ME_KEY, (old) => {
					if (!old) return old;
					if (old.organizations?.some((o) => o.id === org.id))
						return old;
					return {
						...old,
						organizations: [
							...(old.organizations ?? []),
							org as MembershipOrgResponse,
						],
					};
				});
				localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, org.id);
				setTimeout(() => router.push("/dashboard"), 1500);
			})
			.catch((err) => {
				if (cancelled) return;
				setState({
					status: "error",
					message: extractApiErrorMessage(
						err,
						"Failed to accept invitation.",
					),
				});
			});

		return () => {
			cancelled = true;
		};
	}, [token, queryClient, router]);

	return (
		<div className="bg-background flex min-h-screen items-center justify-center p-6">
			<div className="bg-muted w-full max-w-md p-10 text-center">
				{state.status === "loading" && (
					<>
						<Loader2 className="text-primary mx-auto mb-4 size-8 animate-spin" />
						<h1 className="text-foreground text-xl font-semibold">
							Accepting invitation…
						</h1>
						<p className="text-muted-foreground mt-2 text-sm">
							Please wait while we process your invitation.
						</p>
					</>
				)}

				{state.status === "success" && (
					<>
						<CheckCircle2 className="text-emerald-500 mx-auto mb-4 size-10" />
						<h1 className="text-foreground text-xl font-semibold">
							Invitation accepted!
						</h1>
						<p className="text-muted-foreground mt-2 text-sm">
							You&apos;re now a member of the organization.
							Redirecting to dashboard…
						</p>
					</>
				)}

				{state.status === "error" && (
					<>
						<XCircle className="text-destructive mx-auto mb-4 size-10" />
						<h1 className="text-foreground text-xl font-semibold">
							Unable to accept invitation
						</h1>
						<p className="text-muted-foreground mt-2 mb-6 text-sm">
							{state.message}
						</p>
						<Button asChild>
							<Link href="/dashboard">Go to Dashboard</Link>
						</Button>
					</>
				)}
			</div>
		</div>
	);
}
