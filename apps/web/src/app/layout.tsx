import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import QueryProvider from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/theme-control";
import { APP, DEFAULTS } from "@/lib/config";

const manrope = Manrope({
	variable: "--font-manrope",
	subsets: ["latin"],
});

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: APP.defaultTitle,
	description: APP.description,
};

export const viewport: Viewport = {
	themeColor: [
		{
			media: "(prefers-color-scheme: light)",
			color: DEFAULTS.themeColorLight,
		},
		{
			media: "(prefers-color-scheme: dark)",
			color: DEFAULTS.themeColorDark,
		},
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${manrope.variable} ${inter.variable} font-sans antialiased`}
			>
				<ThemeProvider>
					<QueryProvider>{children}</QueryProvider>
				</ThemeProvider>
				<Toaster />
			</body>
		</html>
	);
}
