"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/config";

export default function Navbar() {
	const [activeLink, setActiveLink] = useState("#features");
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 20);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const handleClick = (href: string) => {
		setActiveLink(href);
		const targetElement = document.querySelector(href);
		if (targetElement) {
			targetElement.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<nav
			id="main-navbar"
			className={`sticky top-0 z-40 w-full transition-all duration-200 border-b border-border bg-background ${
				scrolled ? "shadow-sm" : ""
			}`}
		>
			<div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
				{/* Logo / Brand Name */}
				<div className="flex items-center gap-2">
					<a
						id="brand-logo-link"
						href="#"
						className="text-foreground font-bold tracking-tighter text-xl flex items-center gap-1 hover:opacity-85 transition-opacity"
					>
						<span className="w-5 h-5 border-2 border-foreground flex items-center justify-center font-mono text-[10px] select-none">
							I
						</span>
						<span>INDEX</span>
					</a>
				</div>

				{/* Middle Links */}
				<div className="hidden md:flex items-center gap-2 h-full">
					{NAV_LINKS.map((link) => {
						const isActive = activeLink === link.href;
						return (
							<Button
								key={link.href}
								id={`nav-link-${link.label.toLowerCase()}`}
								variant="ghost"
								size="xs"
								onClick={() => handleClick(link.href)}
								className="relative h-20 flex items-center text-xs font-mono uppercase tracking-widest text-foreground/75 hover:text-foreground rounded-none"
							>
								<span>{link.label}</span>
								{isActive && (
									<span
										id={`active-indicator-${link.label.toLowerCase()}`}
										className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
									/>
								)}
							</Button>
						);
					})}
				</div>

				{/* Right Actions */}
				<div className="flex items-center gap-4">
					<ThemeToggle />

					<Button
						variant="ghost"
						size="xs"
						asChild
						className="hidden sm:inline-flex text-xs font-mono uppercase tracking-wider text-foreground/70 hover:text-foreground rounded-none"
					>
						<Link id="nav-secondary-signin" href="/login">
							Sign In
						</Link>
					</Button>

					<Button
						variant="default"
						size="sm"
						asChild
						className="text-xs font-mono uppercase tracking-wider rounded-none px-5 py-2.5"
					>
						<Link id="nav-primary-signup" href="/signup">
							<div className="flex items-center gap-1.5">
								<span>Start Free</span>
								<ArrowUpRight className="w-3.5 h-3.5" />
							</div>
						</Link>
					</Button>
				</div>
			</div>
		</nav>
	);
}
