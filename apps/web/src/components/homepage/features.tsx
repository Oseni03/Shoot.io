"use client";

import { ArrowRight, BookOpen, RotateCw, Zap } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FeatureItem } from "@/types";

export const FEATURES: FeatureItem[] = [
	{
		id: "feat-1",
		category: "Writing",
		tag: "01",
		title: "Distraction-Free Editor",
		description:
			"An elegant, peaceful writing canvas designed for your thoughts. Type in simple plain text, add format controls effortlessly, and let our engine render stunning web typography automatically.",
	},
	{
		id: "feat-2",
		category: "Publishing",
		tag: "02",
		title: "One-Click Instant Sharing",
		description:
			"Publish your articles, newsletters, or manuals to the web with a simple click. No files to configure, no complex website builders, and no technical headaches. Just pure speed.",
	},
	{
		id: "feat-3",
		category: "Peace of Mind",
		tag: "03",
		title: "Automatic History & Syncing",
		description:
			"Keep your workflow safe and simple. Scribe automatically tracks your edits and backs up revisions. Sync with your cloud storage, view earlier drafts, and never lose a single sentence.",
	},
];

const FEATURE_ICONS = [
	<BookOpen className="w-5 h-5 text-primary" key="icon-1" />,
	<Zap className="w-5 h-5 text-primary" key="icon-2" />,
	<RotateCw className="w-5 h-5 text-primary" key="icon-3" />,
];

export default function Features() {
	const [testActive, setTestActive] = useState(false);
	const [testResult, setTestResult] = useState("");

	const runSpeedTest = () => {
		setTestActive(true);
		setTestResult("Connecting to local page cache...");
		setTimeout(() => {
			setTestResult(
				"Simulated page load speed: 0.04 seconds! (All layouts optimized under 5 KB)",
			);
			setTestActive(false);
		}, 1200);
	};

	return (
		<section
			id="features"
			className="bg-background border-b border-border py-24 md:py-32"
		>
			<div className="max-w-7xl mx-auto px-6 md:px-12">
				{/* Section Header */}
				<div id="features-header" className="max-w-3xl mb-16 md:mb-24">
					<span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary font-bold">
						01 / CORE PUBLISHING ADVANTAGES
					</span>
					<h2 className="text-foreground text-3xl md:text-5xl font-display font-bold tracking-tighter mt-4 leading-tight">
						Designed for writers and creators who prioritize
						clarity, speed, and beautiful design.
					</h2>
					<p className="text-foreground/70 text-xs md:text-sm font-mono uppercase tracking-widest mt-6">
						// NO CODE. NO COMPLICATED PLUGINS. JUST BEAUTIFUL
						PAGES.
					</p>
				</div>

				{/* Feature Grid */}
				<div
					id="features-grid"
					className="grid grid-cols-1 md:grid-cols-3 bg-muted"
				>
					{FEATURES.map((feature, idx) => (
						<div
							key={feature.id}
							id={`feature-card-${idx}`}
							className={`p-8 md:p-12 flex flex-col justify-between min-h-[340px] bg-background border-b md:border-b-0 ${
								idx < 2 ? "md:border-r border-border" : ""
							} transition-all group hover:bg-foreground/[0.01]`}
						>
							<div className="flex flex-col gap-6">
								<div className="flex items-center justify-between">
									<span className="text-[10px] font-mono text-foreground/40 font-bold">
										[{feature.tag}]
									</span>
									<div className="p-2 bg-card group-hover:bg-muted transition-colors">
										{FEATURE_ICONS[idx]}
									</div>
								</div>

								<div className="flex flex-col gap-2">
									<Badge
										variant="outline"
										className="w-fit text-[9px] font-mono uppercase tracking-widest text-primary font-bold rounded-none border-none px-0"
									>
										{feature.category}
									</Badge>
									<h3 className="text-foreground text-xl font-display font-bold tracking-tight">
										{feature.title}
									</h3>
								</div>

								<p className="text-foreground/75 text-sm leading-relaxed mt-1">
									{feature.description}
								</p>
							</div>

							<div className="pt-8 flex items-center justify-between border-t border-border/60 mt-6 select-none">
								<Button
									variant="ghost"
									size="xs"
									className="text-[10px] font-mono uppercase tracking-widest text-foreground/50 group-hover:text-primary rounded-none h-auto p-0"
								>
									Learn More
									<ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-all" />
								</Button>
							</div>
						</div>
					))}
				</div>

				{/* Speed Test Footer */}
				<div
					id="features-specification-footer"
					className="mt-16 bg-muted p-6 flex flex-col md:flex-row items-center justify-between gap-6"
				>
					<div className="flex items-center gap-3">
						<span className="w-2.5 h-2.5 rounded-full bg-primary" />
						<div className="text-xs font-mono text-foreground/70">
							<span className="text-foreground font-bold font-display block md:inline">
								Speed & reliability:
							</span>{" "}
							{testResult ? (
								<span className="text-primary font-bold transition-all animate-pulse">
									{testResult}
								</span>
							) : (
								<span>
									Average page load speed is under 0.1 seconds
									globally. Your site is securely backed and
									hosted in multiple global regions.
								</span>
							)}
						</div>
					</div>
					<Button
						id="features-latency-test-btn"
						variant="outline"
						size="xs"
						disabled={testActive}
						onClick={runSpeedTest}
						className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded-none h-auto hover:bg-foreground hover:text-background disabled:opacity-50"
					>
						{testActive ? "Running..." : "Test Speed"}
					</Button>
				</div>
			</div>
		</section>
	);
}
