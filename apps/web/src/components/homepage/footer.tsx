"use client";

import {
	Activity,
	Check,
	Github,
	Linkedin,
	Send,
	Terminal,
	Twitter,
} from "lucide-react";
import { useRouter } from "next/navigation.js";
import { type MouseEvent, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useZodForm } from "@/hooks/useZodForm";
import { APP } from "@/lib/config";

const NewsletterSchema = z.object({
	email: z.email("Please enter a valid email address."),
});

export default function Footer() {
	const [subscribed, setSubscribed] = useState(false);
	const router = useRouter();

	const form = useZodForm(NewsletterSchema, { email: "" });

	function handleSubscribe(data: { email: string }) {
		setSubscribed(true);
		form.reset({ email: "" });
		setTimeout(() => {
			setSubscribed(false);
		}, 4500);
	}

	const footerLinks = {
		product: [
			{ name: "Features", href: "#features", path: "/" },
			{ name: "Pricing", href: "#pricing", path: "/" },
			{ name: "Examples", href: "#case-studies", path: "/" },
			{ name: "Help Center", href: "#docs", path: "/" },
		],
		company: [
			{ name: "About Us", href: "#about-page", path: "/about" },
			{ name: "Privacy Policy", href: "#privacy-page", path: "/privacy" },
			{ name: "Terms of Service", href: "#", path: "/" },
			{ name: "Contact Support", href: "#", path: "/" },
		],
		resources: [
			{ name: "Documentation", href: "#", path: "/" },
			{ name: "API Status", href: "#", path: "/" },
			{ name: "Changelog", href: "#", path: "/" },
			{ name: "Developer Discord", href: "#", path: "/" },
		],
		legal: [
			{ name: "Privacy Policy", href: "#privacy-page", path: "/privacy" },
			{ name: "Terms of Service", href: "#", path: "/" },
			{ name: "GDPR Addendum", href: "#", path: "/" },
		],
	};

	const handleLinkClick = (e: MouseEvent, href: string, path: string) => {
		if (href !== "#") {
			e.preventDefault();
			router.push(path);
			setTimeout(() => {
				const element = document.querySelector(href);
				if (element) {
					element.scrollIntoView({
						behavior: "smooth",
						block: "start",
					});
				} else {
					window.scrollTo({ top: 0, behavior: "smooth" });
				}
			}, 150);
		} else {
			e.preventDefault();
			router.push(path);
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	return (
		<footer
			className="border-t border-border bg-background pb-16 pt-20 transition-colors duration-300"
			id="footer"
		>
			<div className="mx-auto max-w-7xl px-6 md:px-12">
				{/* Top block: Brand info and newsletter */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-12 border-b border-border/50">
					{/* Logo & description */}
					<div className="space-y-4">
						<div className="flex items-center gap-2.5">
							<div
								onClick={() => {
									router.push("/");
									window.scrollTo({
										top: 0,
										behavior: "smooth",
									});
								}}
								className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
							>
								<div className="flex h-9 w-9 items-center justify-center bg-muted text-foreground">
									<Activity className="h-5 w-5" />
								</div>
								<span className="font-display text-lg font-bold tracking-tight text-foreground">
									Index
									<span className="text-primary">.</span>
								</span>
							</div>
						</div>
						<p className="text-xs text-foreground/60 leading-relaxed max-w-sm">
							Turn your plain-text notes, guides, and newsletters
							into beautiful, professional, and lightning-fast
							public pages.
						</p>
					</div>

					{/* Social connections */}
					<div className="flex items-center gap-3">
						<Button
							variant="outline"
							size="icon"
							asChild
							className="rounded-none"
						>
							<a href="#">
								<Twitter className="h-4 w-4" />
							</a>
						</Button>
						<Button
							variant="outline"
							size="icon"
							asChild
							className="rounded-none"
						>
							<a href="#">
								<Github className="h-4 w-4" />
							</a>
						</Button>
						<Button
							variant="outline"
							size="icon"
							asChild
							className="rounded-none"
						>
							<a href="#">
								<Linkedin className="h-4 w-4" />
							</a>
						</Button>
						<Button
							variant="outline"
							size="icon"
							asChild
							className="rounded-none"
						>
							<a href="#">
								<Terminal className="h-4 w-4" />
							</a>
						</Button>
					</div>

					{/* Newsletter Input */}
					<div className="space-y-3">
						<h4 className="text-xs font-bold uppercase tracking-widest text-foreground font-mono">
							Subscribe to updates
						</h4>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(handleSubscribe)}
								className="flex gap-2 relative"
							>
								<FormField
									name="email"
									render={({ field }) => (
										<FormItem className="flex-1">
											<FormControl>
												<Input
													{...field}
													type="email"
													placeholder="you@example.com"
													disabled={subscribed}
													className="rounded-none text-xs h-9"
													id="footer-email-input"
												/>
											</FormControl>
											<FormMessage className="text-[11px] text-red-500 font-mono" />
										</FormItem>
									)}
								/>
								<Button
									type="submit"
									disabled={subscribed}
									className="rounded-none h-9 px-3.5"
									aria-label="Subscribe"
									id="footer-email-btn"
								>
									{subscribed ? (
										<Check className="h-4 w-4" />
									) : (
										<Send className="h-4 w-4" />
									)}
								</Button>
							</form>
						</Form>
						{subscribed && (
							<p className="text-[10px] text-primary font-medium font-mono">
								✓ Subscribed successfully.
							</p>
						)}
					</div>
				</div>

				{/* Middle Block: Columns of links */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
					{Object.entries(footerLinks).map(([key, links]) => (
						<div key={key}>
							<h5 className="text-[10px] uppercase font-mono font-bold tracking-widest text-foreground mb-4">
								{key.charAt(0).toUpperCase() + key.slice(1)}
							</h5>
							<ul className="space-y-2.5">
								{links.map((link) => (
									<li key={link.name}>
										<a
											href={link.href}
											onClick={(e) =>
												handleLinkClick(
													e,
													link.href,
													link.path,
												)
											}
											className="text-xs text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
										>
											{link.name}
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				{/* Bottom copyright segment */}
				<div className="flex flex-col md:flex-row items-center justify-between border-t border-border/50 pt-8 text-[11px] text-foreground/40 select-none font-mono">
					<p>{APP.copyright}</p>
					<p className="mt-2 md:mt-0">{APP.tagline}</p>
				</div>
			</div>
		</footer>
	);
}
