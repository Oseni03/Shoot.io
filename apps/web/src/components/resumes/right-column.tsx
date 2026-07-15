"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { ResumeSettingsData } from "@/schemas";

const TEMPLATES = [
	{ id: "default", name: "Classic", color: "#4f46e5" },
	{ id: "modern", name: "Modern", color: "#0891b2" },
	{ id: "minimal", name: "Minimal", color: "#18181b" },
	{ id: "elegant", name: "Elegant", color: "#7c3aed" },
];

const FONT_FAMILIES = [
	"Inter",
	"Manrope",
	"Georgia",
	"Times New Roman",
	"Arial",
	"Helvetica",
	"Calibri",
];

interface RightColumnProps {
	settings: ResumeSettingsData;
	onChange: (settings: ResumeSettingsData) => void;
}

export function RightColumn({ settings, onChange }: RightColumnProps) {
	function update(partial: Partial<ResumeSettingsData>) {
		onChange({ ...settings, ...partial });
	}

	return (
		<div className="space-y-6 pb-8">
			<div>
				<h3 className="text-[11px] font-mono uppercase tracking-widest text-foreground/60 font-bold mb-4">
					Template
				</h3>
				<div className="grid grid-cols-2 gap-2">
					{TEMPLATES.map((t) => (
						<button
							key={t.id}
							type="button"
							onClick={() => update({ template: t.id, accentColor: t.color })}
							className={[
								"relative aspect-[3/4] rounded-lg border-2 transition-all overflow-hidden",
								settings.template === t.id
									? "border-primary ring-1 ring-primary"
									: "border-border hover:border-foreground/20",
							].join(" ")}
						>
							<div className="absolute inset-0 bg-muted p-2 flex flex-col gap-1">
								<div className="h-1.5 w-3/4 rounded bg-foreground/20" />
								<div className="h-1 w-1/2 rounded bg-foreground/10" />
								<div className="mt-auto space-y-1">
									<div className="h-1 w-full rounded bg-foreground/15" />
									<div className="h-1 w-full rounded bg-foreground/15" />
									<div className="h-1 w-3/4 rounded bg-foreground/10" />
								</div>
							</div>
							<div className="absolute bottom-1 left-1 right-1">
								<span
									className="text-[8px] font-mono font-semibold px-1 py-0.5 rounded"
									style={{
										backgroundColor: `${t.color}20`,
										color: t.color,
									}}
								>
									{t.name}
								</span>
							</div>
						</button>
					))}
				</div>
			</div>

			<div>
				<h3 className="text-[11px] font-mono uppercase tracking-widest text-foreground/60 font-bold mb-3">
					Typography
				</h3>
				<div className="space-y-3">
					<div>
						<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
							Font
						</Label>
						<select
							value={settings.fontFamily}
							onChange={(e) => update({ fontFamily: e.target.value })}
							className="mt-1 flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							{FONT_FAMILIES.map((f) => (
								<option key={f} value={f}>
									{f}
								</option>
							))}
						</select>
					</div>

					<div>
						<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
							Font Size ({settings.fontSize}pt)
						</Label>
						<Slider
							value={[settings.fontSize]}
							onValueChange={([v]) => update({ fontSize: v })}
							min={8}
							max={14}
							step={0.5}
							className="mt-2"
						/>
					</div>
				</div>
			</div>

			<div>
				<h3 className="text-[11px] font-mono uppercase tracking-widest text-foreground/60 font-bold mb-3">
					Colors
				</h3>
				<div>
					<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
						Accent Color
					</Label>
					<div className="flex items-center gap-2 mt-1">
						<Input
							type="color"
							value={settings.accentColor}
							onChange={(e) => update({ accentColor: e.target.value })}
							className="size-8 p-0.5 border rounded cursor-pointer flex-shrink-0"
						/>
						<Input
							value={settings.accentColor}
							onChange={(e) => update({ accentColor: e.target.value })}
							className="h-8 text-xs font-mono"
						/>
					</div>
				</div>
			</div>

			<div>
				<h3 className="text-[11px] font-mono uppercase tracking-widest text-foreground/60 font-bold mb-3">
					Layout
				</h3>
				<div>
					<Label className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
						Margins ({settings.margins.toFixed(2)}in)
					</Label>
					<Slider
						value={[settings.margins]}
						onValueChange={([v]) => update({ margins: v })}
						min={0.25}
						max={2}
						step={0.25}
						className="mt-2"
					/>
				</div>
			</div>
		</div>
	);
}
