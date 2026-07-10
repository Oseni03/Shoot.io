"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useOrganization } from "@/contexts/organization";
import { ME_KEY } from "@/hooks/useAuth";
import { useZodForm } from "@/hooks/useZodForm";
import { billingService, organizationService } from "@/lib/api-services";
import type { MembershipOrgResponse, PlanTier, UserResponse } from "@/schemas";
import { OrgCreateFormSchema } from "@/schemas";

interface CreateOrganizationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationModal({
	open,
	onOpenChange,
}: CreateOrganizationModalProps) {
	const queryClient = useQueryClient();
	const { setActiveOrg } = useOrganization();

	const [error, setError] = React.useState<string | null>(null);

	const form = useZodForm(OrgCreateFormSchema, {
		name: "",
		plan: "free" as PlanTier,
	});

	const mutation = useMutation({
		mutationFn: async (data: { name: string; plan: PlanTier }) => {
			const org = await organizationService.create({ name: data.name });

			if (data.plan !== "free") {
				const callbackUrl = `${window.location.origin}/dashboard/settings/billing?verified=true`;
				const billing = await billingService.initialize(org.id, {
					plan: data.plan,
					callback_url: callbackUrl,
				});

				if (billing.authorization_url) {
					window.location.href = billing.authorization_url;
					return null;
				}
			}

			return org;
		},
		onSuccess: (org) => {
			if (!org) return;

			queryClient.setQueryData<UserResponse>(ME_KEY, (old) => {
				if (!old) return old;
				return {
					...old,
					organizations: [
						...(old.organizations ?? []),
						org as MembershipOrgResponse,
					],
				};
			});
			setActiveOrg(org);
			onOpenChange(false);
			form.reset({ name: "", plan: "free" as PlanTier });
			setError(null);
		},
		onError: (err: unknown) => {
			const apiError =
				(err as { response?: { data?: { error?: string } } })?.response
					?.data?.error ||
				(err as { message?: string })?.message ||
				"Failed to create organization";
			setError(apiError);
		},
	});

	function onSubmit(data: { name: string; plan: PlanTier }) {
		setError(null);
		mutation.mutate(data);
	}

	const isPaidPlan = form.watch("plan") !== "free";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Create organization</DialogTitle>
					<DialogDescription>
						Set up a new organization and choose your plan.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-6"
					>
						<FormField
							name="name"
							render={({ field }) => (
								<FormItem className="space-y-2">
									<FormLabel className="text-xs font-mono uppercase tracking-widest text-foreground/70">
										Organization name
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="e.g. Acme Corp"
											disabled={mutation.isPending}
											className="bg-muted"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="space-y-3">
							<FormLabel className="text-xs font-mono uppercase tracking-widest text-foreground/70">
								Plan
							</FormLabel>
							<FormField
								name="plan"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<RadioGroup
												value={field.value}
												onValueChange={(v) =>
													field.onChange(
														v as PlanTier,
													)
												}
												className="gap-2"
												disabled={mutation.isPending}
											>
												{[
													{
														value: "free" as PlanTier,
														label: "Free",
														desc: "Get started with basic features",
													},
													{
														value: "pro" as PlanTier,
														label: "Pro",
														desc: "Advanced features for growing teams",
													},
													{
														value: "enterprise" as PlanTier,
														label: "Enterprise",
														desc: "Custom solutions and support",
													},
												].map((option) => (
													<Label
														key={option.value}
														htmlFor={`plan-${option.value}`}
														className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted p-3 cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
													>
														<RadioGroupItem
															value={option.value}
															id={`plan-${option.value}`}
														/>
														<div className="grid gap-0.5">
															<span className="text-xs font-mono uppercase tracking-widest text-foreground/80 font-bold">
																{option.label}
															</span>
															<span className="text-[10px] font-mono text-foreground/50">
																{option.desc}
															</span>
														</div>
													</Label>
												))}
											</RadioGroup>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{error && (
							<p className="text-[10px] font-mono uppercase tracking-widest text-destructive">
								{error}
							</p>
						)}

						<DialogFooter className="gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									form.reset({
										name: "",
										plan: "free" as PlanTier,
									});
									setError(null);
									onOpenChange(false);
								}}
								disabled={mutation.isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={mutation.isPending}>
								{mutation.isPending && (
									<Loader2 className="size-3.5 animate-spin mr-1.5" />
								)}
								{isPaidPlan
									? "Create & Continue to Payment"
									: "Create organization"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
