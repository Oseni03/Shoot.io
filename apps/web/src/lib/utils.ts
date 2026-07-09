import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const camelToSnake = (str: string): string => {
	return str.replace(/([A-Z])/g, "_$1").toLowerCase();
};

/**
 * Recursively transforms all keys from camelCase to snake_case
 */
export const snakeCaseSchema = <T extends z.ZodTypeAny>(schema: T) =>
	z.preprocess((data: any): any => {
		if (data === null || data === undefined || typeof data !== "object") {
			return data;
		}

		if (Array.isArray(data)) {
			return data.map((item) => snakeCaseSchema(z.any()).parse(item));
		}

		const result: any = {};
		for (const [key, value] of Object.entries(data)) {
			const snakeKey = camelToSnake(key);
			result[snakeKey] = snakeCaseSchema(z.any()).parse(value);
		}
		return result;
	}, schema);
