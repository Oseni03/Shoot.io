"use client";

import { Key, Lock } from "lucide-react";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function ResetPasswordForm() {
	return (
		<div className="flex flex-col gap-3.5">
			<FormField
				name="verificationCode"
				render={({ field }) => (
					<FormItem>
						<FormLabel className="text-[10px] font-mono uppercase tracking-wider text-foreground/75 font-semibold">
							Validation Hex Token (6-digit code){" "}
							<span className="text-primary">*</span>
						</FormLabel>
						<div className="relative">
							<FormControl>
								<Input
									{...field}
									type="text"
									maxLength={6}
									placeholder="e.g. 5F832A"
									className="h-11 pl-10 bg-card text-xs font-mono rounded-none uppercase"
								/>
							</FormControl>
							<Key className="absolute left-3.5 top-3.5 w-4 h-4 text-foreground/40 pointer-events-none" />
						</div>
						<FormMessage className="text-[11px] text-red-500 font-mono" />
					</FormItem>
				)}
			/>

			<FormField
				name="password"
				render={({ field }) => (
					<FormItem>
						<FormLabel className="text-[10px] font-mono uppercase tracking-wider text-foreground/75 font-semibold">
							Compile New Security Password{" "}
							<span className="text-primary">*</span>
						</FormLabel>
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

			<FormField
				name="confirmPassword"
				render={({ field }) => (
					<FormItem>
						<FormLabel className="text-[10px] font-mono uppercase tracking-wider text-foreground/75 font-semibold">
							Confirm Password Parity{" "}
							<span className="text-primary">*</span>
						</FormLabel>
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
