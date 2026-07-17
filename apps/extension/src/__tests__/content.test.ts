import { afterEach, beforeEach, describe, expect, it } from "vitest";
import contentScript from "../entrypoints/content";

function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("content script", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("registers as a content script scoped to Indeed only", () => {
		expect(contentScript.matches).toEqual(["*://*.indeed.com/*"]);
	});

	it("injects the Shoot button next to an apply button already on the page", async () => {
		const wrapper = document.createElement("div");
		const applyButton = document.createElement("button");
		applyButton.setAttribute("data-testid", "apply-button");
		wrapper.appendChild(applyButton);
		document.body.appendChild(wrapper);

		contentScript.main();
		await flushMicrotasks();

		const shootButton = document.querySelector("#shoot-button");
		expect(shootButton).not.toBeNull();
		expect(shootButton?.parentElement).toBe(wrapper);
	});

	it("injects the Shoot button once an apply button appears later via mutation", async () => {
		contentScript.main();
		await flushMicrotasks();

		expect(document.querySelector("#shoot-button")).toBeNull();

		const wrapper = document.createElement("div");
		const applyButton = document.createElement("button");
		applyButton.setAttribute("data-testid", "apply-button");
		wrapper.appendChild(applyButton);
		document.body.appendChild(wrapper);

		await flushMicrotasks();

		const shootButton = document.querySelector("#shoot-button");
		expect(shootButton).not.toBeNull();
		expect(shootButton?.parentElement).toBe(wrapper);
	});

	it("does not inject a second Shoot button next to the same apply button", async () => {
		const wrapper = document.createElement("div");
		const applyButton = document.createElement("button");
		applyButton.setAttribute("data-testid", "apply-button");
		wrapper.appendChild(applyButton);
		document.body.appendChild(wrapper);

		contentScript.main();
		await flushMicrotasks();

		wrapper.appendChild(document.createElement("span"));
		await flushMicrotasks();

		expect(wrapper.querySelectorAll("#shoot-button").length).toBe(1);
	});
});
