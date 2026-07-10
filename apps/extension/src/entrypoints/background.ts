import { AuthService } from "@resumio/shared";
import { chromeTokenStore, initializeTokenStore } from "../token-store";
import type { PopupMessage } from "../types";

const API_BASE = import.meta.env.VITE_API_URL as string;

const authService = new AuthService(
	fetch.bind(globalThis),
	API_BASE,
	chromeTokenStore,
);

// Preload tokens from storage so GET_ME works on popup reopen
await initializeTokenStore();

chrome.runtime.onMessage.addListener(
	(
		message: PopupMessage,
		_sender: chrome.runtime.MessageSender,
		sendResponse: (response: unknown) => void,
	) => {
		handleMessage(message, sendResponse);
		return true;
	},
);

async function handleMessage(
	message: PopupMessage,
	sendResponse: (response: unknown) => void,
): Promise<void> {
	try {
		switch (message.type) {
			case "LOGIN": {
				const result = await authService.login(message.payload);
				const mfaPending = "mfa_pending" in result;
				if (mfaPending) {
					sendResponse({
						success: true,
						data: result,
						mfaPending: true,
					});
				} else {
					sendResponse({ success: true, data: result });
				}
				break;
			}

			case "GET_ME": {
				const user = await authService.getMe();
				sendResponse({ success: true, data: user });
				break;
			}

			case "LOGOUT": {
				await authService.logout();
				sendResponse({ success: true, data: null });
				break;
			}

			default:
				sendResponse({
					success: false,
					error: `Unknown message type: ${(message as Record<string, string>).type}`,
				});
		}
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : "An unexpected error occurred";
		sendResponse({ success: false, error: message });
	}
}
