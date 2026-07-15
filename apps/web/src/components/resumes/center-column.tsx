"use client";

import type { ResumeSettingsData } from "@/schemas";
import type { ResumeEditorState } from "./useResumeEditor";

interface CenterColumnProps {
	state: ResumeEditorState;
}

function hasNoContent(state: ResumeEditorState): boolean {
	return (
		!state.summary.content &&
		state.experiences.length === 0 &&
		state.educations.length === 0 &&
		state.skills.length === 0 &&
		state.projects.length === 0 &&
		state.certifications.length === 0
	);
}

export function CenterColumn({ state }: CenterColumnProps) {
	if (hasNoContent(state)) {
		return (
			<div className="flex items-center justify-center h-full min-h-[400px]">
				<div className="text-center max-w-xs">
					<div className="size-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
						<svg
							className="size-6 text-foreground/30"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={1.5}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
							/>
						</svg>
					</div>
					<p className="text-xs font-mono uppercase tracking-widest text-foreground/40 font-semibold">
						Your resume preview will appear here
					</p>
					<p className="text-[10px] font-mono text-foreground/30 mt-2">
						Add your first section to see the preview
					</p>
				</div>
			</div>
		);
	}

	const { settings, summary, experiences, educations, skills, projects, certifications } = state;

	const sectionOrder: { key: string; label: string; render: () => React.ReactNode }[] = [];

	if (summary.content) {
		sectionOrder.push({
			key: "summary",
			label: "Summary",
			render: () => (
				<p className="text-sm leading-relaxed" style={textStyle}>
					{summary.content}
				</p>
			),
		});
	}

	if (experiences.length > 0) {
		sectionOrder.push({
			key: "experience",
			label: "Experience",
			render: () => (
				<div className="space-y-4">
					{experiences.map((exp, i) => (
						<div key={exp._id ?? i}>
							<div className="flex items-start justify-between">
								<div>
									<p className="font-semibold text-sm" style={textStyle}>
										{exp.title || "Untitled"}
									</p>
									<p className="text-xs text-foreground/60" style={textStyle}>
										{exp.company}
										{exp.location ? ` — ${exp.location}` : ""}
									</p>
								</div>
								<p className="text-[11px] text-foreground/50 whitespace-nowrap ml-4" style={textStyle}>
									{exp.startDate || "Present"}
									{exp.endDate ? ` — ${exp.endDate}` : exp.isCurrent ? " — Present" : ""}
								</p>
							</div>
							{exp.bullets.filter(Boolean).length > 0 && (
								<ul className="mt-2 space-y-1">
									{exp.bullets.filter(Boolean).map((b, j) => (
										<li key={j} className="text-xs text-foreground/70 flex gap-2" style={textStyle}>
											<span className="text-foreground/30 select-none mt-0.5">•</span>
											<span>{b}</span>
										</li>
									))}
								</ul>
							)}
						</div>
					))}
				</div>
			),
		});
	}

	if (educations.length > 0) {
		sectionOrder.push({
			key: "education",
			label: "Education",
			render: () => (
				<div className="space-y-3">
					{educations.map((edu, i) => (
						<div key={edu._id ?? i}>
							<p className="font-semibold text-sm" style={textStyle}>
								{edu.school || "Untitled"}
							</p>
							<p className="text-xs text-foreground/60" style={textStyle}>
								{edu.degree}
								{edu.field ? ` in ${edu.field}` : ""}
							</p>
							<p className="text-[11px] text-foreground/50" style={textStyle}>
								{edu.startDate || ""}
								{edu.endDate ? ` — ${edu.endDate}` : ""}
								{edu.gpa ? ` | GPA: ${edu.gpa}` : ""}
							</p>
						</div>
					))}
				</div>
			),
		});
	}

	if (skills.length > 0) {
		sectionOrder.push({
			key: "skills",
			label: "Skills",
			render: () => (
				<div className="flex flex-wrap gap-x-4 gap-y-1">
					{skills.map((skill, i) => (
						<span key={skill._id ?? i} className="text-sm" style={textStyle}>
							{skill.name}
							{skill.proficiency ? ` (${"●".repeat(skill.proficiency)}${"○".repeat(5 - skill.proficiency)})` : ""}
						</span>
					))}
				</div>
			),
		});
	}

	if (projects.length > 0) {
		sectionOrder.push({
			key: "projects",
			label: "Projects",
			render: () => (
				<div className="space-y-3">
					{projects.map((proj, i) => (
						<div key={proj._id ?? i}>
							<div className="flex items-start justify-between">
								<div>
									<p className="font-semibold text-sm" style={textStyle}>
										{proj.name || "Untitled"}
									</p>
									{proj.url && (
										<p className="text-[11px] text-primary/70" style={textStyle}>
											{proj.url}
										</p>
									)}
								</div>
							</div>
							{proj.description && (
								<p className="text-xs text-foreground/70 mt-1" style={textStyle}>
									{proj.description}
								</p>
							)}
							{proj.technologies.filter(Boolean).length > 0 && (
								<p className="text-[11px] text-foreground/50 mt-1" style={textStyle}>
									{proj.technologies.filter(Boolean).join(", ")}
								</p>
							)}
						</div>
					))}
				</div>
			),
		});
	}

	if (certifications.length > 0) {
		sectionOrder.push({
			key: "certifications",
			label: "Certifications",
			render: () => (
				<div className="space-y-2">
					{certifications.map((cert, i) => (
						<div key={cert._id ?? i}>
							<p className="text-sm" style={textStyle}>
								<span className="font-semibold">{cert.name || "Untitled"}</span>
								{cert.issuer ? ` — ${cert.issuer}` : ""}
							</p>
							<p className="text-[11px] text-foreground/50" style={textStyle}>
								{cert.earnedDate || ""}
							</p>
						</div>
					))}
				</div>
			),
		});
	}

	const textStyle: React.CSSProperties = {
		fontFamily: settings.fontFamily,
		fontSize: `${settings.fontSize}pt`,
	};

	return (
		<div className="min-h-full">
			<div
				className="bg-white text-black shadow-sm mx-auto"
				style={{
					fontFamily: settings.fontFamily,
					fontSize: `${settings.fontSize}pt`,
					maxWidth: "8.5in",
					minHeight: "11in",
					padding: `${settings.margins}in`,
				}}
			>
				{sectionOrder.map((section) => (
					<div key={section.key} className="mb-5">
						<h2
							className="text-xs font-bold uppercase tracking-widest pb-1 mb-3"
							style={{
								borderBottom: `1px solid ${settings.accentColor}40`,
								color: settings.accentColor,
								fontFamily: settings.fontFamily,
							}}
						>
							{section.label}
						</h2>
						{section.render()}
					</div>
				))}
			</div>
		</div>
	);
}
