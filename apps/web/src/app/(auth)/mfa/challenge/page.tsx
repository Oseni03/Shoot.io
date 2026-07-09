"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ME_KEY } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractApiErrorMessage } from "@/lib/error";
import { mfaService } from "@/lib/api-services";
import { tokenStore } from "@/lib/api";
import { ROUTES } from "@/lib/config";

const PENDING_TOKEN_KEY = "mfa_pending_token";

export default function MfaChallengePage() {
	return (
		<Suspense fallback={null}>
			<MfaChallengeContent />
		</Suspense>
	);
}

function MfaChallengeContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();
	const [code, setCode] = useState("");
	const [apiError, setApiError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const pendingToken = searchParams.get("pending_token");
		if (pendingToken) {
			sessionStorage.setItem(PENDING_TOKEN_KEY, pendingToken);
		}
	}, [searchParams]);

	const pendingToken =
		searchParams.get("pending_token") ??
		sessionStorage.getItem(PENDING_TOKEN_KEY);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!code || code.length < 6) return;
		if (!pendingToken) {
			setApiError("Session expired. Please sign in again.");
			return;
		}

		setIsSubmitting(true);
		setApiError(null);

		try {
			const tokens = await mfaService.validate(code, pendingToken);
			tokenStore.set(tokens.access_token, tokens.refresh_token);
			sessionStorage.removeItem(PENDING_TOKEN_KEY);

			const user = await queryClient.fetchQuery({
				queryKey: ME_KEY,
				queryFn: ({ signal }) =>
					import("@/lib/auth").then((m) =>
						m.authService.getMe({ signal }),
					),
			});
			queryClient.setQueryData(ME_KEY, user);
			router.push(ROUTES.dashboard.root);
		} catch (err) {
			setApiError(
				extractApiErrorMessage(err, "Invalid verification code."),
			);
		} finally {
			setIsSubmitting(false);
		}
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
						Two-Factor Auth
					</h1>
					<p className="text-foreground/60 text-xs font-mono uppercase mt-1 mb-8">
						// ENTER AUTHENTICATOR CODE
					</p>

					{apiError && (
						<div className="mb-6 p-3 border border-red-800 bg-red-500/5 text-red-600 dark:text-red-400 font-mono text-[11px] leading-relaxed">
							{apiError}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-5">
						<div className="space-y-2">
							<Label
								htmlFor="code"
								className="font-mono text-[10px] uppercase tracking-widest text-foreground/60"
							>
								Verification Code
							</Label>
							<Input
								id="code"
								type="text"
								inputMode="numeric"
								maxLength={6}
								placeholder="000000"
								value={code}
								onChange={(e) =>
									setCode(e.target.value.replace(/\D/g, ""))
								}
								className="font-mono text-lg tracking-[0.5em] text-center rounded-none"
								autoComplete="one-time-code"
								autoFocus
							/>
						</div>

						<Button
							type="submit"
							disabled={isSubmitting || code.length < 6}
							className="w-full h-12 font-mono text-xs uppercase tracking-widest rounded-none mt-4"
						>
							{isSubmitting ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								"Verify"
							)}
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
