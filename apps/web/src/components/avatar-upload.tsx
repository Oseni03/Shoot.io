"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ENV } from "@/lib/config";

function getInitials(name: string | null | undefined): string {
	if (!name) return "?";
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
	return (
		parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
	).toUpperCase();
}

interface AvatarUploadProps {
	currentUrl: string | null;
	userName: string | null;
	onUpload: (url: string) => void;
	disabled?: boolean;
}

export function AvatarUpload({
	currentUrl,
	userName,
	onUpload,
	disabled,
}: AvatarUploadProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);

	async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			toast.error("Please select an image file");
			return;
		}

		const cloudName = ENV.cloudinaryCloudName;
		const uploadPreset = ENV.cloudinaryUploadPreset;

		if (!cloudName || !uploadPreset) {
			toast.error("Cloudinary is not configured");
			return;
		}

		setUploading(true);

		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("upload_preset", uploadPreset);

			const res = await fetch(
				`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
				{ method: "POST", body: formData },
			);

			if (!res.ok) {
				throw new Error("Upload failed");
			}

			const data = await res.json();
			onUpload(data.secure_url as string);
			toast.success("Avatar updated");
		} catch {
			toast.error("Failed to upload avatar");
		} finally {
			setUploading(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	}

	return (
		<div className="relative inline-block">
			<button
				type="button"
				disabled={disabled || uploading}
				className="group relative rounded-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				onClick={() => inputRef.current?.click()}
			>
				<Avatar className="h-20 w-20">
					<AvatarImage src={currentUrl ?? ""} alt={userName ?? ""} />
					<AvatarFallback className="text-lg font-mono">
						{getInitials(userName)}
					</AvatarFallback>
				</Avatar>
				<div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
					{uploading ? (
						<Loader2 className="size-5 animate-spin text-white" />
					) : (
						<Camera className="size-5 text-white" />
					)}
				</div>
			</button>
			<input
				ref={inputRef}
				type="file"
				accept="image/png,image/jpeg,image/webp,image/gif"
				className="hidden"
				onChange={handleFileSelect}
			/>
		</div>
	);
}
