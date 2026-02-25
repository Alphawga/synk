import { z } from "zod";

/**
 * Shared Zod schemas for validation
 */

export const saveInputSchema = z.object({
    url: z.string().url(),
    title: z.string(),
    favicon: z.string().optional(),
    domain: z.string().optional(),
});

export const saveBatchInputSchema = z.array(saveInputSchema);

export const sessionRenameSchema = z.object({
    id: z.string(),
    name: z.string().min(1).max(100),
});

export const paginationSchema = z.object({
    limit: z.number().min(1).max(50).default(20),
    cursor: z.string().optional(),
});

export const searchSchema = z.object({
    query: z.string().min(1),
    limit: z.number().min(1).max(50).default(20),
});

// Inferred types
export type SaveInput = z.infer<typeof saveInputSchema>;
export type SaveBatchInput = z.infer<typeof saveBatchInputSchema>;
export type SessionRenameInput = z.infer<typeof sessionRenameSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
