"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useCreateResume, useResume, useSetMasterResume, useUpdateResume } from "@/hooks/useResumes";
import { extractApiErrorMessage } from "@/lib/error";
import type {
	CertificationFormData,
	EducationFormData,
	ExperienceFormData,
	ProjectFormData,
	ResumeSettingsData,
	ResumeResponse,
	SkillFormData,
	SummaryFormData,
} from "@/schemas";

const DEFAULT_TITLE = "Untitled Resume";

export interface ResumeEditorState {
	resumeId: string | null;
	title: string;
	isMaster: boolean;
	summary: SummaryFormData;
	experiences: ExperienceFormData[];
	educations: EducationFormData[];
	skills: SkillFormData[];
	projects: ProjectFormData[];
	certifications: CertificationFormData[];
	settings: ResumeSettingsData;
}

function createEmptyState(): ResumeEditorState {
	return {
		resumeId: null,
		title: DEFAULT_TITLE,
		isMaster: false,
		summary: { content: "" },
		experiences: [],
		educations: [],
		skills: [],
		projects: [],
		certifications: [],
		settings: {
			template: "default",
			fontFamily: "Inter",
			fontSize: 11,
			accentColor: "#4f46e5",
			sectionOrder: [
				"summary",
				"experience",
				"education",
				"skills",
				"projects",
				"certifications",
			],
			margins: 0.75,
		},
	};
}

function resumeToEditorState(resume: ResumeResponse): ResumeEditorState {
	return {
		resumeId: resume.id,
		title: resume.title,
		isMaster: resume.is_master,
		summary: { content: resume.summary?.content ?? "" },
		experiences: (resume.experiences ?? []).map((e) => ({
			_id: e.id,
			id: e.id,
			company: e.company,
			title: e.title,
			location: e.location ?? "",
			startDate: e.start_date ?? "",
			endDate: e.end_date ?? "",
			isCurrent: e.is_current,
			bullets: e.bullets.length > 0 ? e.bullets : [""],
		})),
		educations: (resume.educations ?? []).map((e) => ({
			_id: e.id,
			id: e.id,
			school: e.school,
			degree: e.degree ?? "",
			field: e.field ?? "",
			startDate: e.start_date ?? "",
			endDate: e.end_date ?? "",
			gpa: e.gpa,
		})),
		skills: (resume.skills ?? []).map((s) => ({
			_id: s.id,
			id: s.id,
			name: s.name,
			proficiency: s.proficiency,
		})),
		projects: (resume.projects ?? []).map((p) => ({
			_id: p.id,
			id: p.id,
			name: p.name,
			description: p.description ?? "",
			url: p.url ?? "",
			technologies: p.technologies.length > 0 ? p.technologies : [""],
		})),
		certifications: (resume.certifications ?? []).map((c) => ({
			_id: c.id,
			id: c.id,
			name: c.name,
			issuer: c.issuer ?? "",
			earnedDate: c.earned_date ?? "",
			url: c.url ?? "",
		})),
		settings: {
			template: "default",
			fontFamily: "Inter",
			fontSize: 11,
			accentColor: "#4f46e5",
			sectionOrder: [
				"summary",
				"experience",
				"education",
				"skills",
				"projects",
				"certifications",
			],
			margins: 0.75,
		},
	};
}

