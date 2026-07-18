import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import contentScript from "../entrypoints/content";

let originalOpen: typeof window.open;

function getSendMessage() {
	return globalThis.chrome.runtime.sendMessage as ReturnType<typeof vi.fn>;
}

function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

function createModal(
	actionButtonText = "Continue",
	withJd = false,
): HTMLDivElement {
	const modal = document.createElement("div");
	modal.setAttribute("role", "dialog");

	if (withJd) {
		const jd = document.createElement("div");
		jd.id = "jobDescriptionText";
		jd.textContent = "We are looking for a skilled developer...";
		modal.appendChild(jd);
	}

	const actionBtn = document.createElement("button");
	actionBtn.textContent = actionButtonText;
	modal.appendChild(actionBtn);

	return modal;
}

function createFormField(
	tag: "input" | "select" | "textarea",
	attrs: Record<string, string>,
): HTMLElement {
	const el = document.createElement(tag);
	for (const [k, v] of Object.entries(attrs)) {
		el.setAttribute(k, v);
	}
	return el;
}

beforeEach(() => {
	document.body.innerHTML = "";
	originalOpen = window.open;
	window.open = vi.fn();

	getSendMessage().mockReset();
	getSendMessage().mockResolvedValue({
		success: true,
		data: [{ id: "r1", is_master: true }],
	});
});

afterEach(() => {
	document.body.innerHTML = "";
	window.open = originalOpen;
});

