"use client";

import * as React from "react";
import { Building2, ChevronsUpDown, Plus } from "lucide-react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useOrganization } from "@/contexts/organization";
import { CreateOrganizationModal } from "@/components/create-organization-modal";

export function OrgSwitcher() {
	const { isMobile } = useSidebar();
	const { organizations, activeOrg, setActiveOrg, isLoading } =
		useOrganization();
	const [showCreateModal, setShowCreateModal] = React.useState(false);

	if (isLoading || !activeOrg) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						size="lg"
						className="data-[state=open]:bg-card"
					>
						<div className="flex aspect-square size-8 items-center justify-center bg-muted">
							<Building2 className="size-4 text-foreground/30" />
						</div>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate text-xs font-mono uppercase tracking-widest text-foreground/30">
								Loading...
							</span>
						</div>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-card"
						>
							<div className="flex aspect-square size-8 items-center justify-center bg-muted">
								<Building2 className="size-4 text-foreground/70" />
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate text-xs font-mono uppercase tracking-widest text-foreground/70">
									{activeOrg.name}
								</span>
								<span className="truncate text-[10px] font-mono text-foreground/40">
									{activeOrg.plan}
								</span>
							</div>
							<ChevronsUpDown className="ml-auto size-3 text-foreground/30" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 bg-card"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 font-bold">
							Organizations
						</DropdownMenuLabel>
						{organizations.map((org, index) => (
							<DropdownMenuItem
								key={org.id}
								onClick={() => setActiveOrg(org)}
								className="gap-2 p-2 text-xs font-mono uppercase tracking-widest text-foreground/70 data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
							>
								<div className="flex size-6 items-center justify-center bg-muted">
									<Building2 className="size-3 shrink-0 text-foreground/50" />
								</div>
								<span className="flex-1 truncate">
									{org.name}
								</span>
								<span className="text-[10px] font-mono text-foreground/30">
									{org.plan}
								</span>
								<DropdownMenuShortcut className="text-[10px] font-mono text-foreground/30">
									⌘{index + 1}
								</DropdownMenuShortcut>
							</DropdownMenuItem>
						))}
						<DropdownMenuSeparator className="bg-muted" />
						<DropdownMenuItem
							onClick={() => setShowCreateModal(true)}
							className="gap-2 p-2 text-xs font-mono uppercase tracking-widest text-foreground/50 data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
						>
							<div className="flex size-6 items-center justify-center bg-muted">
								<Plus className="size-3" />
							</div>
							Add organization
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<CreateOrganizationModal
					open={showCreateModal}
					onOpenChange={setShowCreateModal}
				/>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
