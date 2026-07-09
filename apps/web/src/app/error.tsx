"use client";

import { useEffect } from "react";

export default function RootError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-6">
			<div className="flex flex-col items-center gap-6 max-w-md text-center">
				<div className="w-14 h-14 rounded-full border-2 border-destructive flex items-center justify-center">
					<span className="text-destructive font-mono text-lg font-bold">
						!
					</span>
				</div>
				<h1 className="text-2xl font-bold text-foreground font-display tracking-tight">
					Something went wrong
				</h1>
				<p className="text-sm text-muted-foreground leading-relaxed">
					An unexpected error occurred. Our team has been notified.
				</p>
				<button
					onClick={reset}
					className="px-6 py-3 bg-primary text-primary-foreground text-xs font-mono uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer"
				>
					Try again
				</button>
			</div>
		</div>
	);
}