function editorStateToPayload(state: ResumeEditorState): Record<string, unknown> {
	const payload: Record<string, unknown> = {
		title: state.title,
		is_master: state.isMaster,
	};

	if (state.summary.content) {
		payload.summary = { content: state.summary.content };
	} else {
		payload.summary = null;
	}

	payload.experiences = state.experiences
		.filter((e) => e.company || e.title)
		.map((e) => ({
			id: e.id || undefined,
			company: e.company,
			title: e.title,
			location: e.location || null,
			start_date: e.startDate || null,
			end_date: e.endDate || null,
			is_current: e.isCurrent,
			bullets: e.bullets.filter((b) => b.trim()),
			sort_order: 0,
		}));

	payload.educations = state.educations
		.filter((e) => e.school)
		.map((e) => ({
			id: e.id || undefined,
			school: e.school,
			degree: e.degree || null,
			field: e.field || null,
			start_date: e.startDate || null,
			end_date: e.endDate || null,
			gpa: e.gpa ?? null,
			sort_order: 0,
		}));

	payload.skills = state.skills
		.filter((s) => s.name)
		.map((s) => ({
			id: s.id || undefined,
			name: s.name,
			proficiency: s.proficiency ?? null,
			sort_order: 0,
		}));

	payload.projects = state.projects
		.filter((p) => p.name)
		.map((p) => ({
			id: p.id || undefined,
			name: p.name,
			description: p.description || null,
			url: p.url || null,
			technologies: p.technologies.filter((t) => t.trim()),
			sort_order: 0,
		}));

	payload.certifications = state.certifications
		.filter((c) => c.name)
		.map((c) => ({
			id: c.id || undefined,
			name: c.name,
			issuer: c.issuer || null,
			earned_date: c.earnedDate || null,
			url: c.url || null,
			sort_order: 0,
		}));

	return payload;
}

