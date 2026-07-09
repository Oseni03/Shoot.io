"use client";

import { Settings2, SquareTerminal } from "lucide-react";
import type * as React from "react";
import { NavUser } from "@/components/nav-user";
import { OrgSwitcher } from "@/components/org-switcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { useMe } from "@/hooks/useAuth";
import { NavMain } from "./nav-main";

const navMain = [
	{
		title: "Dashboard",
		url: "/dashboard",
		icon: SquareTerminal,
		isActive: true,
	},
	{
		title: "Settings",
		url: "#",
		icon: Settings2,
		isActive: true,
		items: [
			{ title: "Profile", url: "/dashboard/settings/profile" },
			{ title: "General", url: "/dashboard/settings/general" },
			{ title: "Members", url: "/dashboard/settings/members" },
			{ title: "Billing", url: "/dashboard/settings/billing" },
			{
				title: "Notifications",
				url: "/dashboard/settings/notifications",
			},
		],
	},
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { data: me } = useMe();

	return (
		<Sidebar collapsible="icon" className="bg-muted border-r-0" {...props}>
			<SidebarHeader>
				<OrgSwitcher />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navMain} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser
					user={{
						name: me?.full_name ?? null,
						email: me?.email ?? "",
						avatar: me?.avatar_url ?? null,
					}}
				/>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
