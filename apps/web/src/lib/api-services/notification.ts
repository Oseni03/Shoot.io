import { z } from "zod";
import { API_ENDPOINTS } from "@/lib/config";
import {
	type NotificationListResponse,
	type NotificationResponse,
	NotificationResponseSchema,
} from "@/schemas";
import api from "../api";
import { snakeCaseSchema } from "../utils";

export const notificationService = {
	/**
	 * Get paginated notifications for the current user
	 */
	list: async (
		params: {
			limit?: number;
			offset?: number;
			page?: number;
			page_size?: number;
		} = {},
	): Promise<NotificationListResponse> => {
		const res = await api.get<any>(API_ENDPOINTS.notifications.root, {
			params,
		});

		return snakeCaseSchema(
			z.object({
				items: z.array(NotificationResponseSchema),
				unread_count: z.number(),
				limit: z.number().optional(),
				offset: z.number().optional(),
			}),
		).parse(res.data);
	},

	markRead: async (id: string): Promise<void> => {
		await api.post(API_ENDPOINTS.notifications.markRead(id));
	},

	markAllRead: async (): Promise<void> => {
		await api.post(API_ENDPOINTS.notifications.markAllRead);
	},
};
