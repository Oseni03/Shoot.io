"use client";

import { Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/config";

export default function SignInForm() {
	const router = useRouter();

	return (
		<div className="flex flex-col gap-4">
			<FormField
				name="email"
				render={({ field }) => (
					<FormItem>
						<FormLabel className="text-[10px] font-mono uppercase tracking-wider text-foreground/75 font-semibold">
							Email Destination{" "}
							<span className="text-primary">*</span>
						</FormLabel>
						<div className="relative">
							<FormControl>
								<Input
									{...field}
									type="email"
									placeholder="e.g. ops@workspace.so"
									className="h-11 pl-10 bg-card text-xs font-mono rounded-none"
								/>
							</FormControl>
							<Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-foreground/40 pointer-events-none" />
						</div>
						<FormMessage className="text-[11px] text-red-500 font-mono" />
					</FormItem>
				)}
			/>

			<FormField
				name="password"
				render={({ field }) => (
					<FormItem>
						<div className="flex justify-between items-center">
							<FormLabel className="text-[10px] font-mono uppercase tracking-wider text-foreground/75 font-semibold">
								Security Password{" "}
								<span className="text-primary">*</span>
							</FormLabel>
							<Button
								type="button"
								variant="link"
								size="xs"
								onClick={() =>
									router.push(ROUTES.forgotPassword)
								}
								className="text-[9px] font-mono text-primary uppercase tracking-widest h-auto p-0"
							>
								Forgot Token?
							</Button>
						</div>
						<div className="relative">
							<FormControl>
								<Input
									{...field}
									type="password"
									placeholder="••••••••••••"
									className="h-11 pl-10 bg-card text-xs font-mono rounded-none"
								/>
							</FormControl>
							<Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-foreground/40 pointer-events-none" />
						</div>
						<FormMessage className="text-[11px] text-red-500 font-mono" />
					</FormItem>
				)}
			/>
		</div>
	);
}
