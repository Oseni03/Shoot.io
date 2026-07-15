"use client";

import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
	CertificationFormData,
	EducationFormData,
	ExperienceFormData,
	ProjectFormData,
	SkillFormData,
} from "@/schemas";

interface SectionBase<T> {
	items: T[];
	add: () => void;
	update: (index: number, data: T) => void;
	remove: (index: number) => void;
}

interface CollapsibleSectionProps {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
}

function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div className="border border-border rounded-lg overflow-hidden">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="flex items-center justify-between w-full px-4 py-2.5 bg-muted/50 hover:bg-muted transition-colors text-left"
			>
				<span className="text-[11px] font-mono uppercase tracking-widest text-foreground/60 font-bold">
					{title}
				</span>
				<svg
					className={cn(
						"size-3.5 text-foreground/40 transition-transform",
						open && "rotate-180",
					)}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={2}
				>
					<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
			{open && <div className="p-4 space-y-4">{children}</div>}
		</div>
	);
}

interface SummarySectionProps {
	content: string;
	onChange: (content: string) => void;
}

function SummarySection({ content, onChange }: SummarySectionProps) {
	return (
		<CollapsibleSection title="Summary">
			<Textarea
				value={content}
				onChange={(e) => onChange(e.target.value)}
				placeholder="Write a brief professional summary..."
				className="min-h-[100px] text-sm leading-relaxed"
			/>
		</CollapsibleSection>
	);
}

function BulletEditor({ bullets, onChange }: { bullets: string[]; onChange: (bullets: string[]) => void }) {
	function updateBullet(i: number, val: string) {
		const next = [...bullets];
		next[i] = val;
		onChange(next);
	}

	function addBullet() {
		onChange([...bullets, ""]);
	}

	function removeBullet(i: number) {
		if (bullets.length <= 1) return;
		onChange(bullets.filter((_, idx) => idx !== i));
	}

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 font-semibold">
					Bullets
				</span>
				<button
					type="button"
					onClick={addBullet}
					className="text-[10px] font-mono uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
				>
					+ Add
				</button>
			</div>
			{bullets.map((b, i) => (
				<div key={i} className="flex items-start gap-2">
					<span className="text-xs text-foreground/30 mt-2 select-none">•</span>
					<Input
						value={b}
						onChange={(e) => updateBullet(i, e.target.value)}
						placeholder="Describe an accomplishment..."
						className="text-xs h-8"
					/>
					{bullets.length > 1 && (
						<button
							type="button"
							onClick={() => removeBullet(i)}
							className="text-foreground/30 hover:text-destructive transition-colors mt-1.5"
						>
							<Trash2 className="size-3.5" />
						</button>
					)}
				</div>
			))}
		</div>
	);
}

interface ReorderableCardProps {
	children: React.ReactNode;
	onRemove: () => void;
	index: number;
}

function ReorderableCard({ children, onRemove, index }: ReorderableCardProps) {
	return (
		<div className="relative border border-border rounded-md p-3 space-y-3 bg-card">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5 text-[10px] font-mono text-foreground/30">
					<GripVertical className="size-3.5" />
					<span>#{index + 1}</span>
				</div>
				<button
					type="button"
					onClick={onRemove}
					className="text-foreground/30 hover:text-destructive transition-colors"
				>
					<Trash2 className="size-3.5" />
				</button>
			</div>
			{children}
		</div>
	);
}

function ExperienceForm({
	data,
	onChange,
	onRemove,
	index,
}: {
	data: ExperienceFormData;
	onChange: (d: ExperienceFormData) => void;
	onRemove: () => void;
	index: number;
}) {
	return (
		<ReorderableCard onRemove={onRemove} index={index}>
			<div className="grid grid-cols-2 gap-2">
				<div>
					<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
						Company
					</Label>
					<Input
						value={data.company}
						onChange={(e) => onChange({ ...data, company: e.target.value })}
						placeholder="Company name"
						className="text-xs h-8 mt-1"
					/>
				</div>
				<div>
					<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
						Title
					</Label>
					<Input
						value={data.title}
						onChange={(e) => onChange({ ...data, title: e.target.value })}
						placeholder="Job title"
						className="text-xs h-8 mt-1"
					/>
				</div>
			</div>
			<div>
				<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
					Location
				</Label>
				<Input
					value={data.location}
					onChange={(e) => onChange({ ...data, location: e.target.value })}
					placeholder="City, State"
					className="text-xs h-8 mt-1"
				/>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<div>
					<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
						Start Date
					</Label>
					<Input
						type="month"
						value={data.startDate}
						onChange={(e) => onChange({ ...data, startDate: e.target.value })}
						className="text-xs h-8 mt-1"
					/>
				</div>
				<div>
					<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
						End Date
					</Label>
					<Input
						type="month"
						value={data.endDate}
						onChange={(e) => onChange({ ...data, endDate: e.target.value })}
						disabled={data.isCurrent}
						className="text-xs h-8 mt-1"
					/>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Checkbox
					id={`current-${data._id ?? index}`}
					checked={data.isCurrent}
					onCheckedChange={(checked) =>
						onChange({ ...data, isCurrent: checked === true, endDate: checked ? "" : data.endDate })
					}
				/>
				<Label
					htmlFor={`current-${data._id ?? index}`}
					className="text-[10px] font-mono uppercase tracking-widest text-foreground/50 cursor-pointer"
				>
					I currently work here
				</Label>
			</div>
			<BulletEditor
				bullets={data.bullets}
				onChange={(bullets) => onChange({ ...data, bullets })}
			/>
		</ReorderableCard>
	);
}

