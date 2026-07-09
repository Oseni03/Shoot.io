"use client";

import { Bell } from "lucide-react";

export default function NotificationsPage() {
	return (
		<div className="flex flex-1 flex-col gap-8">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Notifications
				</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Manage your notification preferences.
				</p>
			</div>

			<div className="flex flex-col items-center justify-center py-16 text-center">
				<Bell className="text-muted-foreground size-8 mb-4" />
				<p className="text-muted-foreground text-sm font-medium">
					Notification preferences coming soon
				</p>
				<p className="text-muted-foreground/60 mt-1 text-xs">
					You&apos;ll be able to configure email and in-app
					notification settings here.
				</p>
			</div>
		</div>
	);
}
