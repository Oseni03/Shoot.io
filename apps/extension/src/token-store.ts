import type { TokenStore } from "shared";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

let cachedAccess: string | null = null;
let cachedRefresh: string | null = null;

function getFromStorage(key: string): Promise<string | null> {
	return new Promise<string | null>((resolve) => {
		chrome.storage.local.get(key, (result: Record<string, string>) => {
			resolve(result[key] ?? null);
		});
	});
}

function setInStorage(items: Record<string, string>): Promise<void> {
	return new Promise((resolve) => {
		chrome.storage.local.set(items, resolve);
	});
}

function removeFromStorage(keys: string[]): Promise<void> {
	return new Promise((resolve) => {
		chrome.storage.local.remove(keys, resolve);
	});
}

export const chromeTokenStore: TokenStore = {
	getAccess: () => cachedAccess,
	getRefresh: () => cachedRefresh,
	set: (access: string, refresh: string) => {
		cachedAccess = access;
		cachedRefresh = refresh;
		setInStorage({
			[ACCESS_KEY]: access,
			[REFRESH_KEY]: refresh,
		});
	},
	clear: () => {
		cachedAccess = null;
		cachedRefresh = null;
		removeFromStorage([ACCESS_KEY, REFRESH_KEY]);
	},
};

export async function getAccessAsync(): Promise<string | null> {
	return getFromStorage(ACCESS_KEY);
}

export async function getRefreshAsync(): Promise<string | null> {
	return getFromStorage(REFRESH_KEY);
}

export async function initializeTokenStore(): Promise<void> {
	const [access, refresh] = await Promise.all([
		getFromStorage(ACCESS_KEY),
		getFromStorage(REFRESH_KEY),
	]);
	cachedAccess = access;
	cachedRefresh = refresh;
}
