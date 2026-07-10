export interface TokenStore {
	getAccess(): string | null;
	getRefresh(): string | null;
	set(access: string, refresh: string, tokenType?: string): void;
	clear(): void;
}

export interface CallOptions {
	signal?: AbortSignal;
}
