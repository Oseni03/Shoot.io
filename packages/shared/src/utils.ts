import { z } from "zod";

const camelToSnake = (str: string): string => {
	return str.replace(/([A-Z])/g, "_$1").toLowerCase();
};

export const snakeCaseSchema = <T extends z.ZodTypeAny>(schema: T) =>
	z.preprocess((data: unknown): unknown => {
		if (data === null || data === undefined || typeof data !== "object") {
			return data;
		}

		if (Array.isArray(data)) {
			return data.map((item) => snakeCaseSchema(z.any()).parse(item));
		}

		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(data)) {
			const snakeKey = camelToSnake(key);
			result[snakeKey] = snakeCaseSchema(z.any()).parse(value);
		}
		return result;
	}, schema);
