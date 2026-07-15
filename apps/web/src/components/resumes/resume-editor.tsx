"use client";

import { useEffect, useRef } from "react";
import { useOrganization } from "@/contexts/organization";
import { CenterColumn } from "./center-column";
import { LeftColumn } from "./left-column";
import { RightColumn } from "./right-column";
import { TopToolbar } from "./top-toolbar";
import { useResumeEditor } from "./useResumeEditor";

interface ResumeEditorProps {
	resumeId: string | null;
}

export function ResumeEditor({ resumeId }: ResumeEditorProps) {
	const { activeOrg } = useOrganization();
	const editor = useResumeEditor(resumeId);
	const hasPrompted = useRef(false);

	useEffect(() => {
		if (!editor.dirty || hasPrompted.current) return;
		const handler = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = "";
		};
		window.addEventListener("beforeunload", handler);
		hasPrompted.current = true;
		return () => {
			window.removeEventListener("beforeunload", handler);
			hasPrompted.current = false;
		};
	}, [editor.dirty]);

	if (editor.isLoading) {
		return (
			<div className="flex items-center justify-center h-full min-h-[400px]">
				<div className="flex flex-col items-center gap-3">
					<div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
					<p className="text-xs font-mono uppercase tracking-widest text-foreground/40">
						Loading resume...
					</p>
				</div>
			</div>
		);
	}

	if (editor.isError) {
		return (
			<div className="flex items-center justify-center h-full min-h-[400px]">
				<div className="text-center max-w-xs">
					<p className="text-xs font-mono uppercase tracking-widest text-destructive font-semibold">
						Failed to load resume
					</p>
					<p className="text-[10px] font-mono text-foreground/40 mt-2">
						The resume could not be found or you don't have access to it.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			<TopToolbar
				title={editor.state.title}
				onTitleChange={editor.setTitle}
				isMaster={editor.isMaster}
				onToggleMaster={editor.toggleMaster}
				saving={editor.saving}
				dirty={editor.dirty}
				lastSaved={editor.lastSaved}
				onSave={editor.saveNow}
			/>

			<div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
				<aside className="lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto bg-background">
					<div className="p-4">
						<h2 className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 font-bold mb-4 px-1">
							Sections
						</h2>
						<LeftColumn
							summary={editor.state.summary.content}
							onSummaryChange={editor.setSummary}
							experiences={editor.experiences}
							educations={editor.educations}
							skills={editor.skills}
							projects={editor.projects}
							certifications={editor.certifications}
						/>
					</div>
				</aside>

				<main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-8">
					<CenterColumn state={editor.state} />
				</main>

				<aside className="lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l border-border overflow-y-auto bg-background">
					<div className="p-4">
						<h2 className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 font-bold mb-4 px-1">
							Settings
						</h2>
						<RightColumn
							settings={editor.state.settings}
							onChange={(settings) =>
								editor.updateState({ settings })
							}
						/>
					</div>
				</aside>
			</div>
		</div>
	);
}