describe("content script", () => {
	it("registers as a content script scoped to Indeed only", () => {
		expect(contentScript.matches).toEqual(["*://*.indeed.com/*"]);
	});

	it("injects Shoot button inside modal next to action button", async () => {
		const modal = createModal("Continue");
		document.body.appendChild(modal);

		contentScript.main();
		await flushMicrotasks();

		const shootButton = document.querySelector("#shoot-button");
		expect(shootButton).not.toBeNull();
		expect(shootButton?.textContent).toBe("Shoot");
		expect(shootButton?.parentElement).toBe(modal);
	});

	it("does not inject Shoot button when no modal is present", async () => {
		contentScript.main();
		await flushMicrotasks();

		expect(document.querySelector("#shoot-button")).toBeNull();
	});

	it("injects Shoot button when modal appears dynamically", async () => {
		contentScript.main();
		await flushMicrotasks();

		expect(document.querySelector("#shoot-button")).toBeNull();

		const modal = createModal("Continue");
		document.body.appendChild(modal);
		await flushMicrotasks();

		const shootButton = document.querySelector("#shoot-button");
		expect(shootButton).not.toBeNull();
	});

	it("does not inject a second Shoot button when modal changes", async () => {
		const modal = createModal("Continue");
		document.body.appendChild(modal);

		contentScript.main();
		await flushMicrotasks();

		const span = document.createElement("span");
		modal.appendChild(span);
		await flushMicrotasks();

		expect(modal.querySelectorAll("#shoot-button").length).toBe(1);
	});

	it("injects disabled button with tooltip when user has no master resume", async () => {
		getSendMessage().mockResolvedValue({
			success: true,
			data: [{ id: "r1", is_master: false }],
		});

		const modal = createModal("Continue");
		document.body.appendChild(modal);

		contentScript.main();
		await flushMicrotasks();

		const shootButton = document.querySelector(
			"#shoot-button",
		) as HTMLButtonElement;
		expect(shootButton).not.toBeNull();
		expect(shootButton.disabled).toBe(true);
		expect(shootButton.title).toBe("Set up your master resume first");
	});

	it("sends REFRESH on UNAUTHORIZED before retrying master resume check", async () => {
		getSendMessage()
			.mockResolvedValueOnce({
				success: false,
				error: "Not authenticated",
				code: "UNAUTHORIZED",
			})
			.mockResolvedValueOnce({ success: true, data: null })
			.mockResolvedValueOnce({
				success: true,
				data: [{ id: "r1", is_master: true }],
			});

		const modal = createModal("Continue");
		document.body.appendChild(modal);

		contentScript.main();
		await flushMicrotasks();

		const shootButton = document.querySelector(
			"#shoot-button",
		) as HTMLButtonElement;
		expect(shootButton).not.toBeNull();
		expect(shootButton.disabled).toBe(false);

		const refreshCall = getSendMessage().mock.calls.find(
			(c: unknown[]) => (c[0] as { type: string }).type === "REFRESH",
		);
		expect(refreshCall).toBeDefined();
	});

	it("scrapes job description from modal DOM", async () => {
		const modal = createModal("Continue", true);
		document.body.appendChild(modal);

		getSendMessage()
			.mockResolvedValueOnce({
				success: true,
				data: [{ id: "r1", is_master: true }],
			})
			.mockResolvedValueOnce({
				success: true,
				data: {
					tailored_resume_id: "tr_123",
					auto_fill_fields: {},
				},
			});

		contentScript.main();
		await flushMicrotasks();

		const shootButton = document.querySelector(
			"#shoot-button",
		) as HTMLButtonElement;
		expect(shootButton).not.toBeNull();

		shootButton.click();
		await flushMicrotasks();

		const shootCall = getSendMessage().mock.calls.find(
			(c: unknown[]) => (c[0] as { type: string }).type === "SHOOT_JOB",
		);
		expect(shootCall).toBeDefined();
		const payload = (shootCall[0] as { payload: Record<string, unknown> })
			.payload;
		expect(payload.jobDescriptionText).toContain("skilled developer");
	});

	it("shows error toast when JD cannot be scraped", async () => {
		const modal = createModal("Continue", false);
		document.body.appendChild(modal);

		contentScript.main();
		await flushMicrotasks();

		const shootButton = document.querySelector(
			"#shoot-button",
		) as HTMLButtonElement;

		shootButton.click();
		await flushMicrotasks();

		const toast = document.querySelector("#shoot-toast");
		expect(toast).not.toBeNull();
		expect(toast?.textContent).toBe(
			"Could not read job description. Try refreshing.",
		);
	});

	it("fills form fields on successful shoot response", async () => {
		const modal = createModal("Continue", true);
		const nameInput = createFormField("input", {
			name: "applicant.name",
		}) as HTMLInputElement;
		modal.appendChild(nameInput);
		document.body.appendChild(modal);

		getSendMessage()
			.mockResolvedValueOnce({
				success: true,
				data: [{ id: "r1", is_master: true }],
			})
			.mockResolvedValueOnce({
				success: true,
				data: {
					tailored_resume_id: "tr_123",
					auto_fill_fields: { name: "John Doe" },
				},
			});

		contentScript.main();
		await flushMicrotasks();

		const shootButton = document.querySelector(
			"#shoot-button",
		) as HTMLButtonElement;

		const inputSpy = vi.fn();
		const changeSpy = vi.fn();
		nameInput.addEventListener("input", inputSpy);
		nameInput.addEventListener("change", changeSpy);

		shootButton.click();
		await flushMicrotasks();

		expect(nameInput.value).toBe("John Doe");
		expect(inputSpy).toHaveBeenCalled();
		expect(changeSpy).toHaveBeenCalled();
	});

	it("shows success toast after successful fill", async () => {
		const modal = createModal("Continue", true);
		const nameInput = createFormField("input", {
			name: "applicant.name",
		}) as HTMLInputElement;
		modal.appendChild(nameInput);
		document.body.appendChild(modal);

		getSendMessage()
			.mockResolvedValueOnce({
				success: true,
				data: [{ id: "r1", is_master: true }],
			})
			.mockResolvedValueOnce({
				success: true,
				data: {
					tailored_resume_id: "tr_123",
					auto_fill_fields: { name: "John Doe" },
				},
			});

		contentScript.main();
		await flushMicrotasks();

		const shootButton = document.querySelector(
			"#shoot-button",
		) as HTMLButtonElement;

		shootButton.click();
		await flushMicrotasks();

		const toast = document.querySelector("#shoot-toast");
		expect(toast).not.toBeNull();
		expect(toast?.textContent).toBe("Resume tailored! Review and submit.");
	});

	it("shows partial success toast when some fields remain unfilled", async () => {
		getSendMessage()
			.mockResolvedValueOnce({
				success: true,
				data: [{ id: "r1", is_master: true }],
			})
			.mockResolvedValueOnce({
				success: true,
				data: {
					tailored_resume_id: "tr_123",
					auto_fill_fields: {
						name: "John Doe",
						email: "john@test.com",
						phone: "555-0100",
					},
				},
			});

		const modal = createModal("Continue", true);
		const nameInput = createFormField("input", {
			name: "applicant.name",
		}) as HTMLInputElement;
		modal.appendChild(nameInput);
		document.body.appendChild(modal);

		contentScript.main();
		await flushMicrotasks();

		const shootButton = document.querySelector(
			"#shoot-button",
		) as HTMLButtonElement;

		shootButton.click();
		await flushMicrotasks();

		const toast = document.querySelector("#shoot-toast");
		expect(toast).not.toBeNull();
		expect(toast?.textContent).toBe(
			"Resume tailored! Some fields couldn't be auto-filled.",
		);
	});

	it("shows error toast on shoot failure and restores button", async () => {
		getSendMessage()
			.mockResolvedValueOnce({
				success: true,
				data: [{ id: "r1", is_master: true }],
			})
			.mockResolvedValueOnce({
				success: false,
				error: "Your plan allows 3 shots per month. Upgrade to PRO.",
			});

		const modal = createModal("Continue", true);
		document.body.appendChild(modal);

		contentScript.main();
		await flushMicrotasks();

		const shootButton = document.querySelector(
			"#shoot-button",
		) as HTMLButtonElement;

		shootButton.click();
		await flushMicrotasks();

		const toast = document.querySelector("#shoot-toast");
		expect(toast).not.toBeNull();
		expect(toast?.textContent).toContain("Upgrade to PRO");
		expect(shootButton.textContent).toBe("Shoot");
		expect(shootButton.disabled).toBe(false);
	});

	it("opens popup on UNAUTHORIZED and falls back to login tab on failure", async () => {
		getSendMessage()
			.mockResolvedValueOnce({
				success: true,
				data: [{ id: "r1", is_master: true }],
			})
			.mockResolvedValueOnce({
				success: false,
				error: "Not authenticated",
				code: "UNAUTHORIZED",
			})
			.mockResolvedValueOnce({
				success: false,
				error: "Failed to open popup",
			});

		const modal = createModal("Continue", true);
		document.body.appendChild(modal);

		contentScript.main();
		await flushMicrotasks();

		const shootButton = document.querySelector(
			"#shoot-button",
		) as HTMLButtonElement;

		shootButton.click();
		await flushMicrotasks();

		const toast = document.querySelector("#shoot-toast");
		expect(toast).not.toBeNull();
		expect(toast?.textContent).toBe("Please sign in to use Shoot.");

		const openPopupCall = getSendMessage().mock.calls.find(
			(c: unknown[]) => (c[0] as { type: string }).type === "OPEN_POPUP",
		);
		expect(openPopupCall).toBeDefined();

		await flushMicrotasks();

		expect(window.open).toHaveBeenCalledWith(
			expect.stringContaining("/auth/login"),
			"_blank",
		);
	});

	it("does not autofill an unnamed/unlabeled input", async () => {
		const modal = createModal("Continue", true);

		const unnamedInput = createFormField("input", {
			name: "",
		}) as HTMLInputElement;
		modal.appendChild(unnamedInput);

		const nameInput = createFormField("input", {
			name: "applicant.name",
		}) as HTMLInputElement;
		modal.appendChild(nameInput);

		document.body.appendChild(modal);

		getSendMessage()
			.mockResolvedValueOnce({
				success: true,
				data: [{ id: "r1", is_master: true }],
			})
			.mockResolvedValueOnce({
				success: true,
				data: {
					tailored_resume_id: "tr_123",
					auto_fill_fields: {
						name: "John Doe",
						email: "j@test.com",
						phone: "555-0100",
					},
				},
			});

		contentScript.main();
		await flushMicrotasks();

		const shootButton = document.querySelector(
			"#shoot-button",
		) as HTMLButtonElement;

		shootButton.click();
		await flushMicrotasks();

		expect(nameInput.value).toBe("John Doe");
		expect(unnamedInput.value).toBe("");
	});

	it("skips file inputs when filling form fields", async () => {
		const modal = createModal("Continue", true);

		const nameInput = createFormField("input", {
			name: "applicant.name",
		}) as HTMLInputElement;
		modal.appendChild(nameInput);

		const fileInput = createFormField("input", {
			type: "file",
			name: "resume",
		}) as HTMLInputElement;
		modal.appendChild(fileInput);

		document.body.appendChild(modal);

		getSendMessage()
			.mockResolvedValueOnce({
				success: true,
				data: [{ id: "r1", is_master: true }],
			})
			.mockResolvedValueOnce({
				success: true,
				data: {
					tailored_resume_id: "tr_123",
					auto_fill_fields: {
						name: "John Doe",
						resume: "should-be-skipped",
					},
				},
			});

		contentScript.main();
		await flushMicrotasks();

		const shootButton = document.querySelector(
			"#shoot-button",
		) as HTMLButtonElement;

		shootButton.click();
		await flushMicrotasks();

		expect(nameInput.value).toBe("John Doe");
		expect(fileInput.value).toBe("");
	});
});
