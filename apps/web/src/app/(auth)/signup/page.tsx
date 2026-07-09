"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import SignUpForm from "@/components/auth/signup-form";
import { ME_KEY, useSignup } from "@/hooks/useAuth";
import { useZodForm } from "@/hooks/useZodForm";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { extractApiErrorMessage } from "@/lib/error";
import { SignUpFormSchema } from "@/schemas";
import { ROUTES } from "@/lib/config";

export default function SignupPage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [apiError, setApiError] = useState<string | null>(null);

	const form = useZodForm(SignUpFormSchema, {
		name: "",
		email: "",
		password: "",
	});

	const signupMutation = useSignup();

	function onSubmit(data: {
		name?: string;
		email: string;
		password: string;
	}) {
		setApiError(null);
		signupMutation.mutate(
			{
				email: data.email,
				password: data.password,
				full_name: data.name || null,
			},
			{
				onSuccess: (result) => {
					queryClient.setQueryData(ME_KEY, result.user);
					router.push(ROUTES.onboarding);
				},
				onError: (err) => {
					setApiError(
						extractApiErrorMessage(
							err,
							"Failed to create account.",
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
					href={ROUTES.home}
					className="mb-8 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-foreground/50 hover:text-foreground transition-colors"
				>
					<ArrowLeft className="w-3.5 h-3.5" />
					Back to Home
				</Link>

				<div className="bg-muted p-8 md:p-10">
					<div className="flex items-center gap-1.5 select-none text-[10px] font-mono text-primary font-bold uppercase tracking-wider mb-6">
						<span className="w-2.5 h-2.5 border border-primary flex items-center justify-center text-[7px]">
							I
						</span>
						<span>Index Identity Proxy // Node-v6</span>
					</div>

					<h1 className="text-foreground text-2xl md:text-3xl font-display font-bold tracking-tight">
						Create Account
					</h1>
					<p className="text-foreground/60 text-xs font-mono uppercase mt-1 mb-8">
						// GET STARTED
					</p>

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
							<SignUpForm />

							<Button
								type="submit"
								disabled={signupMutation.isPending}
								className="w-full h-12 font-mono text-xs uppercase tracking-widest rounded-none mt-4"
							>
								{signupMutation.isPending ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									"Create Account"
								)}
							</Button>
						</form>
					</Form>

					<div className="border-t border-border mt-8 pt-5 flex items-center justify-between text-[11px] font-mono">
						<span className="text-foreground/50">
							Already have an account?
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
