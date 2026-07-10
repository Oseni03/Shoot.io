import { beforeEach, describe, expect, it, vi } from "vitest";

const mockStorage: Record<string, string> = {};

beforeEach(() => {
	for (const key of Object.keys(mockStorage)) {
		delete mockStorage[key];
	}
	(globalThis as Record<string, unknown>).chrome = {
		storage: {
			local: {
				get: vi.fn(
					(
						_keys:
							| string
							| string[]
							| Record<string, unknown>
							| null,
						callback: (result: Record<string, string>) => void,
					) => {
						callback(mockStorage);
					},
				),
				set: vi.fn(
					(items: Record<string, string>, callback?: () => void) => {
						for (const [key, value] of Object.entries(items)) {
							mockStorage[key] = value;
						}
						callback?.();
					},
				),
				remove: vi.fn(
					(keys: string | string[], callback?: () => void) => {
						for (const key of Array.isArray(keys) ? keys : [keys]) {
							delete mockStorage[key];
						}
						callback?.();
					},
				),
			},
		},
	} as unknown as typeof chrome;
});

describe("chromeTokenStore", () => {
	it("getAccess returns null when no token stored", async () => {
		const { chromeTokenStore } = await import("./token-store");
		chromeTokenStore.clear();
		expect(chromeTokenStore.getAccess()).toBeNull();
	});

	it("getAccess returns stored access token after set", async () => {
		const { chromeTokenStore } = await import("./token-store");
		chromeTokenStore.set("access123", "refresh123");
		expect(chromeTokenStore.getAccess()).toBe("access123");
	});

	it("getRefresh returns null when no token stored", async () => {
		const { chromeTokenStore } = await import("./token-store");
		chromeTokenStore.clear();
		expect(chromeTokenStore.getRefresh()).toBeNull();
	});

	it("getRefresh returns stored refresh token after set", async () => {
		const { chromeTokenStore } = await import("./token-store");
		chromeTokenStore.set("access123", "refresh123");
		expect(chromeTokenStore.getRefresh()).toBe("refresh123");
	});

	it("set stores tokens in chrome.storage.local", async () => {
		const { chromeTokenStore } = await import("./token-store");
		chromeTokenStore.set("at", "rt");
		expect(globalThis.chrome.storage.local.set).toHaveBeenCalledWith(
			{ access_token: "at", refresh_token: "rt" },
			expect.any(Function),
		);
	});

	it("clear removes both tokens from memory", async () => {
		const { chromeTokenStore } = await import("./token-store");
		chromeTokenStore.set("at", "rt");
		chromeTokenStore.clear();
		expect(chromeTokenStore.getAccess()).toBeNull();
		expect(chromeTokenStore.getRefresh()).toBeNull();
	});

	it("clear removes tokens from chrome.storage.local", async () => {
		const { chromeTokenStore } = await import("./token-store");
		chromeTokenStore.clear();
		expect(globalThis.chrome.storage.local.remove).toHaveBeenCalledWith(
			["access_token", "refresh_token"],
			expect.any(Function),
		);
	});
});

describe("getAccessAsync / getRefreshAsync", () => {
	it("getAccessAsync returns null when storage is empty", async () => {
		const { getAccessAsync } = await import("./token-store");
		const result = await getAccessAsync();
		expect(result).toBeNull();
	});

	it("getAccessAsync returns value from storage", async () => {
		mockStorage.access_token = "stored_at";
		const { getAccessAsync } = await import("./token-store");
		const result = await getAccessAsync();
		expect(result).toBe("stored_at");
	});

	it("getRefreshAsync returns value from storage", async () => {
		mockStorage.refresh_token = "stored_rt";
		const { getRefreshAsync } = await import("./token-store");
		const result = await getRefreshAsync();
		expect(result).toBe("stored_rt");
	});
});

describe("initializeTokenStore from storage", () => {
	it("populates memory cache from chrome.storage.local", async () => {
		const { chromeTokenStore, initializeTokenStore } = await import(
			"./token-store"
		);
		// Reset module-level cache and storage before test
		chromeTokenStore.clear();
		mockStorage.access_token = "preloaded_at";
		mockStorage.refresh_token = "preloaded_rt";
		await initializeTokenStore();
		expect(chromeTokenStore.getAccess()).toBe("preloaded_at");
		expect(chromeTokenStore.getRefresh()).toBe("preloaded_rt");
	});

	it("leaves cache as null when storage is empty", async () => {
		const { chromeTokenStore, initializeTokenStore } = await import(
			"./token-store"
		);
		// Reset module-level cache before test
		chromeTokenStore.clear();
		await initializeTokenStore();
		expect(chromeTokenStore.getAccess()).toBeNull();
		expect(chromeTokenStore.getRefresh()).toBeNull();
	});
});
