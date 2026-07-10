import { AppSidebar } from "@/components/app-sidebar";
import { OrganizationGuard } from "@/components/organization-guard";
import { ThemeToggle } from "@/components/theme-toggle";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<OrganizationGuard>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset>
					<header className="flex h-16 shrink-0 items-center border-b border-border bg-background">
						<div className="flex items-center gap-2 px-6 w-full">
							<SidebarTrigger className="-ml-1" />
							<span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary font-bold select-none">
								DASHBOARD
							</span>
							<ThemeToggle />
						</div>
					</header>
					<div className="flex flex-1 flex-col bg-background">
						<div className="mx-auto w-full max-w-5xl p-6">
							{children}
						</div>
					</div>
				</SidebarInset>
			</SidebarProvider>
		</OrganizationGuard>
	);
}
