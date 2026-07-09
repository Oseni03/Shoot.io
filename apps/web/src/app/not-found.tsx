import Link from "next/link";

export default function NotFound() {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-6">
			<div className="flex flex-col items-center gap-6 max-w-md text-center">
				<span className="text-5xl font-mono font-bold text-foreground/10">
					404
				</span>
				<h1 className="text-2xl font-bold text-foreground font-display tracking-tight">
					Page not found
				</h1>
				<p className="text-sm text-muted-foreground leading-relaxed">
					The page you are looking for does not exist or has been
					moved.
				</p>
				<Link
					href="/"
					className="px-6 py-3 bg-primary text-primary-foreground text-xs font-mono uppercase tracking-widest hover:brightness-110 transition-all inline-block"
				>
					Back to Home
				</Link>
			</div>
		</div>
	);
}
