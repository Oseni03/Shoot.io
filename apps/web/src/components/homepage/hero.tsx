"use client";

import Link from "next/link";
import { ArrowRight, FileText, Globe, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Hero() {
	return (
		<section
			id="hero-section"
			className="relative bg-background border-b border-border py-28 md:py-36 overflow-hidden"
		>
			<div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col items-center">
				{/* Subtle top metadata badge */}
				<Badge
					id="hero-badge"
					variant="outline"
					className="mb-8 gap-2 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground font-semibold rounded-none"
				>
					<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
					Simple, Elegant Writing Space
				</Badge>

				{/* Master Heading */}
				<h1
					id="hero-heading"
					className="text-foreground text-4xl md:text-6xl lg:text-7xl font-display font-bold text-center tracking-tighter leading-[1.05] max-w-4xl"
				>
					Write simple text. Publish to the web instantly.
				</h1>

				{/* Supporting description */}
				<p
					id="hero-description"
					className="text-foreground/70 text-sm md:text-lg text-center max-w-2xl mt-8 leading-relaxed font-sans"
				>
					Index turns your plain-text notes, guides, and newsletters
					into beautiful, professional, and lightning-fast public
					pages. No technical setups, no custom coding, and no complex
					site-building. Just pure, beautiful writing.
				</p>

				{/* CTAs */}
				<div
					id="hero-actions"
					className="flex flex-col sm:flex-row gap-3 mt-10 w-full sm:w-auto"
				>
					<Button
						variant="default"
						size="lg"
						asChild
						className="px-8 py-4 text-xs font-mono uppercase tracking-widest rounded-none h-auto"
					>
						<Link id="hero-primary-cta" href="/signup">
							<span>Start Writing Free</span>
							<ArrowRight className="w-3.5 h-3.5" />
						</Link>
					</Button>
					<Button
						variant="outline"
						size="lg"
						asChild
						className="px-8 py-4 text-xs font-mono uppercase tracking-widest rounded-none h-auto hover:bg-foreground hover:text-background"
					>
						<a id="hero-secondary-cta" href="#features">
							Explore Features
						</a>
					</Button>
				</div>

				<div className="h-16 md:h-24" />

				{/* Elegant Minimalist Wireframe Dashboard Mockup */}
				<div
					id="hero-app-mockup"
					className="w-full max-w-5xl bg-muted flex flex-col font-mono text-xs text-foreground/80 overflow-hidden"
				>
					{/* Mock Window Top Bar */}
					<div className="border-b border-border h-12 px-4 flex items-center justify-between bg-foreground/[0.02]">
						<div className="flex items-center gap-2">
							<span className="w-2.5 h-2.5 rounded-full border border-border inline-block" />
							<span className="w-2.5 h-2.5 rounded-full border border-border inline-block" />
							<span className="w-2.5 h-2.5 rounded-full border border-border inline-block" />
							<span className="text-[10px] text-foreground/45 uppercase tracking-widest ml-2 font-semibold">
								INDEX STUDIO // MY_NOTEBOOK
							</span>
						</div>

						{/* Mock address bar */}
						<div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-background border border-border rounded-none text-[10px] text-foreground/50 w-72 justify-between">
							<span className="truncate">
								https://index.so/ayomide/notebook
							</span>
							<Globe className="w-2.5 h-2.5 text-foreground/30" />
						</div>

						{/* Right window action controls */}
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-1">
								<span className="w-1.5 h-1.5 rounded-full bg-primary" />
								<span className="text-[9px] uppercase font-semibold text-primary">
									Saved & Live
								</span>
							</div>
						</div>
					</div>

					{/* Mock Workspace Content split */}
					<div className="flex flex-col lg:flex-row min-h-[400px]">
						{/* Left sidebar nav tree */}
						<div className="w-full lg:w-56 border-r border-border lg:h-auto flex flex-col justify-between select-none">
							<div className="flex flex-col">
								<span className="p-3 border-b border-border text-[9px] uppercase tracking-widest text-foreground/40 font-bold">
									My Notebooks
								</span>
								<div className="flex flex-col py-1.5">
									<div className="px-3 py-1.5 flex items-center gap-2 text-foreground font-semibold bg-foreground/[0.03]">
										<FileText className="w-3 h-3 text-primary" />
										<span className="truncate">
											welcome-guide.md
										</span>
									</div>
									<div className="px-3 py-1.5 flex items-center gap-2 hover:bg-foreground/[0.02] cursor-pointer">
										<FileText className="w-3 h-3 text-foreground/40" />
										<span className="truncate">
											recipe-ideas.md
										</span>
									</div>
									<div className="px-3 py-1.5 flex items-center gap-2 hover:bg-foreground/[0.02] cursor-pointer">
										<FileText className="w-3 h-3 text-foreground/40" />
										<span className="truncate">
											summer-photos.md
										</span>
									</div>
									<div className="px-3 py-1.5 flex items-center gap-2 hover:bg-foreground/[0.02] cursor-pointer">
										<FileText className="w-3 h-3 text-foreground/40" />
										<span className="truncate">
											quick-thoughts.txt
										</span>
									</div>
								</div>
							</div>

							{/* Bottom sidebar info */}
							<div className="border-t border-border p-3 flex flex-col gap-1.5 bg-foreground/[0.01]">
								<div className="flex justify-between items-center text-[9px]">
									<span className="uppercase text-foreground/45">
										My Public Page Link
									</span>
									<span className="text-primary font-bold">
										Primary
									</span>
								</div>
								<div className="text-[10px] text-foreground bg-muted p-1.5 truncate font-mono">
									index.so/ayomide/notebook
								</div>
							</div>
						</div>

						{/* Middle main editing canvas */}
						<div className="flex-1 flex flex-col min-w-0">
							<div className="border-b border-border h-10 px-4 flex items-center justify-between bg-foreground/[0.01] select-none">
								<span className="text-[10px] uppercase tracking-wider text-foreground font-semibold">
									📄 welcome-guide.md
								</span>
								<span className="text-[10px] text-foreground/40 text-right">
									UTF-8 • Type: Simple Article
								</span>
							</div>

							<div className="p-4 md:p-6 flex-1 flex flex-col gap-3 font-mono text-[11px] leading-relaxed text-foreground select-text selection:bg-foreground selection:text-background">
								<div className="text-foreground/45">---</div>
								<div>
									<span className="text-foreground/40">
										title:
									</span>{" "}
									"Welcome to My Cozy Travel Journal"
								</div>
								<div>
									<span className="text-foreground/40">
										author:
									</span>{" "}
									"Ayomide Oseni"
								</div>
								<div>
									<span className="text-foreground/40">
										category:
									</span>{" "}
									"My Adventures"
								</div>
								<div className="text-foreground/45">---</div>
								<br />
								<div className="text-primary font-bold">
									# Endless Summers in Greece
								</div>
								<div>
									Last week, we hiked along the volcanic paths
									of Santorini. The Aegean Sea stretched out
									forever in an intense, glittering cobalt
									blue.
								</div>
								<br />
								<div className="font-bold">
									## Three Things to Remember:
								</div>
								<div className="text-foreground/60">
									Whenever traveling to new spaces, keep these
									guidelines close:
								</div>
								<div className="bg-muted p-3 mt-2 flex flex-col gap-1">
									<div>
										1. Travel light (only one backpack is
										plenty!)
									</div>
									<div>
										2. Wake up early for the caldera sunrise
									</div>
									<div>
										3. Always order fresh tomatoes and olive
										oil
									</div>
								</div>
							</div>
						</div>

						{/* Right Live-API status monitor */}
						<div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border p-4 flex flex-col gap-4 bg-foreground/[0.01]">
							<div className="flex items-center justify-between border-b border-border pb-2">
								<span className="text-[9px] uppercase tracking-widest text-foreground/50 font-bold">
									Live Website Status
								</span>
								<span className="w-1.5 h-1.5 rounded-full bg-primary" />
							</div>

							<div className="flex flex-col gap-3">
								<div className="flex justify-between items-center text-[10px] border-b border-border/40 pb-2">
									<span className="text-foreground/45 font-mono uppercase">
										Publish Status
									</span>
									<span className="font-mono text-primary font-bold">
										LIVE & PUBLIC
									</span>
								</div>
								<div className="flex justify-between items-center text-[10px] border-b border-border/40 pb-2">
									<span className="text-foreground/45 font-mono uppercase">
										Page Load Speed
									</span>
									<span className="font-mono font-medium">
										Lightning Fast (Under 0.1s)
									</span>
								</div>
								<div className="flex justify-between items-center text-[10px] border-b border-border/40 pb-2">
									<span className="text-foreground/45 font-mono uppercase">
										Security Connection
									</span>
									<span className="font-mono text-green-700 font-semibold text-[9px] uppercase">
										Safe & Hosted
									</span>
								</div>
							</div>

							<div className="flex-1 flex flex-col bg-muted p-2 font-mono text-[9px] text-foreground/60 leading-normal overflow-hidden select-none">
								<div className="flex items-center gap-1 border-b border-border pb-1 mb-1.5 text-foreground/40 font-bold">
									<Terminal className="w-2.5 h-2.5" />
									<span>PUBLISHING LOGS</span>
								</div>
								<div>
									15:00:53 [SAVE] Synced with cloud folder...
								</div>
								<div>
									15:00:53 [FORMAT] Built beautiful
									typography.
								</div>
								<div>
									15:00:54 [PUBLISH] HTML page generated.
								</div>
								<div>15:00:54 [SHARE] Updated public link.</div>
								<div className="text-primary font-bold">
									15:00:54 [SYS] Page is now online: PUBLIC
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