function EducationForm({
	data,
	onChange,
	onRemove,
	index,
}: {
	data: EducationFormData;
	onChange: (d: EducationFormData) => void;
	onRemove: () => void;
	index: number;
}) {
	return (
		<ReorderableCard onRemove={onRemove} index={index}>
			<div>
				<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
					School
				</Label>
				<Input
					value={data.school}
					onChange={(e) => onChange({ ...data, school: e.target.value })}
					placeholder="University name"
					className="text-xs h-8 mt-1"
				/>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<div>
					<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
						Degree
					</Label>
					<Input
						value={data.degree}
						onChange={(e) => onChange({ ...data, degree: e.target.value })}
						placeholder="Bachelor's, Master's..."
						className="text-xs h-8 mt-1"
					/>
				</div>
				<div>
					<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
						Field
					</Label>
					<Input
						value={data.field}
						onChange={(e) => onChange({ ...data, field: e.target.value })}
						placeholder="Computer Science"
						className="text-xs h-8 mt-1"
					/>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<div>
					<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
						Start Date
					</Label>
					<Input
						type="month"
						value={data.startDate}
						onChange={(e) => onChange({ ...data, startDate: e.target.value })}
						className="text-xs h-8 mt-1"
					/>
				</div>
				<div>
					<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
						End Date
					</Label>
					<Input
						type="month"
						value={data.endDate}
						onChange={(e) => onChange({ ...data, endDate: e.target.value })}
						className="text-xs h-8 mt-1"
					/>
				</div>
			</div>
			<div>
				<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
					GPA
				</Label>
				<Input
					type="number"
					step="0.01"
					min="0"
					max="4"
					value={data.gpa ?? ""}
					onChange={(e) =>
						onChange({
							...data,
							gpa: e.target.value ? Number.parseFloat(e.target.value) : null,
						})
					}
					placeholder="3.8"
					className="text-xs h-8 mt-1"
				/>
			</div>
		</ReorderableCard>
	);
}

function SkillForm({
	data,
	onChange,
	onRemove,
	index,
}: {
	data: SkillFormData;
	onChange: (d: SkillFormData) => void;
	onRemove: () => void;
	index: number;
}) {
	return (
		<ReorderableCard onRemove={onRemove} index={index}>
			<div>
				<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
					Skill
				</Label>
				<Input
					value={data.name}
					onChange={(e) => onChange({ ...data, name: e.target.value })}
					placeholder="JavaScript, Python, Figma..."
					className="text-xs h-8 mt-1"
				/>
			</div>
			<div>
				<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
					Proficiency ({data.proficiency ?? 3}/5)
				</Label>
				<Slider
					value={[data.proficiency ?? 3]}
					onValueChange={([v]) => onChange({ ...data, proficiency: v })}
					min={1}
					max={5}
					step={1}
					className="mt-2"
				/>
				<div className="flex justify-between text-[9px] font-mono text-foreground/30 mt-1">
					<span>Beginner</span>
					<span>Expert</span>
				</div>
			</div>
		</ReorderableCard>
	);
}

function ProjectForm({
	data,
	onChange,
	onRemove,
	index,
}: {
	data: ProjectFormData;
	onChange: (d: ProjectFormData) => void;
	onRemove: () => void;
	index: number;
}) {
	return (
		<ReorderableCard onRemove={onRemove} index={index}>
			<div>
				<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
					Project Name
				</Label>
				<Input
					value={data.name}
					onChange={(e) => onChange({ ...data, name: e.target.value })}
					placeholder="Project name"
					className="text-xs h-8 mt-1"
				/>
			</div>
			<div>
				<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
					Description
				</Label>
				<Textarea
					value={data.description}
					onChange={(e) => onChange({ ...data, description: e.target.value })}
					placeholder="Brief description of the project..."
					className="text-xs min-h-[60px] mt-1"
				/>
			</div>
			<div>
				<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
					URL
				</Label>
				<Input
					value={data.url}
					onChange={(e) => onChange({ ...data, url: e.target.value })}
					placeholder="https://github.com/..."
					className="text-xs h-8 mt-1"
				/>
			</div>
			<div>
				<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
					Technologies
				</Label>
				<BulletEditor
					bullets={data.technologies}
					onChange={(technologies) => onChange({ ...data, technologies })}
				/>
			</div>
		</ReorderableCard>
	);
}

