"use client";

import { useState } from "react";
import Link from "next/link";
import { Info, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { PRICING_PLANS } from "@/lib/pricing-plans";

export default function Pricing() {
	const [isAnnual, setIsAnnual] = useState(false);

	return (
		<section
			id="pricing"
			className="bg-background border-b border-border py-24 md:py-32"
		>
			<div className="max-w-7xl mx-auto px-6 md:px-12">
				{/* Header Block */}
				<div
					id="pricing-header"
					className="flex flex-col items-center text-center mb-16 md:mb-24"
				>
					<span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary font-bold">
						02 / CHOOSE YOUR STUDY
					</span>
					<h2 className="text-foreground text-3xl md:text-5xl font-display font-bold tracking-tighter mt-4 leading-tight max-w-2xl">
						Transparent plans with zero hidden fees.
					</h2>
					<p className="text-foreground/70 text-sm mt-4 max-w-lg font-sans">
						Start completely free. Upgrade to a professional writing
						and publishing plan as your audience grows.
					</p>

					{/* Billing Toggle */}
					<div className="flex items-center gap-3 mt-10 p-1 bg-card select-none">
						<Button
							id="billing-monthly-btn"
							variant={!isAnnual ? "default" : "outline"}
							size="xs"
							onClick={() => setIsAnnual(false)}
							className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded-none h-auto"
						>
							Monthly Billing
						</Button>
						<Button
							id="billing-annual-btn"
							variant={isAnnual ? "default" : "outline"}
							size="xs"
							onClick={() => setIsAnnual(true)}
							className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded-none h-auto"
						>
							<span>Annual Sync</span>
							<Badge
								variant="outline"
								className="px-1.5 py-0.5 text-[8px] bg-background text-foreground/80 rounded-none"
							>
								-25%
							</Badge>
						</Button>
					</div>
				</div>

				{/* Pricing Cards */}
				<div
					id="pricing-matrix"
					className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch"
				>
					{PRICING_PLANS.map((plan) => {
						const price = isAnnual
							? plan.priceAnnually
							: plan.priceMonthly;
						const isActiveState = plan.popular;

						return (
							<Card
								key={plan.id}
								id={`pricing-card-${plan.id}`}
								className={`flex flex-col justify-between p-8 md:p-10 transition-all relative ${
									isActiveState ? "bg-muted" : "bg-card"
								} rounded-none shadow-none`}
							>
								{isActiveState && (
									<Badge
										id="pricing-card-badge-popular"
										variant="default"
										className="absolute -top-3 left-6 px-3 py-1 text-[9px] font-mono uppercase tracking-widest font-semibold rounded-none"
									>
										Recommended Setup
									</Badge>
								)}

								<CardHeader className="px-0 pt-0">
									<div className="flex items-start justify-between">
										<span className="text-xs font-mono uppercase tracking-widest text-foreground/60 font-semibold">
											{plan.name}
										</span>
										<span className="text-[10px] font-mono text-foreground/45">
											// {plan.id.toUpperCase()}
										</span>
									</div>
								</CardHeader>

								<CardContent className="px-0">
									<div className="flex items-baseline gap-1 bg-muted p-3 font-mono">
										<span className="text-foreground text-3xl md:text-4xl font-display font-bold tracking-tight">
											${price}
										</span>
										<span className="text-xs text-foreground/60 font-mono">
											/ month{" "}
											{isAnnual && (
												<span className="text-[10px] text-primary/80 lowercase">
													(annualized)
												</span>
											)}
										</span>
									</div>

									<p className="text-foreground/80 text-sm leading-relaxed mt-6 min-h-[48px]">
										{plan.description}
									</p>

									<div className="border-t border-border my-6" />

									<div className="flex flex-col gap-3.5">
										<span className="text-[10px] font-mono uppercase tracking-widest text-foreground/45 font-semibold">
											What's Included:
										</span>
										<ul className="flex flex-col gap-3 font-sans text-xs text-foreground/80">
											{plan.features.map((feat, idx) => (
												<li
													key={idx}
													className="flex items-start gap-2.5"
												>
													<span className="w-4 h-4 bg-muted mt-0.5 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 text-primary">
														+
													</span>
													<span>{feat}</span>
												</li>
											))}
										</ul>
									</div>
								</CardContent>

								<CardFooter className="px-0 pb-0">
									<Button
										variant={
											isActiveState
												? "default"
												: "outline"
										}
										size="lg"
										asChild
										className={`w-full text-xs font-mono uppercase tracking-widest rounded-none py-4.5 h-auto ${
											!isActiveState
												? "hover:bg-foreground hover:text-background"
												: ""
										}`}
									>
										<Link
											id={`pricing-cta-${plan.id}`}
											href="/signup"
											className="flex items-center justify-center gap-2"
										>
											<span>{plan.cta}</span>
											<ArrowUpRight className="w-3.5 h-3.5" />
										</Link>
									</Button>
								</CardFooter>
							</Card>
						);
					})}
				</div>

				{/* Bottom Note */}
				<div className="mt-12 flex items-center gap-1.5 justify-center text-[10px] font-mono text-foreground/55 uppercase select-none">
					<Info className="w-3.5 h-3.5 text-primary" />
					<span>
						14-Day Guarantee: Cancel anytime. If you are not
						satisfied, write to us within 14 days for a full refund.
					</span>
				</div>
			</div>
		</section>
	);
}
