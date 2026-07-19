import { defineContentScript } from "wxt/utils/define-content-script";
import type { PopupResponse } from "../types";

const FRONTEND_URL =
	(import.meta.env.VITE_FRONTEND_URL as string | undefined) ??
	"http://localhost:3000";

const MODAL_SELECTORS = [
	'[data-testid*="modal"]',
	'[data-testid*="apply"]',
	'[class*="apply-modal"]',
	'[class*="apply--modal"]',
	'[role="dialog"]',
	"#indeedApplyModal",
];

const ACTION_BUTTON_PATTERNS = [
	"continue",
	"submit",
	"next",
	"apply now",
	"send",
];

const JD_SELECTORS = [
	"#jobDescriptionText",
	'[class*="jobsearch-JobComponent-description"]',
	'[data-testid*="job-description"]',
	'[class*="jobsearch-JobInfoHeader"]',
];

const FIELD_MAPPINGS: Record<string, string[]> = {
	name: ["name", "full_name", "fullname", "applicant.name"],
	email: ["email", "e-mail"],
	phone: ["phone", "telephone", "mobile", "phone_number", "applicant.phone"],
	headline: ["headline", "title", "professional_title"],
	summary: [
		"summary",
		"cover_letter",
		"coverletter",
		"why",
		"interest",
		"message",
		"additional_info",
	],
};

let shootInProgress = false;

function findModal(): Element | null {
	for (const selector of MODAL_SELECTORS) {
		const el = document.querySelector(selector);
		if (el) return el;
	}
	return null;
}

function findActionButton(modal: Element): Element | null {
	const buttons = modal.querySelectorAll("button");
	for (const button of buttons) {
		const text = button.textContent?.toLowerCase().trim() ?? "";
		if (ACTION_BUTTON_PATTERNS.some((p) => text.includes(p))) {
			return button;
		}
	}
	return null;
}

function scrapeJobDescription(): string | null {
	const modal = findModal();
	if (modal) {
		for (const selector of JD_SELECTORS) {
			const el = modal.querySelector(selector);
			if (el?.textContent?.trim()) return el.textContent.trim();
		}
	}
	for (const selector of JD_SELECTORS) {
		const el = document.querySelector(selector);
		if (el?.textContent?.trim()) return el.textContent.trim();
	}
	return null;
}

function getSourceUrl(): string {
	return window.location.href;
}

function getJobTitle(): string | undefined {
	const titleEl = document.querySelector(
		'[class*="jobsearch-JobInfoHeader-title"]',
	);
	return titleEl?.textContent?.trim() ?? undefined;
}

function getCompany(): string | undefined {
	const companyEl = document.querySelector(
		'[data-testid="inlineHeader-companyName"]',
	);
	return companyEl?.textContent?.trim() ?? undefined;
}

function fillFormField(
	modal: Element,
	fieldName: string,
	value: string,
): boolean {
	const knownLabels = FIELD_MAPPINGS[fieldName] ?? [
		fieldName.replace(/_/g, " "),
		fieldName,
	];

	const inputs = modal.querySelectorAll(
		'input:not([type="file"]):not([type="hidden"]), select, textarea',
	);
	let matched = false;

	const safeIncludes = (a: string, b: string): boolean => {
		if (!a || !b) return false;
		return a.includes(b);
	};

	for (const input of inputs) {
		const el = input as
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement;

		if (el instanceof HTMLInputElement && el.type === "file") continue;

		const name = el.name?.toLowerCase() ?? "";
		const id = el.id?.toLowerCase() ?? "";
		const ariaLabel = el.getAttribute("aria-label")?.toLowerCase() ?? "";
		const placeholder = el.getAttribute("placeholder")?.toLowerCase() ?? "";

		let labelText = "";
		if (el.id) {
			const label = modal.querySelector(`label[for="${el.id}"]`);
			if (label) labelText = label.textContent?.toLowerCase() ?? "";
		}
		if (!labelText) {
			const parentLabel = el.closest("label");
			if (parentLabel)
				labelText = parentLabel.textContent?.toLowerCase() ?? "";
		}

		const matchFound = knownLabels.some(
			(label) =>
				safeIncludes(name, label) ||
				safeIncludes(id, label) ||
				safeIncludes(ariaLabel, label) ||
				safeIncludes(placeholder, label) ||
				safeIncludes(labelText, label) ||
				safeIncludes(label, name),
		);

		if (!matchFound) continue;

		const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
			window.HTMLInputElement.prototype,
			"value",
		)?.set;
		if (nativeInputValueSetter && el instanceof HTMLInputElement) {
			nativeInputValueSetter.call(el, value);
		} else {
			el.value = value;
		}
		el.dispatchEvent(new Event("input", { bubbles: true }));
		el.dispatchEvent(new Event("change", { bubbles: true }));
		matched = true;
	}

	return matched;
}

