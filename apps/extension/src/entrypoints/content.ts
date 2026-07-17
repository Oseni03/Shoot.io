import { defineContentScript } from "wxt/utils/define-content-script";
import type { PopupResponse } from "../types";

const SELECTORS = {
	applyButton: '[data-testid="apply-button"]',
	jobDescription: '[class*="jobsearch-JobComponent-description"]',
	descriptionFallback: '[class*="jobsearch-JobInfoHeader"]',
	formInputs: "input, select, textarea",
};

let shootInProgress = false;

function waitForElement(
	selector: string,
	timeoutMs = 5000,
): Promise<Element | null> {
	return new Promise((resolve) => {
		const el = document.querySelector(selector);
		if (el) {
			resolve(el);
			return;
		}
		const observer = new MutationObserver(() => {
			const found = document.querySelector(selector);
			if (found) {
				observer.disconnect();
				resolve(found);
			}
		});
		observer.observe(document.body, { childList: true, subtree: true });
		setTimeout(() => {
			observer.disconnect();
			resolve(null);
		}, timeoutMs);
	});
}

function scrapeJobDescription(): string | null {
	const desc = document.querySelector(SELECTORS.jobDescription);
	if (desc) return desc.textContent?.trim() ?? null;
	const fallback = document.querySelector(SELECTORS.descriptionFallback);
	return fallback?.textContent?.trim() ?? null;
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

function fillFormField(fieldName: string, value: string): void {
	const inputs = document.querySelectorAll(SELECTORS.formInputs);
	for (const input of inputs) {
		const el = input as
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement;
		const name = el.name?.toLowerCase() ?? "";
		const id = el.id?.toLowerCase() ?? "";
		const ariaLabel = el.getAttribute("aria-label")?.toLowerCase() ?? "";
		const placeholder = el.getAttribute("placeholder")?.toLowerCase() ?? "";

		const matches = [name, id, ariaLabel, placeholder].some(
			(label) => label.includes(fieldName) || fieldName.includes(label),
		);
		if (!matches) continue;

		const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
			window.HTMLInputElement.prototype,
			"value",
		)?.set;
		if (nativeInputValueSetter && el instanceof HTMLInputElement) {
			nativeInputValueSetter.call(el, value);
		} else {
			(el as HTMLInputElement).value = value;
		}
		el.dispatchEvent(new Event("input", { bubbles: true }));
		el.dispatchEvent(new Event("change", { bubbles: true }));
	}
}

function autoFillForm(fields: Record<string, string>): {
	filled: number;
	total: number;
} {
	for (const [fieldName, value] of Object.entries(fields)) {
		fillFormField(fieldName, value);
	}
	return {
		filled: Object.keys(fields).length,
		total: Object.keys(fields).length,
	};
}

function showToast(message: string, type: "loading" | "success" | "error"): void {
	const existing = document.querySelector("#shoot-toast");
	if (existing) existing.remove();

	const toast = document.createElement("div");
	toast.id = "shoot-toast";
	toast.textContent = message;
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
		backgroundColor:
			type === "error"
				? "#dc2626"
				: type === "loading"
					? "#2563eb"
					: "#16a34a",
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

async function handleShoot(shootButton: HTMLButtonElement): Promise<void> {
	if (shootInProgress) return;

	const jdText = scrapeJobDescription();
	if (!jdText) {
		showToast(
			"Could not read job description. Try refreshing the page.",
			"error",
		);
		return;
	}

	shootInProgress = true;
	shootButton.disabled = true;
	shootButton.textContent = "Shooting...";
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
				chrome.runtime.sendMessage({ type: "OPEN_POPUP" });
			} else {
				showToast(result.error ?? "Shoot failed. Try again.", "error");
			}
			return;
		}

		const data = result.data as {
			auto_fill_fields: Record<string, string>;
		};
		const autoFillFields = data.auto_fill_fields;
		const fieldCount = Object.keys(autoFillFields).length;

		autoFillForm(autoFillFields);

		if (fieldCount === 0) {
			showToast(
				"Resume tailored! Auto-fill couldn't find matching fields.",
				"success",
			);
		} else {
			showToast("Resume tailored and form filled!", "success");
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

function injectShootButton(applyButton: Element): void {
	const parent = applyButton.parentElement;
	if (!parent || parent.querySelector("#shoot-button")) return;

	const button = document.createElement("button");
	button.id = "shoot-button";
	button.textContent = "Shoot";
	Object.assign(button.style, {
		padding: "8px 16px",
		borderRadius: "6px",
		border: "none",
		backgroundColor: "#2563eb",
		color: "#fff",
		fontSize: "14px",
		fontWeight: "600",
		cursor: "pointer",
		marginLeft: "8px",
	});

	button.addEventListener("click", () => handleShoot(button));

	parent.appendChild(button);
}

function main(): void {
	waitForElement(SELECTORS.applyButton, 10000).then((applyButton) => {
		if (applyButton) injectShootButton(applyButton);
	});

	const observer = new MutationObserver(() => {
		const applyButton = document.querySelector(SELECTORS.applyButton);
		if (
			applyButton &&
			!applyButton.parentElement?.querySelector("#shoot-button")
		) {
			injectShootButton(applyButton);
		}
	});
	observer.observe(document.body, { childList: true, subtree: true });
}

export default defineContentScript({
	matches: ["*://*.indeed.com/*"],
	main,
});
