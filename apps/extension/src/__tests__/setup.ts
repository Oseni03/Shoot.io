import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

(globalThis as Record<string, unknown>).chrome = {
	runtime: {
		sendMessage: vi.fn(),
		onMessage: {
			addListener: vi.fn(),
		},
	},
	storage: {
		local: {
			get: vi.fn(
				(
					_keys: string | string[] | Record<string, unknown> | null,
					callback: (result: Record<string, string>) => void,
				) => {
					callback({});
				},
			),
			set: vi.fn(
				(_items: Record<string, string>, callback?: () => void) => {
					callback?.();
				},
			),
			remove: vi.fn((_keys: string | string[], callback?: () => void) => {
				callback?.();
			}),
		},
	},
} as unknown as typeof chrome;
