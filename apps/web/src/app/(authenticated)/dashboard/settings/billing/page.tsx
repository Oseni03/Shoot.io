"use client";

import { useMutation } from "@tanstack/react-query";
import {
	ArrowUpRight,
	Check,
	ExternalLink,
	Loader2,
	ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrganization } from "@/contexts/organization";
import { billingService } from "@/lib/api-services";
import { PRICING_PLANS } from "@/lib/pricing-plans";
import { PlanTier } from "@/schemas";
import type { PricingPlan } from "@/types";

const planMap: Record<string, PricingPlan> = Object.fromEntries(
	PRICING_PLANS.map((p) => [p.id, p]),
);

function getUpgradePlans(current: PlanTier): PricingPlan[] {
	const idx = PRICING_PLANS.findIndex((p) => p.id === current);
	return PRICING_PLANS.slice(idx + 1);
}

export default function BillingPage() {
	const { activeOrg } = useOrganization();
	const orgId = activeOrg?.id;
	const currentPlan = activeOrg?.plan;
	const upgradePlans = currentPlan ? getUpgradePlans(currentPlan) : [];
	const [verified, setVerified] = useState(false);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (params.get("verified") === "true") {
			setVerified(true);
			billingService
				.verify()
				.then(() => {
					toast.success("Payment verified successfully");
					const url = new URL(window.location.href);
					url.searchParams.delete("verified");
					window.history.replaceState({}, "", url.toString());
				})
				.catch(() => {});
		}
	}, []);

	const manageMutation = useMutation({
		mutationFn: () => billingService.getManageUrl(orgId!),
		onSuccess: (data) => {
			window.location.href = data.manage_url;
		},
		onError: () => {},
	});

	const upgradeMutation = useMutation({
		mutationFn: (plan: PlanTier) =>
			billingService.initialize(orgId!, {
				plan,
				callback_url: window.location.href,
			}),
		onSuccess: (data) => {
			window.location.href = data.authorization_url;
		},
		onError: () => {},
	});

	const currentPlanData = currentPlan ? planMap[currentPlan] : undefined;

	if (!orgId) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<p className="text-muted-foreground text-sm">
					Select an organization to manage billing.
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col gap-8">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Billing
				</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Manage your organization&apos;s subscription and billing.
				</p>
			</div>

			{verified && (
				<div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
					<ShieldCheck className="size-4 text-emerald-500" />
					<span className="text-emerald-600 dark:text-emerald-400">
						Payment verified successfully
					</span>
				</div>
			)}

			{/* Current plan card */}
			<div className="flex flex-col gap-4 rounded-lg border p-6 max-w-lg">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
							Current plan
						</p>
						<p className="text-2xl font-semibold tracking-tight mt-1">
							{currentPlanData?.name}
						</p>
					</div>
					{currentPlan && (
						<Badge
							variant={
								currentPlan === PlanTier.FREE
									? "outline"
									: "default"
							}
						>
							{currentPlan}
						</Badge>
					)}
				</div>

				{currentPlanData && (
					<ul className="flex flex-col gap-1.5">
						{currentPlanData.features.map((feature) => (
							<li
								key={feature}
								className="text-muted-foreground flex items-center gap-2 text-sm"
							>
								<Check className="size-3.5 text-emerald-500 shrink-0" />
								{feature}
							</li>
						))}
					</ul>
				)}

				<div className="pt-2">
					<Button
						variant="outline"
						onClick={() => manageMutation.mutate()}
						disabled={manageMutation.isPending}
					>
						{manageMutation.isPending ? (
							<Loader2 className="mr-1 size-4 animate-spin" />
						) : (
							<ExternalLink className="mr-1 size-4" />
						)}
						Manage subscription
					</Button>
				</div>
			</div>

			{/* Upgrade section */}
			{upgradePlans.length > 0 && (
				<div className="flex flex-col gap-4 max-w-lg">
					<h2 className="text-sm font-medium">Upgrade options</h2>
					<div className="grid gap-3">
						{upgradePlans.map((plan) => (
							<div
								key={plan.id}
								className="flex flex-col gap-3 rounded-lg border p-4"
							>
								<div className="flex items-center justify-between">
									<div>
										<p className="font-semibold">
											{plan.name}
										</p>
									</div>
									<Button
										size="sm"
										onClick={() =>
											upgradeMutation.mutate(
												plan.id as PlanTier,
											)
										}
										disabled={
											upgradeMutation.isPending &&
											upgradeMutation.variables ===
												plan.id
										}
									>
										{upgradeMutation.isPending &&
										upgradeMutation.variables ===
											plan.id ? (
											<Loader2 className="mr-1 size-4 animate-spin" />
										) : (
											<ArrowUpRight className="mr-1 size-4" />
										)}
										Upgrade
									</Button>
								</div>
								<ul className="flex flex-col gap-1">
									{plan.features.map((feature) => (
										<li
											key={feature}
											className="text-muted-foreground flex items-center gap-2 text-xs"
										>
											<Check className="size-3 text-emerald-500 shrink-0" />
											{feature}
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
