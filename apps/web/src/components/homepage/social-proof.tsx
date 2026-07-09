export const BRAND_LOGOS = [
	{ name: "Acme Publications", subtitle: "ACME" },
	{ name: "Linear Write", subtitle: "LN" },
	{ name: "Stripe Press", subtitle: "STRIPE" },
	{ name: "Figma Stories", subtitle: "FIG" },
	{ name: "Vercel News", subtitle: "▲ VERCEL" },
];

export default function SocialProof() {
	return (
		<section
			id="case-studies"
			className="bg-background border-b border-border py-12 select-none"
		>
			<div className="max-w-7xl mx-auto px-6 md:px-12">
				<div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
					{/* Logo Title label in neat monospace */}
					<div className="text-center lg:text-left">
						<span className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground/40 font-bold">
							ESTABLISHED TEAMS DEPLOYING VIA INDEX
						</span>
					</div>

					{/* Grayscale Wireframe-style brand logo list */}
					<div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 lg:gap-x-16">
						{BRAND_LOGOS.map((logo) => {
							return (
								<div
									key={logo.name}
									id={`brand-logo-${logo.name.replace(/\s+/g, "-").toLowerCase()}`}
									className="flex items-center gap-1.5 transition-all group"
								>
									{/* Small minimalist glyph spacer */}
									<span className="w-2.5 h-2.5 border border-foreground/30 inline-flex items-center justify-center font-mono text-[6px] tracking-tighter text-foreground/45 group-hover:border-primary group-hover:text-primary transition-colors">
										+
									</span>
									<span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-foreground/50 group-hover:text-foreground transition-colors">
										{logo.name}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
}
