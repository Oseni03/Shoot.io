"use client";

import { Lock, Mail, User } from "lucide-react";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function SignUpForm() {
	return (
		<div className="flex flex-col gap-3.5">
			<FormField
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel className="text-[10px] font-mono uppercase tracking-wider text-foreground/75 font-semibold">
							Legal Name / Workspace Owner{" "}
							<span className="text-primary">*</span>
						</FormLabel>
						<div className="relative">
							<FormControl>
								<Input
									{...field}
									placeholder="Alice Sterling"
									className="h-11 pl-10 bg-card text-xs font-mono rounded-none"
								/>
							</FormControl>
							<User className="absolute left-3.5 top-3.5 w-4 h-4 text-foreground/40 pointer-events-none" />
						</div>
						<FormMessage className="text-[11px] text-red-500 font-mono" />
					</FormItem>
				)}
			/>

			<FormField
				name="email"
				render={({ field }) => (
					<FormItem>
						<FormLabel className="text-[10px] font-mono uppercase tracking-wider text-foreground/75 font-semibold">
							System Account Email{" "}
							<span className="text-primary">*</span>
						</FormLabel>
						<div className="relative">
							<FormControl>
								<Input
									{...field}
									type="email"
									placeholder="alice@index.so"
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
						<FormLabel className="text-[10px] font-mono uppercase tracking-wider text-foreground/75 font-semibold">
							Master Password{" "}
							<span className="text-primary">*</span>
						</FormLabel>
						<div className="relative">
							<FormControl>
								<Input
									{...field}
									type="password"
									placeholder="At least 8 characters"
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
