"use client";

import { FileText, Loader2, MoreHorizontal, Plus, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteResume, useResumes, useSetMasterResume } from "@/hooks/useResumes";
import { extractApiErrorMessage } from "@/lib/error";
import type { ResumeListEntry } from "@/schemas";

export default function ResumesPage() {
	const router = useRouter();
	const { data: resumes, isLoading } = useResumes();
	const deleteResume = useDeleteResume();
	const setMasterResume = useSetMasterResume();
	const [deleteTarget, setDeleteTarget] = useState<ResumeListEntry | null>(null);

	async function handleSetMaster(id: string) {
		try {
			await setMasterResume.mutateAsync(id);
			toast.success("Master resume updated");
		} catch (err) {
			toast.error(extractApiErrorMessage(err, "Failed to set master resume"));
		}
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		try {
			await deleteResume.mutateAsync(deleteTarget.id);
			toast.success("Resume deleted");
			setDeleteTarget(null);
		} catch (err) {
			toast.error(extractApiErrorMessage(err, "Failed to delete resume"));
		}
	}

	return (
		<div className="flex flex-1 flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-display font-bold tracking-tighter">
						Resumes
					</h1>
					<p className="text-sm text-foreground/70 mt-1">
						Create and manage your master resumes
					</p>
				</div>
				<Button onClick={() => router.push("/dashboard/resumes/new")}>
					<Plus className="size-4 mr-1.5" />
					New Resume
				</Button>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center py-16">
					<Loader2 className="size-6 animate-spin text-muted-foreground" />
				</div>
			) : !resumes || resumes.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg">
					<FileText className="size-10 text-foreground/20 mb-4" />
					<p className="text-sm font-mono uppercase tracking-widest text-foreground/40 font-semibold">
						No resumes yet
					</p>
					<p className="text-xs text-foreground/30 mt-1">
						Create your first resume to get started
					</p>
					<Button
						onClick={() => router.push("/dashboard/resumes/new")}
						className="mt-6"
					>
						<Plus className="size-4 mr-1.5" />
						Create Resume
					</Button>
				</div>
			) : (
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{resumes.map((r) => (
						<Link
							key={r.id}
							href={`/dashboard/resumes/${r.id}/edit`}
							className="group relative flex flex-col gap-2 rounded-lg border border-border bg-card p-5 hover:border-foreground/20 transition-colors"
						>
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-2 min-w-0">
									<FileText className="size-4 text-foreground/40 shrink-0" />
									<span className="text-sm font-medium truncate">
										{r.title}
									</span>
								</div>
								{r.is_master && (
									<Star className="size-3.5 text-amber-500 fill-amber-500 shrink-0" />
								)}
							</div>
							<div className="flex items-center gap-3 text-[10px] font-mono text-foreground/40">
								<span>{new Date(r.updated_at).toLocaleDateString()}</span>
								{r.is_master && (
									<span className="text-amber-500/70 font-semibold uppercase tracking-widest">
										Master
									</span>
								)}
							</div>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button
										type="button"
										onClick={(e) => e.preventDefault()}
										className="absolute top-3 right-3 size-7 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
									>
										<MoreHorizontal className="size-3.5 text-foreground/40" />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-40">
									{!r.is_master && (
										<DropdownMenuItem
											onClick={(e) => {
												e.preventDefault();
												handleSetMaster(r.id);
											}}
										>
											<Star className="size-3.5 mr-2" />
											Set as Master
										</DropdownMenuItem>
									)}
									<DropdownMenuItem
										className="text-destructive focus:text-destructive"
										onClick={(e) => {
											e.preventDefault();
											setDeleteTarget(r);
										}}
									>
										<Trash2 className="size-3.5 mr-2" />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</Link>
					))}
				</div>
			)}

			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Resume</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "{deleteTarget?.title}"?
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
