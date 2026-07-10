"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useResetPassword } from "@/hooks/useAuth";
import { useZodForm } from "@/hooks/useZodForm";
import { ROUTES } from "@/lib/config";
import { extractApiErrorMessage } from "@/lib/error";
import { ResetPasswordFormSchema } from "@/schemas";

function ResetPasswordContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const initialEmail = searchParams.get("email") || "";
	const [apiError, setApiError] = useState<string | null>(null);

	const form = useZodForm(ResetPasswordFormSchema, {
		verificationCode: "",
		password: "",
		confirmPassword: "",
	});

	const resetMutation = useResetPassword();

	function onSubmit(data: {
		verificationCode: string;
		password: string;
		confirmPassword: string;
	}) {
		setApiError(null);
		resetMutation.mutate(
			{ token: data.verificationCode, new_password: data.password },
			{
				onSuccess: () => {
					router.push(ROUTES.login);
				},
				onError: (err) => {
					setApiError(
						extractApiErrorMessage(
							err,
							"Failed to reset password.",
						),
					);
				},
			},
		);
	}

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-6 font-sans">
			<div className="w-full max-w-md">
				<Link
					href={ROUTES.login}
					className="mb-8 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-foreground/50 hover:text-foreground transition-colors"
				>
					<ArrowLeft className="w-3.5 h-3.5" />
					Back to Sign In
				</Link>

				<div className="bg-muted p-8 md:p-10">
					<div className="flex items-center gap-1.5 select-none text-[10px] font-mono text-primary font-bold uppercase tracking-wider mb-6">
						<span className="w-2.5 h-2.5 border border-primary flex items-center justify-center text-[7px]">
							I
						</span>
						<span>Index Identity Proxy // Node-v6</span>
					</div>

					<h1 className="text-foreground text-2xl md:text-3xl font-display font-bold tracking-tight">
						Set New Password
					</h1>
					<p className="text-foreground/60 text-xs font-mono uppercase mt-1 mb-8">
						// UPDATE YOUR PASSWORD
					</p>

					{initialEmail && (
						<div className="mb-6 p-3 border border-primary/30 bg-primary/5 text-primary font-mono text-[11px]">
							Reset code sent to {initialEmail}
						</div>
					)}

					{apiError && (
						<div className="mb-6 p-3 border border-red-800 bg-red-500/5 text-red-600 dark:text-red-400 font-mono text-[11px] leading-relaxed">
							{apiError}
						</div>
					)}

					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-5"
						>
							<ResetPasswordForm />

							<Button
								type="submit"
								disabled={resetMutation.isPending}
								className="w-full h-12 font-mono text-xs uppercase tracking-widest rounded-none mt-4"
							>
								{resetMutation.isPending ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									"Update Password"
								)}
							</Button>
						</form>
					</Form>

					<div className="border-t border-border mt-8 pt-5 flex items-center justify-between text-[11px] font-mono">
						<span className="text-foreground/50">
							Remember your password?
						</span>
						<Link
							href={ROUTES.login}
							className="text-primary hover:underline font-bold uppercase"
						>
							Sign In &rarr;
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-background flex items-center justify-center p-6">
					<div className="size-8 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
				</div>
			}
		>
			<ResetPasswordContent />
		</Suspense>
	);
}
