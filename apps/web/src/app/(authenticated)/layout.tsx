import { OrganizationProvider } from "@/contexts/organization";

export default function AuthenticatedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <OrganizationProvider>{children}</OrganizationProvider>;
}
