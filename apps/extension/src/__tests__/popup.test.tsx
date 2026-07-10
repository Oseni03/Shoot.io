import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockSendMessage: ReturnType<typeof vi.fn>;

beforeEach(() => {
	mockSendMessage = vi.fn();
	mockSendMessage.mockResolvedValue({ success: false, error: "No response" });
	(chrome.runtime.sendMessage as unknown as ReturnType<typeof vi.fn>) =
		mockSendMessage;
});

async function loadPopup() {
	const mod = await import("../entrypoints/popup/App");
	return { App: mod.default };
}

describe("popup login form", () => {
	it("renders loading state on mount", async () => {
		mockSendMessage.mockImplementation(
			() => new Promise(() => {}), // never resolves
		);
		const { App } = await loadPopup();
		render(<App />);
		expect(screen.getByText("Loading...")).toBeDefined();
	});

	it("shows login form when not authenticated", async () => {
		mockSendMessage.mockImplementation((msg: { type: string }) => {
			if (msg.type === "REFRESH")
				return { success: false, error: "No session" };
			if (msg.type === "GET_ME")
				return { success: false, error: "Unauthorized" };
			return { success: false, error: "Unknown" };
		});

		const { App } = await loadPopup();
		render(<App />);

		const heading = await screen.findByText("Sign in to Resumio");
		expect(heading).toBeDefined();
		expect(screen.getByLabelText("Email")).toBeDefined();
		expect(screen.getByLabelText("Password")).toBeDefined();
		expect(screen.getByRole("button", { name: "Sign in" })).toBeDefined();
	});

	it("shows register form when switching tabs", async () => {
		mockSendMessage.mockImplementation((msg: { type: string }) => {
			if (msg.type === "REFRESH")
				return { success: false, error: "No session" };
			if (msg.type === "GET_ME")
				return { success: false, error: "Unauthorized" };
			return { success: false, error: "Unknown" };
		});

		const { App } = await loadPopup();
		render(<App />);

		await screen.findByText("Sign in to Resumio");
		act(() => {
			screen.getByText("Sign up").click();
		});

		expect(screen.getByText("Create an account")).toBeDefined();
		expect(screen.getByLabelText("Name")).toBeDefined();
		expect(screen.getByLabelText("Email")).toBeDefined();
		expect(screen.getByLabelText("Password")).toBeDefined();
	});

	it("shows API error on failed login", async () => {
		mockSendMessage.mockImplementation((msg: { type: string }) => {
			if (msg.type === "REFRESH")
				return { success: false, error: "No session" };
			if (msg.type === "GET_ME")
				return { success: false, error: "Unauthorized" };
			if (msg.type === "LOGIN")
				return { success: false, error: "Invalid credentials" };
			return { success: false, error: "Unknown" };
		});

		const { App } = await loadPopup();
		render(<App />);

		await screen.findByText("Sign in to Resumio");

		const user = userEvent.setup();
		await user.type(screen.getByLabelText("Email"), "a@b.com");
		await user.type(screen.getByLabelText("Password"), "wrong");
		await user.click(screen.getByRole("button", { name: "Sign in" }));

		const error = await screen.findByText("Invalid credentials");
		expect(error).toBeDefined();
	});

	it("shows network error banner on network failure", async () => {
		mockSendMessage.mockImplementation((msg: { type: string }) => {
			if (msg.type === "REFRESH")
				return { success: false, error: "No session" };
			if (msg.type === "GET_ME")
				return { success: false, error: "Unauthorized" };
			if (msg.type === "LOGIN")
				return {
					success: false,
					code: "NETWORK",
					error: "Failed to fetch",
				};
			return { success: false, error: "Unknown" };
		});

		const { App } = await loadPopup();
		render(<App />);

		await screen.findByText("Sign in to Resumio");

		const user = userEvent.setup();
		await user.type(screen.getByLabelText("Email"), "a@b.com");
		await user.type(screen.getByLabelText("Password"), "pwd");
		await user.click(screen.getByRole("button", { name: "Sign in" }));

		const banner = await screen.findByText(/Network Error/);
		expect(banner).toBeDefined();
	});

	it("shows authenticated view after successful login", async () => {
		mockSendMessage.mockImplementation((msg: { type: string }) => {
			if (msg.type === "REFRESH")
				return { success: false, error: "No session" };
			if (msg.type === "GET_ME")
				return { success: false, error: "Unauthorized" };
			if (msg.type === "LOGIN") {
				return {
					success: true,
					data: {
						access_token: "at",
						refresh_token: "rt",
						token_type: "bearer",
						user: {
							id: "u1",
							email: "a@b.com",
							full_name: "Alice",
							avatar_url: null,
							is_verified: true,
							is_active: true,
							mfa_enabled: false,
							created_at: "2026-01-01T00:00:00Z",
							organizations: [],
						},
					},
				};
			}
			return { success: false, error: "Unknown" };
		});

		const { App } = await loadPopup();
		render(<App />);

		await screen.findByText("Sign in to Resumio");

		const user = userEvent.setup();
		await user.type(screen.getByLabelText("Email"), "a@b.com");
		await user.type(screen.getByLabelText("Password"), "Strong1");
		await user.click(screen.getByRole("button", { name: "Sign in" }));

		const name = await screen.findByText("Alice");
		expect(name).toBeDefined();
		expect(screen.getByText("a@b.com")).toBeDefined();
		expect(screen.getByRole("button", { name: "Log out" })).toBeDefined();
	});

	it("renders MFA view when login requires TOTP", async () => {
		mockSendMessage.mockImplementation((msg: { type: string }) => {
			if (msg.type === "REFRESH")
				return { success: false, error: "No session" };
			if (msg.type === "GET_ME")
				return { success: false, error: "Unauthorized" };
			if (msg.type === "LOGIN") {
				return {
					success: true,
					mfaPending: true,
					data: { mfa_pending: "mfa_token_123", expires_in: 300 },
				};
			}
			return { success: false, error: "Unknown" };
		});

		const { App } = await loadPopup();
		render(<App />);

		await screen.findByText("Sign in to Resumio");

		const user = userEvent.setup();
		await user.type(screen.getByLabelText("Email"), "a@b.com");
		await user.type(screen.getByLabelText("Password"), "Strong1");
		await user.click(screen.getByRole("button", { name: "Sign in" }));

		const heading = await screen.findByText("Two-Factor Authentication");
		expect(heading).toBeDefined();
		expect(screen.getByLabelText("Authentication code")).toBeDefined();
	});

	it("logs out and returns to login form", async () => {
		mockSendMessage.mockImplementation((msg: { type: string }) => {
			if (msg.type === "REFRESH") return { success: true, data: null };
			if (msg.type === "GET_ME") {
				return {
					success: true,
					data: {
						id: "u1",
						email: "a@b.com",
						full_name: "Alice",
						avatar_url: null,
						is_verified: true,
						is_active: true,
						mfa_enabled: false,
						created_at: "2026-01-01T00:00:00Z",
						organizations: [],
					},
				};
			}
			if (msg.type === "LOGOUT") return { success: true, data: null };
			return { success: false, error: "Unknown" };
		});

		const { App } = await loadPopup();
		render(<App />);

		await screen.findByText("Alice");

		act(() => {
			screen.getByRole("button", { name: "Log out" }).click();
		});

		const heading = await screen.findByText("Sign in to Resumio");
		expect(heading).toBeDefined();
	});
});
