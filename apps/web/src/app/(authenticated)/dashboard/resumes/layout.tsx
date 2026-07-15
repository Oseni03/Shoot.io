"use client";

import { usePathname } from "next/navigation";

export default function ResumesLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const isEditor =
		pathname === "/dashboard/resumes/new" ||
		pathname.includes("/edit");

	if (!isEditor) {
		return <div className="mx-auto w-full max-w-5xl p-6">{children}</div>;
	}

	return (
		<div className="fixed inset-0 top-16 bg-background z-10 flex flex-col">
			{children}
		</div>
	);
}


