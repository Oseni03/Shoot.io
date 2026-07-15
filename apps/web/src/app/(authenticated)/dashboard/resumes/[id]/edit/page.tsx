"use client";

import { useParams } from "next/navigation";
import { ResumeEditor } from "@/components/resumes/resume-editor";

export default function EditResumePage() {
	const params = useParams();
	const id = typeof params.id === "string" ? params.id : null;

	return <ResumeEditor resumeId={id} />;
}
