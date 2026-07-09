export default function RootLoading() {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-6">
			<div className="flex flex-col items-center gap-4">
				<div className="w-10 h-10 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
				<p className="text-xs font-mono uppercase tracking-widest text-foreground/50">
					Loading...
				</p>
			</div>
		</div>
	);
}
