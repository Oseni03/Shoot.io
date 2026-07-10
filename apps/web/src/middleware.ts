import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ROUTES, STORAGE_KEYS } from "@/lib/config";

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const token = request.cookies.get(STORAGE_KEYS.accessToken)?.value;
	const isAuthenticated = !!token;

	const isProtected = ROUTES.protectedPrefixes.some((prefix) =>
		pathname.startsWith(prefix),
	);
	const isAuthRoute = ROUTES.authRoutes.some((route) =>
		pathname.startsWith(route),
	);

	if (isProtected && !isAuthenticated) {
		const url = request.nextUrl.clone();
		url.pathname = ROUTES.login;
		if (pathname !== ROUTES.login) {
			url.searchParams.set("redirect", pathname + request.nextUrl.search);
		}
		return NextResponse.redirect(url);
	}

	if (isAuthRoute && isAuthenticated) {
		const url = request.nextUrl.clone();
		url.pathname = ROUTES.dashboard.root;
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/dashboard/:path*",
		"/invitations/:path*",
		"/onboarding/:path*",
		"/mfa/:path*",
		"/login",
		"/signup",
		"/forgot-password",
		"/reset-password",
	],
};
