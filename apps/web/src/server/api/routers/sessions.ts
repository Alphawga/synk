import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";

export const sessionsRouter = createTRPCRouter({
    /**
     * Get all sessions with their saves (for dashboard)
     */
    getAll: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(50).default(20),
                cursor: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const sessions = await ctx.db.saveSession.findMany({
                where: {
                    userId: ctx.session.user.id,
                    deletedAt: null,
                },
                orderBy: [
                    { isPinned: "desc" },
                    { createdAt: "desc" }
                ],
                take: input.limit + 1,
                cursor: input.cursor ? { id: input.cursor } : undefined,
                include: {
                    saves: {
                        where: { deletedAt: null },
                        orderBy: [
                            { order: "asc" },
                            { createdAt: "asc" }
                        ],
                        select: {
                            id: true,
                            url: true,
                            title: true,
                            favicon: true,
                            domain: true,
                            source: true,
                            createdAt: true,
                        },
                    },
                    _count: {
                        select: { saves: true },
                    },
                    folder: true,
                },
            });

            let nextCursor: string | undefined = undefined;
            if (sessions.length > input.limit) {
                const nextItem = sessions.pop();
                nextCursor = nextItem!.id;
            }

            return { sessions, nextCursor };
        }),

    /**
     * Rename a session
     */
    rename: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1).max(100),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return ctx.db.saveSession.update({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                },
                data: { name: input.name },
            });
        }),

    /**
     * Soft delete a session (and its saves)
     */
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // Soft delete the session
            await ctx.db.saveSession.update({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                },
                data: { deletedAt: new Date() },
            });

            // Also soft delete all saves in the session
            await ctx.db.save.updateMany({
                where: {
                    sessionId: input.id,
                    userId: ctx.session.user.id,
                },
                data: { deletedAt: new Date() },
            });

            return { success: true };
        }),

    /**
     * Get a single session by ID
     */
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.saveSession.findUnique({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                    deletedAt: null,
                },
                include: {
                    saves: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: "asc" },
                    },
                },
            });
        }),

    /**
     * Get a public session by ID
     */
    getPublic: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const session = await ctx.db.saveSession.findUnique({
                where: {
                    id: input.id,
                    deletedAt: null,
                    isPublic: true, // MUST be public
                },
                include: {
                    saves: {
                        where: { deletedAt: null },
                        orderBy: [
                            { order: "asc" },
                            { createdAt: "asc" }
                        ],
                    },
                    user: {
                        select: { name: true, image: true }
                    }
                },
            });

            if (!session) return null;
            return session;
        }),

    /**
     * Move session(s) to a folder
     */
    moveToFolder: protectedProcedure
        .input(z.object({
            sessionIds: z.array(z.string()),
            folderId: z.string().nullable(),
        }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.saveSession.updateMany({
                where: {
                    id: { in: input.sessionIds },
                    userId: ctx.session.user.id,
                },
                data: { folderId: input.folderId },
            });
            return { success: true };
        }),

    /**
     * Bulk update status flags (pin, lock, star, archive)
     */
    bulkAction: protectedProcedure
        .input(z.object({
            sessionIds: z.array(z.string()),
            action: z.enum(["pin", "unpin", "lock", "unlock", "star", "unstar", "archive", "unarchive"]),
        }))
        .mutation(async ({ ctx, input }) => {
            const updates: Record<string, boolean> = {};

            switch (input.action) {
                case "pin": updates.isPinned = true; break;
                case "unpin": updates.isPinned = false; break;
                case "lock": updates.isLocked = true; break;
                case "unlock": updates.isLocked = false; break;
                case "star": updates.isStarred = true; break;
                case "unstar": updates.isStarred = false; break;
                case "archive": updates.isArchived = true; break;
                case "unarchive": updates.isArchived = false; break;
            }

            await ctx.db.saveSession.updateMany({
                where: {
                    id: { in: input.sessionIds },
                    userId: ctx.session.user.id,
                },
                data: updates,
            });

            return { success: true };
        }),

    /**
     * Remove duplicate URLs within a session
     */
    removeDuplicates: protectedProcedure
        .input(z.object({ sessionId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // Get all saves in session
            const saves = await ctx.db.save.findMany({
                where: {
                    sessionId: input.sessionId,
                    userId: ctx.session.user.id,
                    deletedAt: null,
                },
                select: { id: true, url: true }
            });

            // Find duplicates
            const seen = new Set<string>();
            const duplicates: string[] = [];

            for (const save of saves) {
                if (seen.has(save.url)) {
                    duplicates.push(save.id);
                } else {
                    seen.add(save.url);
                }
            }

            // Delete duplicates
            if (duplicates.length > 0) {
                await ctx.db.save.updateMany({
                    where: { id: { in: duplicates } },
                    data: { deletedAt: new Date() }
                });
            }

            return { removed: duplicates.length };
        }),

    /**
     * Toggle public access for a session
     */
    togglePublic: protectedProcedure
        .input(z.object({
            id: z.string(),
            isPublic: z.boolean(),
        }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.saveSession.update({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                },
                data: { isPublic: input.isPublic },
            });
        }),

    /**
     * Get count of sessions
     */
    getCount: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.saveSession.count({
            where: {
                userId: ctx.session.user.id,
                deletedAt: null,
            },
        });
    }),
});
