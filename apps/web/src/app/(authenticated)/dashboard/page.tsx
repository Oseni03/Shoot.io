"use client";

import { Activity, BarChart3, Podcast, Users } from "lucide-react";

import { useOrganization } from "@/contexts/organization";

import { Skeleton } from "@/components/ui/skeleton";

const statLabels = [
	{ title: "Total Projects", icon: Podcast },
	{ title: "Total Episodes", icon: Activity },
	{ title: "Total Listeners", icon: BarChart3 },
	{ title: "Organization Members", icon: Users },
];

export default function DashboardPage() {
	const { activeOrg } = useOrganization();

	return (
		<div className="flex flex-1 flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-foreground text-2xl md:text-3xl font-display font-bold tracking-tighter mt-2">
						{activeOrg?.name ?? "Dashboard"}
					</h1>
					<p className="text-foreground/70 text-xs md:text-sm font-mono uppercase tracking-widest mt-3">
						Organization overview and performance metrics
					</p>
				</div>
			</div>

			{/* Placeholder stat cards — wire up to your API */}
			<div className="grid gap-px md:grid-cols-2 lg:grid-cols-4 bg-muted">
				{statLabels.map((stat) => (
					<div
						key={stat.title}
						className="bg-background p-6 flex flex-col gap-3"
					>
						<div className="flex items-center justify-between">
							<span className="text-[10px] font-mono uppercase tracking-widest text-foreground/50 font-semibold">
								{stat.title}
							</span>
							<stat.icon className="size-3.5 text-foreground/40" />
						</div>
						<Skeleton className="h-9 w-20 my-1" />
						<div className="border-t border-border/40 pt-3">
							<Skeleton className="h-3 w-32" />
						</div>
					</div>
				))}
			</div>

			{/* Bottom panels */}
			<div className="grid gap-px md:grid-cols-2 lg:grid-cols-7 bg-muted mt-8">
				<div className="bg-background lg:col-span-4 p-6 md:p-8">
					<div className="flex items-center justify-between border-b border-border pb-4 mb-6">
						<div>
							<span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
								01 / ACTIVITY
							</span>
							<h3 className="text-sm font-display font-bold tracking-tight text-foreground mt-1">
								Recent Activity
							</h3>
						</div>
					</div>
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<Activity className="size-6 text-foreground/30 mb-4" />
						<p className="text-xs font-mono uppercase tracking-widest text-foreground/50 font-semibold">
							No recent activity
						</p>
						<p className="text-[10px] font-mono text-foreground/40 mt-2">
							Activity from your projects will appear here
						</p>
					</div>
				</div>

				<div className="bg-background lg:col-span-3 p-6 md:p-8">
					<div className="flex items-center justify-between border-b border-border pb-4 mb-6">
						<div>
							<span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
								02 / SCHEDULE
							</span>
							<h3 className="text-sm font-display font-bold tracking-tight text-foreground mt-1">
								Upcoming Episodes
							</h3>
						</div>
					</div>
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<Podcast className="size-6 text-foreground/30 mb-4" />
						<p className="text-xs font-mono uppercase tracking-widest text-foreground/50 font-semibold">
							No upcoming episodes
						</p>
						<p className="text-[10px] font-mono text-foreground/40 mt-2">
							Create your first episode to get started
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
