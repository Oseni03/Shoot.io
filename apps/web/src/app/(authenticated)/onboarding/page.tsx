"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { useOrganization } from "@/contexts/organization";
import { ME_KEY } from "@/hooks/useAuth";
import { billingService, organizationService } from "@/lib/api-services";
import { extractApiErrorMessage } from "@/lib/error";
import type { MembershipOrgResponse, UserResponse } from "@/schemas";

export default function OnboardingPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();
	const { setActiveOrg } = useOrganization();

	const [status, setStatus] = useState<
		"form" | "verifying" | "verified" | "error"
	>("form");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		const verified = searchParams.get("verified");
		if (verified !== "true") return;

		setStatus("verifying");

		billingService
			.verify()
			.then(async (result) => {
				const org = await organizationService.getOne(
					result.organization_id,
				);
				setActiveOrg(org);
				setStatus("verified");
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
				setTimeout(() => router.push("/dashboard"), 1500);
			})
			.catch((err: unknown) => {
				setErrorMessage(
					extractApiErrorMessage(err, "Payment verification failed"),
				);
				setStatus("error");
			});
	}, [searchParams, router, queryClient, setActiveOrg]);

	if (status === "verifying") {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center p-6 font-sans">
				<div className="w-full max-w-md text-center">
					<Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
					<p className="mt-4 text-sm font-mono text-foreground/60">
						Verifying your payment...
					</p>
				</div>
			</div>
		);
	}

	if (status === "verified") {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center p-6 font-sans">
				<div className="w-full max-w-md text-center">
					<CheckCircle className="w-10 h-10 mx-auto text-primary" />
					<p className="mt-4 text-sm font-mono text-foreground/80 font-bold">
						Payment confirmed!
					</p>
					<p className="mt-1 text-xs font-mono text-foreground/50">
						Redirecting to dashboard...
					</p>
				</div>
			</div>
		);
	}

	if (status === "error") {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center p-6 font-sans">
				<div className="w-full max-w-md">
					<div className="bg-muted p-8 md:p-10">
						<p className="text-[10px] font-mono uppercase tracking-widest text-destructive mb-4">
							{errorMessage}
						</p>
						<Link
							href="/dashboard"
							className="text-xs font-mono text-primary hover:underline"
						>
							Go to dashboard &rarr;
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-6 font-sans">
			<div className="w-full max-w-4xl">
				<Link
					href="/"
					className="mb-8 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-foreground/50 hover:text-foreground transition-colors"
				>
					<ArrowLeft className="w-3.5 h-3.5" />
					Back to Home
				</Link>

				<div className="bg-muted p-8 md:p-10">
					<div className="flex items-center gap-1.5 select-none text-[10px] font-mono text-primary font-bold uppercase tracking-wider mb-6">
						<span className="w-2.5 h-2.5 border border-primary flex items-center justify-center text-[7px]">
							II
						</span>
						<span>Onboarding {/* Workspace Setup */}</span>
					</div>

					<h1 className="text-foreground text-2xl md:text-3xl font-display font-bold tracking-tight">
						Set up your workspace
					</h1>
					<p className="text-foreground/60 text-xs font-mono uppercase mt-1 mb-8">
						{/* CREATE ORGANIZATION */}
					</p>

					<OnboardingForm />
				</div>
			</div>
		</div>
	);
}
