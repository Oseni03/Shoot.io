"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	type ReactNode,
} from "react";
import { STORAGE_KEYS, DEFAULTS } from "@/lib/config";

export type ThemeMode = "light" | "dark";

interface ThemeContextType {
	themeMode: ThemeMode;
	toggleTheme: () => void;
	primaryColor: string;
	setPrimaryColor: (color: string) => void;
	resetPrimaryColor: () => void;
	isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem(
				STORAGE_KEYS.themeMode,
			) as ThemeMode;
			if (saved === "light" || saved === "dark") {
				return saved;
			}
			const systemPrefersDark = window.matchMedia(
				"(prefers-color-scheme: dark)",
			).matches;
			return systemPrefersDark ? "dark" : "light";
		}
		return "light";
	});

	const [primaryColor, setPrimaryColorState] = useState<string>(() => {
		if (typeof window !== "undefined") {
			const savedColor = localStorage.getItem(STORAGE_KEYS.primaryColor);
			if (savedColor && savedColor.startsWith("#")) {
				return savedColor;
			}
		}
		return DEFAULTS.primaryColor;
	});

	useEffect(() => {
		const root = document.documentElement;
		if (themeMode === "dark") {
			root.classList.add("dark");
		} else {
			root.classList.remove("dark");
		}
		localStorage.setItem(STORAGE_KEYS.themeMode, themeMode);
		localStorage.setItem(STORAGE_KEYS.primaryColor, primaryColor);
	}, [themeMode, primaryColor]);

	const toggleTheme = useCallback(() => {
		setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
	}, []);

	const setPrimaryColor = useCallback((color: string) => {
		setPrimaryColorState(color);
	}, []);

	const resetPrimaryColor = useCallback(() => {
		setPrimaryColorState(DEFAULTS.primaryColor);
	}, []);

	return (
		<ThemeContext.Provider
			value={{
				themeMode,
				toggleTheme,
				primaryColor,
				setPrimaryColor,
				resetPrimaryColor,
				isDark: themeMode === "dark",
			}}
		>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
