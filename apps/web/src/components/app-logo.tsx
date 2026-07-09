import Image from "next/image";
import { APP } from "@/lib/config";

interface AppLogoProps {
	width?: number;
	height?: number;
	className?: string;
	alt?: string;
}

export function AppLogo({
	width = 32,
	height = 32,
	className = "",
	alt = `${APP.name} logo`,
}: AppLogoProps) {
	return (
		<Image
			src="/logo.png"
			alt={alt}
			width={width}
			height={height}
			className={className}
			priority
		/>
	);
}