function CertificationForm({
	data,
	onChange,
	onRemove,
	index,
}: {
	data: CertificationFormData;
	onChange: (d: CertificationFormData) => void;
	onRemove: () => void;
	index: number;
}) {
	return (
		<ReorderableCard onRemove={onRemove} index={index}>
			<div>
				<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
					Certification Name
				</Label>
				<Input
					value={data.name}
					onChange={(e) => onChange({ ...data, name: e.target.value })}
					placeholder="AWS Solutions Architect..."
					className="text-xs h-8 mt-1"
				/>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<div>
					<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
						Issuer
					</Label>
					<Input
						value={data.issuer}
						onChange={(e) => onChange({ ...data, issuer: e.target.value })}
						placeholder="Amazon Web Services"
						className="text-xs h-8 mt-1"
					/>
				</div>
				<div>
					<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
						Date Earned
					</Label>
					<Input
						type="month"
						value={data.earnedDate}
						onChange={(e) => onChange({ ...data, earnedDate: e.target.value })}
						className="text-xs h-8 mt-1"
					/>
				</div>
			</div>
			<div>
				<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
					URL
				</Label>
				<Input
					value={data.url}
					onChange={(e) => onChange({ ...data, url: e.target.value })}
					placeholder="https://credential.example.com/..."
					className="text-xs h-8 mt-1"
				/>
			</div>
		</ReorderableCard>
	);
}

export function LeftColumn({
	summary,
	onSummaryChange,
	experiences,
	educations,
	skills,
	projects,
	certifications,
}: {
	summary: string;
	onSummaryChange: (content: string) => void;
	experiences: SectionBase<ExperienceFormData>;
	educations: SectionBase<EducationFormData>;
	skills: SectionBase<SkillFormData>;
	projects: SectionBase<ProjectFormData>;
	certifications: SectionBase<CertificationFormData>;
}) {
	return (
		<div className="space-y-4 pb-8">
			<SummarySection content={summary} onChange={onSummaryChange} />

			<CollapsibleSection title="Experience">
				{experiences.items.length === 0 && (
					<p className="text-xs text-foreground/40 font-mono text-center py-4">
						No experience entries yet
					</p>
				)}
				<div className="space-y-3">
					{experiences.items.map((exp, i) => (
						<div key={exp._id ?? i}>
							<ExperienceForm
								data={exp}
								onChange={(d) => experiences.update(i, d)}
								onRemove={() => experiences.remove(i)}
								index={i}
							/>
						</div>
					))}
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={experiences.add}
					className="w-full mt-3 text-xs"
				>
					<Plus className="size-3.5 mr-1" />
					Add Experience
				</Button>
			</CollapsibleSection>

			<CollapsibleSection title="Education">
				{educations.items.length === 0 && (
					<p className="text-xs text-foreground/40 font-mono text-center py-4">
						No education entries yet
					</p>
				)}
				<div className="space-y-3">
					{educations.items.map((edu, i) => (
						<div key={edu._id ?? i}>
							<EducationForm
								data={edu}
								onChange={(d) => educations.update(i, d)}
								onRemove={() => educations.remove(i)}
								index={i}
							/>
						</div>
					))}
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={educations.add}
					className="w-full mt-3 text-xs"
				>
					<Plus className="size-3.5 mr-1" />
					Add Education
				</Button>
			</CollapsibleSection>

			<CollapsibleSection title="Skills">
				{skills.items.length === 0 && (
					<p className="text-xs text-foreground/40 font-mono text-center py-4">
						No skills added yet
					</p>
				)}
				<div className="space-y-3">
					{skills.items.map((skill, i) => (
						<div key={skill._id ?? i}>
							<SkillForm
								data={skill}
								onChange={(d) => skills.update(i, d)}
								onRemove={() => skills.remove(i)}
								index={i}
							/>
						</div>
					))}
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={skills.add}
					className="w-full mt-3 text-xs"
				>
					<Plus className="size-3.5 mr-1" />
					Add Skill
				</Button>
			</CollapsibleSection>

			<CollapsibleSection title="Projects">
				{projects.items.length === 0 && (
					<p className="text-xs text-foreground/40 font-mono text-center py-4">
						No projects added yet
					</p>
				)}
				<div className="space-y-3">
					{projects.items.map((proj, i) => (
						<div key={proj._id ?? i}>
							<ProjectForm
								data={proj}
								onChange={(d) => projects.update(i, d)}
								onRemove={() => projects.remove(i)}
								index={i}
							/>
						</div>
					))}
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={projects.add}
					className="w-full mt-3 text-xs"
				>
					<Plus className="size-3.5 mr-1" />
					Add Project
				</Button>
			</CollapsibleSection>

			<CollapsibleSection title="Certifications">
				{certifications.items.length === 0 && (
					<p className="text-xs text-foreground/40 font-mono text-center py-4">
						No certifications added yet
					</p>
				)}
				<div className="space-y-3">
					{certifications.items.map((cert, i) => (
						<div key={cert._id ?? i}>
							<CertificationForm
								data={cert}
								onChange={(d) => certifications.update(i, d)}
								onRemove={() => certifications.remove(i)}
								index={i}
							/>
						</div>
					))}
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={certifications.add}
					className="w-full mt-3 text-xs"
				>
					<Plus className="size-3.5 mr-1" />
					Add Certification
				</Button>
			</CollapsibleSection>
		</div>
	);
}
