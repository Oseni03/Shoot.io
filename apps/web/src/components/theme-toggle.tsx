"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-control";

export function ThemeToggle() {
	const { toggleTheme } = useTheme();

	return (
		<Button
			variant="ghost"
			size="icon"
			className="size-9 rounded-none border border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent transition-all"
			onClick={toggleTheme}
			aria-label="Toggle theme"
		>
			<Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
			<Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
		</Button>
	);
}
