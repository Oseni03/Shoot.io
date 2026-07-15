"use client";

import {
	CheckCircle2,
	Loader2,
	Save,
	Upload,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface TopToolbarProps {
	title: string;
	onTitleChange: (title: string) => void;
	isMaster: boolean;
	onToggleMaster: () => void;
	saving: boolean;
	dirty: boolean;
	lastSaved: Date | null;
	onSave: () => void;
}

export function TopToolbar({
	title,
	onTitleChange,
	isMaster,
	onToggleMaster,
	saving,
	dirty,
	lastSaved,
	onSave,
}: TopToolbarProps) {
	return (
		<div className="flex items-center gap-4 border-b border-border bg-background px-6 py-3">
			<div className="flex-1 min-w-0">
				<Input
					value={title}
					onChange={(e) => onTitleChange(e.target.value)}
					className="h-8 border-0 bg-transparent px-0 text-lg font-display font-bold tracking-tight focus-visible:ring-0"
				/>
			</div>

			<div className="hidden sm:flex items-center gap-3">
				<div className="flex items-center gap-2">
					<Label
						htmlFor="master-toggle"
						className="text-[10px] font-mono uppercase tracking-widest text-foreground/50 cursor-pointer"
					>
						Master
					</Label>
					<Switch
						id="master-toggle"
						checked={isMaster}
						onCheckedChange={onToggleMaster}
						className="scale-75"
					/>
				</div>

				<div className="flex items-center gap-1.5 text-[10px] font-mono text-foreground/40">
					{saving ? (
						<>
							<Loader2 className="size-3 animate-spin" />
							<span>Saving...</span>
						</>
					) : dirty ? (
						<>
							<div className="size-2 rounded-full bg-amber-400" />
							<span>Unsaved</span>
						</>
					) : lastSaved ? (
						<>
							<CheckCircle2 className="size-3 text-emerald-500" />
							<span>Saved</span>
						</>
					) : null}
				</div>

				<button
					type="button"
					onClick={onSave}
					disabled={saving || !dirty}
					className={cn(
						"inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono uppercase tracking-widest transition-colors",
						"bg-primary text-primary-foreground hover:bg-primary/90",
						"disabled:opacity-40 disabled:pointer-events-none",
					)}
				>
					{saving ? (
						<Loader2 className="size-3.5 animate-spin" />
					) : (
						<Save className="size-3.5" />
					)}
					Save
				</button>
			</div>

			<button
				type="button"
				onClick={onSave}
				disabled={saving || !dirty}
				className="sm:hidden inline-flex items-center justify-center size-9 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
			>
				{saving ? (
					<Loader2 className="size-4 animate-spin" />
				) : (
					<Upload className="size-4" />
				)}
			</button>
		</div>
	);
}
