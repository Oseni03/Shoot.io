import { z } from "zod";

export const NotificationResponseSchema = z.object({
	id: z.string(),
	title: z.string(),
	body: z.string(),
	link: z.string().url().nullable().optional(),
	is_read: z.boolean(),
	read_at: z.iso.datetime().nullable().optional(),
	meta: z.record(z.string(), z.any()).nullable().optional(),
	created_at: z.string().datetime(),
});

export const NotificationListResponseSchema = z.object({
	items: z.array(NotificationResponseSchema),
	unread_count: z.number().int().min(0),
});

export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;
export type NotificationListResponse = z.infer<
	typeof NotificationListResponseSchema
>;