export function useResumeEditor(resumeId: string | null) {
	const { data: fetchedResume, isLoading, isError } = useResume(resumeId ?? undefined);
	const updateResume = useUpdateResume();
	const createResume = useCreateResume();
	const setMasterResume = useSetMasterResume();

	const [state, setState] = useState<ResumeEditorState>(createEmptyState);
	const [dirty, setDirty] = useState(false);
	const [saving, setSaving] = useState(false);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isLoaded = useRef(false);

	useEffect(() => {
		if (fetchedResume && !isLoaded.current) {
			setState(resumeToEditorState(fetchedResume));
			setDirty(false);
			setLastSaved(new Date());
			isLoaded.current = true;
		}
		if (!resumeId && !isLoaded.current) {
			isLoaded.current = true;
		}
	}, [fetchedResume, resumeId]);

	const save = useCallback(
		async (s?: ResumeEditorState) => {
			const current = s ?? state;
			const payload = editorStateToPayload(current);

			setSaving(true);
			try {
				if (current.resumeId) {
					const updated = await updateResume.mutateAsync({
						id: current.resumeId,
						data: payload,
					});
					setState((prev) => ({
						...prev,
						resumeId: updated.id,
					}));
				} else {
					const created = await createResume.mutateAsync(payload);
					setState((prev) => ({
						...prev,
						resumeId: created.id,
					}));
				}
				setDirty(false);
				setLastSaved(new Date());
			} catch (err) {
				toast.error(extractApiErrorMessage(err, "Failed to save resume"));
			} finally {
				setSaving(false);
			}
		},
		[state, updateResume, createResume],
	);

	const debouncedSave = useCallback(
		(newState: ResumeEditorState) => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				save(newState);
			}, 1500);
		},
		[save],
	);

	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	function updateState(updater: Partial<ResumeEditorState> | ((prev: ResumeEditorState) => ResumeEditorState)) {
		setState((prev) => {
			const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
			setDirty(true);
			debouncedSave(next);
			return next;
		});
	}

	function setTitle(title: string) {
		updateState({ title });
	}

	function setSummary(content: string) {
		updateState((prev) => ({ ...prev, summary: { content } }));
	}

	function addExperience() {
		updateState((prev) => ({
			...prev,
			experiences: [
				...prev.experiences,
				{
					_id: crypto.randomUUID(),
					company: "",
					title: "",
					location: "",
					startDate: "",
					endDate: "",
					isCurrent: false,
					bullets: [""],
				},
			],
		}));
	}

	function updateExperience(index: number, data: ExperienceFormData) {
		updateState((prev) => {
			const experiences = [...prev.experiences];
			experiences[index] = data;
			return { ...prev, experiences };
		});
	}

	function removeExperience(index: number) {
		updateState((prev) => ({
			...prev,
			experiences: prev.experiences.filter((_, i) => i !== index),
		}));
	}

	function reorderExperience(fromIndex: number, toIndex: number) {
		updateState((prev) => {
			const experiences = [...prev.experiences];
			const [removed] = experiences.splice(fromIndex, 1);
			experiences.splice(toIndex, 0, removed);
			return { ...prev, experiences };
		});
	}

	function addEducation() {
		updateState((prev) => ({
			...prev,
			educations: [
				...prev.educations,
				{
					_id: crypto.randomUUID(),
					school: "",
					degree: "",
					field: "",
					startDate: "",
					endDate: "",
					gpa: null,
				},
			],
		}));
	}

	function updateEducation(index: number, data: EducationFormData) {
		updateState((prev) => {
			const educations = [...prev.educations];
			educations[index] = data;
			return { ...prev, educations };
		});
	}

	function removeEducation(index: number) {
		updateState((prev) => ({
			...prev,
			educations: prev.educations.filter((_, i) => i !== index),
		}));
	}

	function addSkill() {
		updateState((prev) => ({
			...prev,
			skills: [
				...prev.skills,
				{ _id: crypto.randomUUID(), name: "", proficiency: 3 },
			],
		}));
	}

	function updateSkill(index: number, data: SkillFormData) {
		updateState((prev) => {
			const skills = [...prev.skills];
			skills[index] = data;
			return { ...prev, skills };
		});
	}

	function removeSkill(index: number) {
		updateState((prev) => ({
			...prev,
			skills: prev.skills.filter((_, i) => i !== index),
		}));
	}

	function addProject() {
		updateState((prev) => ({
			...prev,
			projects: [
				...prev.projects,
				{
					_id: crypto.randomUUID(),
					name: "",
					description: "",
					url: "",
					technologies: [""],
				},
			],
		}));
	}

	function updateProject(index: number, data: ProjectFormData) {
		updateState((prev) => {
			const projects = [...prev.projects];
			projects[index] = data;
			return { ...prev, projects };
		});
	}

	function removeProject(index: number) {
		updateState((prev) => ({
			...prev,
			projects: prev.projects.filter((_, i) => i !== index),
		}));
	}

	function addCertification() {
		updateState((prev) => ({
			...prev,
			certifications: [
				...prev.certifications,
				{
					_id: crypto.randomUUID(),
					name: "",
					issuer: "",
					earnedDate: "",
					url: "",
				},
			],
		}));
	}

	function updateCertification(index: number, data: CertificationFormData) {
		updateState((prev) => {
			const certifications = [...prev.certifications];
			certifications[index] = data;
			return { ...prev, certifications };
		});
	}

	function removeCertification(index: number) {
		updateState((prev) => ({
			...prev,
			certifications: prev.certifications.filter((_, i) => i !== index),
		}));
	}

	async function toggleMaster() {
		if (!state.resumeId) return;
		try {
			await setMasterResume.mutateAsync(state.resumeId);
			setState((prev) => ({ ...prev, isMaster: !prev.isMaster }));
			toast.success("Master resume updated");
		} catch (err) {
			toast.error(extractApiErrorMessage(err, "Failed to set master resume"));
		}
	}

	function saveNow() {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		save();
	}

	return {
		state,
		isLoading,
		isError,
		dirty,
		saving,
		lastSaved,
		updateState,
		setTitle,
		setSummary,
		experiences: {
			items: state.experiences,
			add: addExperience,
			update: updateExperience,
			remove: removeExperience,
			reorder: reorderExperience,
		},
		educations: {
			items: state.educations,
			add: addEducation,
			update: updateEducation,
			remove: removeEducation,
		},
		skills: {
			items: state.skills,
			add: addSkill,
			update: updateSkill,
			remove: removeSkill,
		},
		projects: {
			items: state.projects,
			add: addProject,
			update: updateProject,
			remove: removeProject,
		},
		certifications: {
			items: state.certifications,
			add: addCertification,
			update: updateCertification,
			remove: removeCertification,
		},
		isMaster: state.isMaster,
		toggleMaster,
		saveNow,
	};
}
