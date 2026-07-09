"use client";

import { ChevronDown, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AvatarUpload } from "@/components/avatar-upload";
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
import { Label } from "@/components/ui/label";
import { useMe } from "@/hooks/useAuth";
import { useChangePassword, useUpdateProfile } from "@/hooks/useUser";
import { useZodForm } from "@/hooks/useZodForm";
import { cn } from "@/lib/utils";
import { ChangePasswordFormSchema, ProfileUpdateFormSchema } from "@/schemas";

export default function ProfilePage() {
	const { data: me, isLoading: meLoading } = useMe();
	const updateProfile = useUpdateProfile();
	const changePassword = useChangePassword();

	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [passwordOpen, setPasswordOpen] = useState(false);

	const profileForm = useZodForm(ProfileUpdateFormSchema, { fullName: "" });

	const passwordForm = useZodForm(ChangePasswordFormSchema, {
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	useEffect(() => {
		if (!me) return;
		profileForm.reset({ fullName: me.full_name ?? "" });
		setAvatarUrl(me.avatar_url ?? null);
	}, [me, profileForm]);

	function handleSaveProfile(data: { fullName?: string }) {
		updateProfile.mutate(
			{
				full_name: data.fullName || null,
				avatar_url: avatarUrl,
			},
			{
				onSuccess: () => toast.success("Profile updated"),
				onError: () => toast.error("Failed to update profile"),
			},
		);
	}

	function handleChangePassword(data: {
		currentPassword: string;
		newPassword: string;
		confirmPassword: string;
	}) {
		changePassword.mutate(
			{
				current_password: data.currentPassword,
				new_password: data.newPassword,
			},
			{
				onSuccess: () => {
					toast.success("Password changed");
					passwordForm.reset({
						currentPassword: "",
						newPassword: "",
						confirmPassword: "",
					});
				},
				onError: () => toast.error("Failed to change password"),
			},
		);
	}

	if (meLoading) {
		return (
			<div className="flex flex-1 items-center justify-center py-16">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col gap-8">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Profile
				</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Manage your personal account settings.
				</p>
			</div>

			<Form {...profileForm}>
				<form
					onSubmit={profileForm.handleSubmit(handleSaveProfile)}
					className="flex flex-col gap-6 max-w-lg"
				>
					<div className="flex flex-col gap-4">
						<Label>Avatar</Label>
						<AvatarUpload
							currentUrl={avatarUrl}
							userName={profileForm.watch("fullName") ?? ""}
							onUpload={(url) => setAvatarUrl(url)}
							disabled={updateProfile.isPending}
						/>
					</div>

					<FormField
						name="fullName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Full name</FormLabel>
								<FormControl>
									<Input {...field} placeholder="Your name" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="flex flex-col gap-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							value={me?.email ?? ""}
							readOnly
							className="text-muted-foreground cursor-not-allowed"
						/>
						<p className="text-muted-foreground text-xs">
							Email cannot be changed. Contact support if needed.
						</p>
					</div>

					<div className="flex items-center gap-2 pt-2">
						<Button
							type="submit"
							disabled={
								updateProfile.isPending ||
								updateProfile.isSuccess
							}
						>
							{updateProfile.isPending ? (
								<Loader2 className="mr-1 size-4 animate-spin" />
							) : (
								<Save className="mr-1 size-4" />
							)}
							Save changes
						</Button>
					</div>
				</form>
			</Form>

			<div className="max-w-lg">
				<button
					type="button"
					onClick={() => setPasswordOpen(!passwordOpen)}
					className="flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
				>
					<ChevronDown
						className={cn(
							"size-4 transition-transform",
							passwordOpen && "rotate-180",
						)}
					/>
					Change password
				</button>

				{passwordOpen && (
					<Form {...passwordForm}>
						<form
							onSubmit={passwordForm.handleSubmit(
								handleChangePassword,
							)}
							className="flex flex-col gap-4 mt-4"
						>
							<FormField
								name="currentPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Current password</FormLabel>
										<FormControl>
											<Input
												{...field}
												type="password"
												placeholder="Enter current password"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								name="newPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>New password</FormLabel>
										<FormControl>
											<Input
												{...field}
												type="password"
												placeholder="Enter new password"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Confirm new password
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												type="password"
												placeholder="Confirm new password"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="flex items-center gap-2 pt-1">
								<Button
									type="submit"
									variant="outline"
									disabled={changePassword.isPending}
								>
									{changePassword.isPending ? (
										<Loader2 className="mr-1 size-4 animate-spin" />
									) : null}
									Update password
								</Button>
							</div>
						</form>
					</Form>
				)}
			</div>
		</div>
	);
}