function autoFillForm(
	modal: Element,
	fields: Record<string, string>,
): { filled: number; total: number } {
	let filled = 0;
	const total = Object.keys(fields).length;

	for (const [fieldName, value] of Object.entries(fields)) {
		if (fillFormField(modal, fieldName, value)) {
			filled++;
		}
	}

	return { filled, total };
}

function showToast(
	message: string,
	type: "loading" | "success" | "error",
): void {
	const existing = document.querySelector("#shoot-toast");
	if (existing) existing.remove();

	const toast = document.createElement("div");
	toast.id = "shoot-toast";
	toast.textContent = message;

	const bgColor =
		type === "error"
			? "#dc2626"
			: type === "loading"
				? "#2563eb"
				: "#16a34a";

	Object.assign(toast.style, {
		position: "fixed",
		bottom: "24px",
		right: "24px",
		padding: "12px 20px",
		borderRadius: "8px",
		fontSize: "14px",
		fontWeight: "500",
		zIndex: "99999",
		color: "#fff",
		backgroundColor: bgColor,
		boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
		transition: "opacity 0.3s",
	});

	document.body.appendChild(toast);

	if (type !== "loading") {
		setTimeout(() => {
			toast.style.opacity = "0";
			setTimeout(() => toast.remove(), 300);
		}, 4000);
	}
}

async function handleOpenPopup(): Promise<void> {
	let opened = false;

	const popupPromise = chrome.runtime
		.sendMessage({ type: "OPEN_POPUP" })
		.then((response: unknown) => {
			opened = (response as PopupResponse)?.success === true;
		})
		.catch(() => {});

	await Promise.race([
		popupPromise,
		new Promise<void>((resolve) => setTimeout(resolve, 300)),
	]);

	if (!opened) {
		window.open(`${FRONTEND_URL}/auth/login`, "_blank");
	}
}

async function handleShoot(shootButton: HTMLButtonElement): Promise<void> {
	if (shootInProgress) return;

	const jdText = scrapeJobDescription();
	if (!jdText) {
		showToast("Could not read job description. Try refreshing.", "error");
		return;
	}

	shootInProgress = true;
	shootButton.disabled = true;
	shootButton.innerHTML = '<span class="shoot-spinner"></span> Tailoring...';
	showToast("Tailoring your resume...", "loading");

	try {
		const response = await chrome.runtime.sendMessage({
			type: "SHOOT_JOB",
			payload: {
				jobDescriptionText: jdText,
				sourceUrl: getSourceUrl(),
				jobTitle: getJobTitle(),
				company: getCompany(),
			},
		});

		const result = response as PopupResponse;

		if (!result.success) {
			if (result.code === "UNAUTHORIZED") {
				showToast("Please sign in to use Shoot.", "error");
				await handleOpenPopup();
			} else {
				showToast(result.error ?? "Shoot failed. Try again.", "error");
			}
			return;
		}

		const data = result.data as {
			auto_fill_fields: Record<string, string>;
		};
		const autoFillFields = data.auto_fill_fields;

		const modal = findModal();
		if (!modal) {
			showToast("Resume tailored!", "success");
			return;
		}

		const { filled, total } = autoFillForm(modal, autoFillFields);

		if (filled === 0 && total > 0) {
			showToast(
				"Resume tailored! Auto-fill couldn't find fields to fill.",
				"success",
			);
		} else if (filled < total) {
			showToast(
				"Resume tailored! Some fields couldn't be auto-filled.",
				"success",
			);
		} else {
			showToast("Resume tailored! Review and submit.", "success");
		}
	} catch (err: unknown) {
		const msg =
			err instanceof Error
				? err.message
				: "Network error. Check your connection.";
		showToast(msg, "error");
	} finally {
		shootInProgress = false;
		shootButton.disabled = false;
		shootButton.textContent = "Shoot";
	}
}

