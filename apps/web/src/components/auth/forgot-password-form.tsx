"use client";

import { Mail } from "lucide-react";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordForm() {
	return (
		<div className="flex flex-col gap-4">
			<p className="text-xs text-foreground/70 leading-relaxed font-sans bg-card p-3.5">
				Specify your registered email address below. We will dispatch an
				automated validation hex-token to revert credentials of your
				identity profile.
			</p>
			<FormField
				name="email"
				render={({ field }) => (
					<FormItem>
						<FormLabel className="text-[10px] font-mono uppercase tracking-wider text-foreground/75 font-semibold">
							Target Email Destination{" "}
							<span className="text-primary">*</span>
						</FormLabel>
						<div className="relative">
							<FormControl>
								<Input
									{...field}
									type="email"
									placeholder="ops@index.so"
									className="h-11 pl-10 bg-card text-xs font-mono rounded-none"
								/>
							</FormControl>
							<Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-foreground/40 pointer-events-none" />
						</div>
						<FormMessage className="text-[11px] text-red-500 font-mono" />
					</FormItem>
				)}
			/>
		</div>
	);
}
