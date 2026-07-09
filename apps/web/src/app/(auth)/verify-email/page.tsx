"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { extractApiErrorMessage } from "@/lib/error";
import { useVerifyEmail } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/config";

function VerifyEmailContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const hasAttempted = useRef(false);
	const verifyMutation = useVerifyEmail();

	useEffect(() => {
		if (token && !hasAttempted.current) {
			hasAttempted.current = true;
			verifyMutation.mutate(
				{ token },
				{
					onSuccess: () => {
						setSuccess(true);
						setTimeout(() => router.push(ROUTES.onboarding), 2000);
					},
					onError: (err) => {
						setError(
							extractApiErrorMessage(
								err,
								"Failed to verify email.",
							),
						);
					},
				},
			);
		}
	}, [token, router.push, verifyMutation.mutate]);

	const handleRetry = () => {
		setError(null);
		hasAttempted.current = false;
	};

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-6 font-sans">
			<div className="w-full max-w-md">
				<div className="bg-muted p-8 md:p-10">
					<div className="flex items-center gap-1.5 select-none text-[10px] font-mono text-primary font-bold uppercase tracking-wider mb-6">
						<span className="w-2.5 h-2.5 border border-primary flex items-center justify-center text-[7px]">
							I
						</span>
						<span>Index Identity Proxy {/* Node-v6 */}</span>
					</div>

					<h1 className="text-foreground text-2xl md:text-3xl font-display font-bold tracking-tight">
						Verify Email
					</h1>
					<p className="text-foreground/60 text-xs font-mono uppercase mt-1 mb-8">
						{/* EMAIL VERIFICATION */}
					</p>

					{!token ? (
						<div className="p-3 border border-red-800 bg-red-500/5 text-red-600 dark:text-red-400 font-mono text-[11px] leading-relaxed">
							Invalid verification link. No token provided.
						</div>
					) : success ? (
						<div className="flex flex-col items-center gap-4 py-8">
							<CheckCircle2 className="size-6 text-primary" />
							<p className="text-foreground/60 text-xs font-mono text-center">
								Email verified successfully!
							</p>
							<p className="text-foreground/50 text-[10px] font-mono">
								Redirecting to onboarding...
							</p>
						</div>
					) : verifyMutation.isPending ? (
						<div className="flex flex-col items-center gap-4 py-8">
							<Loader2 className="size-6 animate-spin text-foreground/60" />
							<p className="text-foreground/60 text-xs font-mono">
								Verifying your email...
							</p>
						</div>
					) : error ? (
						<div className="flex flex-col gap-4">
							<div className="p-3 border border-red-800 bg-red-500/5 text-red-600 dark:text-red-400 font-mono text-[11px] leading-relaxed">
								{error}
							</div>
							<Button
								onClick={handleRetry}
								className="w-full h-12 font-mono text-xs uppercase tracking-widest rounded-none"
							>
								Try Again
							</Button>
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}

export default function VerifyEmailPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-background flex items-center justify-center p-6">
					<div className="size-8 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
				</div>
			}
		>
			<VerifyEmailContent />
		</Suspense>
	);
}
