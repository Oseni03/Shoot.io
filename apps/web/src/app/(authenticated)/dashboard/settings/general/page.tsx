"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useOrganization } from "@/contexts/organization";
import { ME_KEY } from "@/hooks/useAuth";
import { useZodForm } from "@/hooks/useZodForm";
import { organizationService } from "@/lib/api-services";
import { OrgUpdateFormSchema, type UserResponse } from "@/schemas";

export default function GeneralPage() {
	const { activeOrg, setActiveOrg } = useOrganization();
	const queryClient = useQueryClient();
	const orgId = activeOrg?.id;

	const form = useZodForm(OrgUpdateFormSchema, { name: "", logoUrl: "" });

	useEffect(() => {
		if (!activeOrg) return;
		form.reset({ name: activeOrg.name, logoUrl: activeOrg.logo_url ?? "" });
	}, [activeOrg, form]);

	const updateMutation = useMutation({
		mutationFn: (data: { name: string; logoUrl?: string }) =>
			organizationService.update(orgId!, {
				name: data.name || undefined,
				logo_url: data.logoUrl || null,
			}),
		onSuccess: (updatedOrg) => {
			toast.success("Organization updated");
			setActiveOrg(updatedOrg);
			queryClient.setQueryData<UserResponse>(ME_KEY, (old) => {
				if (!old) return old;
				return {
					...old,
					organizations: old.organizations?.map((o) =>
						o.id === updatedOrg.id ? { ...o, ...updatedOrg } : o,
					),
				};
			});
		},
		onError: () => {},
	});

	function onSubmit(data: { name: string; logoUrl?: string }) {
		updateMutation.mutate(data);
	}

	if (!orgId) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<p className="text-muted-foreground text-sm">
					Select an organization to manage settings.
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col gap-8">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					General
				</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Manage your organization&apos;s basic information.
				</p>
			</div>

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-6 max-w-lg"
				>
					<FormField
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Organization name</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="My Organization"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						name="logoUrl"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Logo URL</FormLabel>
								<FormControl>
									<Input
										{...field}
										type="url"
										placeholder="https://example.com/logo.png"
									/>
								</FormControl>
								<FormMessage />
								<p className="text-muted-foreground text-xs">
									Optional. Enter a URL to your
									organization&apos;s logo.
								</p>
							</FormItem>
						)}
					/>

					<div className="flex items-center gap-2 pt-2">
						<Button
							type="submit"
							disabled={
								updateMutation.isPending ||
								updateMutation.isSuccess
							}
						>
							{updateMutation.isPending ? (
								<Loader2 className="mr-1 size-4 animate-spin" />
							) : (
								<Save className="mr-1 size-4" />
							)}
							Save changes
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
