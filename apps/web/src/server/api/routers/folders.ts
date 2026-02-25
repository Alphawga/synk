import { z } from "zod";
import {
    createTRPCRouter,
    protectedProcedure,
} from "~/server/api/trpc";

export const foldersRouter = createTRPCRouter({
    /**
     * Get all folders for the current user
     */
    getAll: protectedProcedure
        .query(async ({ ctx }) => {
            const folders = await ctx.db.folder.findMany({
                where: { userId: ctx.session.user.id },
                orderBy: { order: 'asc' },
                include: {
                    _count: { select: { sessions: true } },
                    children: {
                        orderBy: { order: 'asc' },
                        include: {
                            _count: { select: { sessions: true } }
                        }
                    }
                }
            });

            return folders;
        }),

    /**
     * Get a single folder with its sessions
     */
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const folder = await ctx.db.folder.findUnique({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                },
                include: {
                    sessions: {
                        where: { deletedAt: null },
                        orderBy: [
                            { isPinned: "desc" },
                            { createdAt: "desc" },
                        ],
                        include: {
                            saves: {
                                where: { deletedAt: null },
                                orderBy: [{ order: "asc" }, { createdAt: "asc" }],
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
                            _count: { select: { saves: true } },
                        },
                    },
                    _count: { select: { sessions: true } },
                    children: {
                        orderBy: { order: "asc" },
                        include: { _count: { select: { sessions: true } } },
                    },
                },
            });

            return folder;
        }),

    /**
     * Create a new folder
     */
    create: protectedProcedure
        .input(z.object({
            name: z.string().min(1).max(100),
            color: z.string().optional(),
            icon: z.string().optional(),
            parentId: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Get max order for placement
            const maxOrder = await ctx.db.folder.aggregate({
                where: { userId: ctx.session.user.id, parentId: input.parentId ?? null },
                _max: { order: true }
            });

            const folder = await ctx.db.folder.create({
                data: {
                    name: input.name,
                    color: input.color,
                    icon: input.icon,
                    parentId: input.parentId,
                    userId: ctx.session.user.id,
                    order: (maxOrder._max.order ?? -1) + 1,
                }
            });

            return folder;
        }),

    /**
     * Update a folder (rename, change color, etc.)
     */
    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().min(1).max(100).optional(),
            color: z.string().optional(),
            icon: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const folder = await ctx.db.folder.update({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id, // Ensure ownership
                },
                data: {
                    ...(input.name && { name: input.name }),
                    ...(input.color !== undefined && { color: input.color }),
                    ...(input.icon !== undefined && { icon: input.icon }),
                }
            });

            return folder;
        }),

    /**
     * Delete a folder (sessions moved to root)
     */
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // First, unlink all sessions from this folder
            await ctx.db.saveSession.updateMany({
                where: { folderId: input.id, userId: ctx.session.user.id },
                data: { folderId: null }
            });

            // Delete the folder (cascades to children via schema)
            await ctx.db.folder.delete({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                }
            });

            return { success: true };
        }),

    /**
     * Reorder folders
     */
    reorder: protectedProcedure
        .input(z.object({
            folderIds: z.array(z.string()), // Ordered list of folder IDs
        }))
        .mutation(async ({ ctx, input }) => {
            // Update each folder's order
            await Promise.all(
                input.folderIds.map((id, index) =>
                    ctx.db.folder.update({
                        where: { id, userId: ctx.session.user.id },
                        data: { order: index }
                    })
                )
            );

            return { success: true };
        }),
});
