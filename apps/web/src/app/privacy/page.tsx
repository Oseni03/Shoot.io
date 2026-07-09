import { ShieldCheck, CheckCircle } from "lucide-react";
import PolicyTabs from "@/components/privacy/policy-tabs";
import { Badge } from "@/components/ui/badge";

export const metadata = {
	title: "Privacy Policy — Boilerplate SaaS",
	description:
		"Our transparent, developer-first policies on data privacy and protection.",
};

export default function PrivacyPage() {
	return (
		<div
			className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 space-y-12 select-none md:py-24"
			id="privacy-page"
		>
			<div className="text-center space-y-4 max-w-2xl mx-auto">
				<div className="flex h-11 w-11 mx-auto items-center justify-center bg-muted text-primary">
					<ShieldCheck className="h-6 w-6" />
				</div>
				<h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
					Securing Your Privacy
				</h1>
				<p className="text-xs md:text-sm text-foreground/60">
					Last revised: June 10, 2026. Explore our transparent
					policies on data privacy and protection.
				</p>
			</div>

			<PolicyTabs />

			<div className="flex flex-wrap items-center justify-center gap-6 pt-8 border-t border-border text-[10px] font-mono text-foreground/50">
				<span className="flex items-center gap-1">
					<CheckCircle className="h-3.5 w-3.5 text-primary" /> CCPA
					Compliant
				</span>
				<span className="flex items-center gap-1">
					<CheckCircle className="h-3.5 w-3.5 text-primary" /> ISO/IEC
					27001 Shielded
				</span>
				<span className="flex items-center gap-1">
					<CheckCircle className="h-3.5 w-3.5 text-primary" /> HIPAA
					Security Safe
				</span>
			</div>
		</div>
	);
}
