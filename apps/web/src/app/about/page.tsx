"use client";

import { ArrowRight, Shield, Target, Users } from "lucide-react";
import Link from "next/link";
import AnimatedMetrics from "@/components/about/animated-metrics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const teamIdeals = [
	{
		icon: Target,
		title: "Performant edge accessibility",
		description:
			"We believe human content should be delivered instantly. Shaving milliseconds translates to direct usability and commercial prosperity.",
	},
	{
		icon: Shield,
		title: "Autonomic native systems",
		description:
			"Safety should never be secondary configuration. We build intelligent, zero-trust shielding directly into the core networking compiler.",
	},
	{
		icon: Users,
		title: "Open developer ecosystems",
		description:
			"Index is constructed by builders, for builders. We dedicate resources to local developer communities and lightweight open SDKs.",
	},
];

export default function AboutPage() {
	return (
		<div
			className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 space-y-20 select-none md:py-24"
			id="about-page"
		>
			<div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
				<div className="absolute top-10 left-1/4 h-[400px] w-full max-w-4xl rounded-full bg-primary/5 blur-[120px]" />
			</div>

			<div className="text-center space-y-4 max-w-2xl mx-auto relative z-10">
				<Badge
					variant="outline"
					className="rounded-none px-3.5 py-1 text-xs font-semibold"
				>
					Our Story
				</Badge>
				<h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
					A platform built by developers, for global scale.
				</h1>
				<p className="text-sm md:text-base text-foreground/60 leading-relaxed">
					Founded in 2024, Index started with a simple belief:
					publishing beautiful pages should be effortless, secure by
					default, and cost-efficient.
				</p>
			</div>

			<AnimatedMetrics />

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
				<div className="space-y-6">
					<span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase">
						Our Core Mission
					</span>
					<h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
						Removing the friction from publishing.
					</h2>
					<p className="text-xs md:text-sm text-foreground/60 leading-relaxed">
						Traditional publishing platforms force creators to split
						their focus across countless formatting options, SEO
						configurations, and complex site builders.
					</p>
					<p className="text-xs md:text-sm text-foreground/60 leading-relaxed">
						Index removes this friction. By providing a minimal,
						distraction-free writing environment with one-click
						publishing, we let you concentrate fully on creating
						great content.
					</p>
				</div>

				<div className="space-y-4">
					{teamIdeals.map((ideal, idx) => {
						const Icon = ideal.icon;
						return (
							<div
								key={idx}
								className="flex gap-4 p-4 bg-muted rounded-none"
							>
								<div className="flex h-10 w-10 items-center justify-center rounded-none bg-card shrink-0 select-none">
									<Icon className="h-5 w-5 text-primary" />
								</div>
								<div>
									<h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
										{ideal.title}
									</h4>
									<p className="text-[11px] md:text-xs text-foreground/60 mt-1 leading-relaxed">
										{ideal.description}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<div className="bg-muted p-8 text-center space-y-6 md:p-12 relative z-10">
				<h3 className="font-display text-2xl font-bold text-foreground">
					Start publishing beautiful pages today.
				</h3>
				<p className="text-xs md:text-sm text-foreground/60 max-w-md mx-auto">
					Convert your plain text into professional, lightning-fast
					public pages in seconds.
				</p>
				<div className="pt-2">
					<Button
						variant="default"
						size="lg"
						asChild
						className="rounded-none px-6 py-3 text-xs font-semibold h-auto"
					>
						<Link href="/signup">
							Get Started Free
							<ArrowRight className="h-3.5 w-3.5 ml-1" />
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
