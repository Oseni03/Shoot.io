"use client";

import {
	BadgeCheck,
	Bell,
	ChevronsUpDown,
	CreditCard,
	LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useLogout } from "@/hooks/useAuth";

function getInitials(name: string | null | undefined): string {
	if (!name) return "?";
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
	return (
		parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
	).toUpperCase();
}

export function NavUser({
	user,
}: {
	user: {
		name: string | null;
		email: string;
		avatar: string | null;
	};
}) {
	const { isMobile } = useSidebar();
	const router = useRouter();
	const logout = useLogout();

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-card"
						>
							<Avatar className="h-8 w-8">
								<AvatarImage
									src={user.avatar ?? ""}
									alt={user.name ?? ""}
								/>
								<AvatarFallback className="bg-card text-foreground text-[10px] font-mono uppercase">
									{getInitials(user.name)}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate text-xs font-mono uppercase tracking-widest text-foreground/70">
									{user.name ?? "User"}
								</span>
								<span className="truncate text-[10px] font-mono text-foreground/40">
									{user.email}
								</span>
							</div>
							<ChevronsUpDown className="ml-auto size-3 text-foreground/30" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 bg-card"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8">
									<AvatarImage
										src={user.avatar ?? ""}
										alt={user.name ?? ""}
									/>
									<AvatarFallback className="bg-card text-foreground text-[10px] font-mono uppercase">
										{getInitials(user.name)}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate text-xs font-mono uppercase tracking-widest text-foreground/70">
										{user.name ?? "User"}
									</span>
									<span className="truncate text-[10px] font-mono text-foreground/40">
										{user.email}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator className="bg-muted" />
						<DropdownMenuGroup>
							<DropdownMenuItem
								className="text-xs font-mono uppercase tracking-widest text-foreground/70 data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
								onClick={() =>
									router.push("/dashboard/settings/profile")
								}
							>
								<BadgeCheck className="size-3.5" />
								Profile
							</DropdownMenuItem>
							<DropdownMenuItem
								className="text-xs font-mono uppercase tracking-widest text-foreground/70 data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
								onClick={() =>
									router.push("/dashboard/settings/billing")
								}
							>
								<CreditCard className="size-3.5" />
								Billing
							</DropdownMenuItem>
							<DropdownMenuItem
								className="text-xs font-mono uppercase tracking-widest text-foreground/70 data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
								onClick={() =>
									router.push(
										"/dashboard/settings/notifications",
									)
								}
							>
								<Bell className="size-3.5" />
								Notifications
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator className="bg-muted" />
						<DropdownMenuItem
							className="text-xs font-mono uppercase tracking-widest text-foreground/70 data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
							onClick={() => logout.mutate()}
						>
							<LogOut className="size-3.5" />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
