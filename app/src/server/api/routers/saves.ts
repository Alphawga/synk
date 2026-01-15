import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
} from "~/server/api/trpc";

export const savesRouter = createTRPCRouter({
    /**
     * Create a new save (single tab)
     */
    create: protectedProcedure
        .input(
            z.object({
                url: z.string().url(),
                title: z.string(),
                favicon: z.string().optional(),
                domain: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return ctx.db.save.create({
                data: {
                    url: input.url,
                    title: input.title,
                    favicon: input.favicon,
                    domain: input.domain ?? new URL(input.url).hostname,
                    source: "BROWSER",
                    user: { connect: { id: ctx.session.user.id } },
                },
            });
        }),

    /**
     * Bulk create saves (save all tabs)
     */
    createMany: protectedProcedure
        .input(
            z.array(
                z.object({
                    url: z.string().url(),
                    title: z.string(),
                    favicon: z.string().optional(),
                    domain: z.string().optional(),
                })
            )
        )
        .mutation(async ({ ctx, input }) => {
            const saves = await ctx.db.save.createManyAndReturn({
                data: input.map((tab) => ({
                    url: tab.url,
                    title: tab.title,
                    favicon: tab.favicon,
                    domain: tab.domain ?? new URL(tab.url).hostname,
                    source: "BROWSER" as const,
                    userId: ctx.session.user.id,
                })),
            });
            return { count: saves.length };
        }),

    /**
     * Get all saves for the current user (paginated)
     */
    getAll: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).default(50),
                cursor: z.string().optional(),
                includeDeleted: z.boolean().default(false),
            })
        )
        .query(async ({ ctx, input }) => {
            const saves = await ctx.db.save.findMany({
                where: {
                    userId: ctx.session.user.id,
                    deletedAt: input.includeDeleted ? undefined : null,
                },
                orderBy: { createdAt: "desc" },
                take: input.limit + 1,
                cursor: input.cursor ? { id: input.cursor } : undefined,
                include: { category: true },
            });

            let nextCursor: string | undefined = undefined;
            if (saves.length > input.limit) {
                const nextItem = saves.pop();
                nextCursor = nextItem!.id;
            }

            return { saves, nextCursor };
        }),

    /**
     * Get recent saves (for extension popup)
     */
    getRecent: protectedProcedure
        .input(z.object({ limit: z.number().min(1).max(10).default(5) }))
        .query(async ({ ctx, input }) => {
            return ctx.db.save.findMany({
                where: {
                    userId: ctx.session.user.id,
                    deletedAt: null,
                },
                orderBy: { createdAt: "desc" },
                take: input.limit,
            });
        }),

    /**
     * Search saves using full-text search
     */
    search: protectedProcedure
        .input(
            z.object({
                query: z.string().min(1),
                limit: z.number().min(1).max(50).default(20),
            })
        )
        .query(async ({ ctx, input }) => {
            // Basic ILIKE search for MVP, can upgrade to pg full-text later
            return ctx.db.save.findMany({
                where: {
                    userId: ctx.session.user.id,
                    deletedAt: null,
                    OR: [
                        { title: { contains: input.query, mode: "insensitive" } },
                        { url: { contains: input.query, mode: "insensitive" } },
                        { domain: { contains: input.query, mode: "insensitive" } },
                    ],
                },
                orderBy: { createdAt: "desc" },
                take: input.limit,
                include: { category: true },
            });
        }),

    /**
     * Soft delete a save
     */
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.save.update({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                },
                data: { deletedAt: new Date() },
            });
        }),

    /**
     * Restore a deleted save
     */
    restore: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.save.update({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                },
                data: { deletedAt: null },
            });
        }),

    /**
     * Permanently delete (for trash cleanup)
     */
    permanentDelete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.save.delete({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                },
            });
        }),

    /**
     * Get count of saves for the current user
     */
    getCount: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.save.count({
            where: {
                userId: ctx.session.user.id,
                deletedAt: null,
            },
        });
    }),
});