function injectShootButton(
	modal: Element,
	hasResume: boolean,
): HTMLButtonElement | null {
	if (modal.querySelector("#shoot-button")) return null;

	const actionButton = findActionButton(modal);
	if (!actionButton) return null;

	const parent = actionButton.parentElement;
	if (!parent) return null;

	const button = document.createElement("button");
	button.id = "shoot-button";
	button.textContent = "Shoot";
	Object.assign(button.style, {
		padding: "8px 16px",
		borderRadius: "6px",
		border: "none",
		backgroundColor: "#2557a7",
		color: "#fff",
		fontSize: "14px",
		fontWeight: "700",
		cursor: "pointer",
		marginLeft: "8px",
		lineHeight: "20px",
	});

	if (!hasResume) {
		button.disabled = true;
		button.title = "Set up your master resume first";
		Object.assign(button.style, {
			opacity: "0.5",
			cursor: "not-allowed",
		});
	}

	button.addEventListener("click", () => handleShoot(button));

	if (actionButton.nextSibling) {
		parent.insertBefore(button, actionButton.nextSibling);
	} else {
		parent.appendChild(button);
	}

	return button;
}

function updateShootButtons(hasResume: boolean): void {
	const buttons = document.querySelectorAll(
		"#shoot-button",
	) as NodeListOf<HTMLButtonElement>;
	for (const btn of buttons) {
		if (hasResume) {
			btn.disabled = false;
			btn.title = "";
			btn.style.opacity = "1";
			btn.style.cursor = "pointer";
		} else {
			btn.disabled = true;
			btn.title = "Set up your master resume first";
			btn.style.opacity = "0.5";
			btn.style.cursor = "not-allowed";
		}
	}
}

function hasMasterFromResponse(data: unknown): boolean {
	const resumes = data as Array<{ is_master: boolean }> | null;
	return Array.isArray(resumes) && resumes.some((r) => r.is_master);
}

async function checkHasMasterResume(): Promise<boolean> {
	const response = await chrome.runtime.sendMessage({
		type: "API_REQUEST",
		payload: { path: "/resumes" },
	});

	const result = response as PopupResponse;

	if (result.success) {
		return hasMasterFromResponse(result.data);
	}

	if (!result.success && result.code === "UNAUTHORIZED") {
		const refreshResponse = await chrome.runtime.sendMessage({
			type: "REFRESH",
		});

		if ((refreshResponse as PopupResponse).success) {
			const retryResponse = await chrome.runtime.sendMessage({
				type: "API_REQUEST",
				payload: { path: "/resumes" },
			});

			if ((retryResponse as PopupResponse).success) {
				return hasMasterFromResponse(
					(retryResponse as PopupResponse).data,
				);
			}
		}
	}

	return false;
}

function main(): void {
	const style = document.createElement("style");
	style.textContent = `
    @keyframes shoot-spin { to { transform: rotate(360deg); } }
    .shoot-spinner {
      display: inline-block;
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: shoot-spin 0.6s linear infinite;
      vertical-align: middle;
      margin-right: 4px;
    }
  `;
	document.head.appendChild(style);

	let hasMasterResume: boolean | null = null;

	checkHasMasterResume().then((result) => {
		hasMasterResume = result;
		updateShootButtons(result);
	});

	const initialModal = findModal();
	if (initialModal) {
		injectShootButton(initialModal, hasMasterResume ?? false);
	}

	const observer = new MutationObserver(() => {
		const m = findModal();
		if (m && !m.querySelector("#shoot-button")) {
			injectShootButton(m, hasMasterResume ?? false);
		}
	});
	observer.observe(document.body, { childList: true, subtree: true });

	setTimeout(() => {
		/* standby — observer still active, initial scan phase over */
	}, 5000);
}

export default defineContentScript({
	matches: ["*://*.indeed.com/*"],
	main,
});
