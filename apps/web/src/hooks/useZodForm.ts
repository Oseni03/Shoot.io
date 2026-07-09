"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";

// biome-ignore lint/suspicious/noExplicitAny: needed for generic Zod type constraint
export function useZodForm<T extends z.ZodType<any, any, any>>(
	schema: T,
	defaultValues: z.input<T>,
) {
	type Output = z.output<T>;

	return useForm<Output>({
		// biome-ignore lint/suspicious/noExplicitAny: zodResolver accepts resolver with different output type
		resolver: zodResolver(schema) as any,
		defaultValues: defaultValues as Output,
	});
}
