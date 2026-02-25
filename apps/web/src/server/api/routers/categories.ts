import { z } from "zod";
import {
    createTRPCRouter,
    protectedProcedure,
} from "~/server/api/trpc";

export const categoriesRouter = createTRPCRouter({
    /**
     * Get all categories that have saves for the current user (with count)
     */
    getAll: protectedProcedure.query(async ({ ctx }) => {
        const categories = await ctx.db.category.findMany({
            where: {
                saves: {
                    some: {
                        userId: ctx.session.user.id,
                        deletedAt: null,
                    },
                },
            },
            include: {
                _count: {
                    select: {
                        saves: {
                            where: {
                                userId: ctx.session.user.id,
                                deletedAt: null,
                            },
                        },
                    },
                },
            },
            orderBy: { name: "asc" },
        });

        return categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            color: cat.color,
            count: cat._count.saves,
        }));
    }),

    /**
     * Get saves for a specific category
     */
    getSaves: protectedProcedure
        .input(
            z.object({
                slug: z.string(),
                limit: z.number().min(1).max(100).default(50),
                cursor: z.string().nullish(),
            })
        )
        .query(async ({ ctx, input }) => {
            const category = await ctx.db.category.findUnique({
                where: { slug: input.slug },
            });

            if (!category) {
                return { saves: [], category: null, nextCursor: null };
            }

            const saves = await ctx.db.save.findMany({
                where: {
                    userId: ctx.session.user.id,
                    categoryId: category.id,
                    deletedAt: null,
                },
                orderBy: { createdAt: "desc" },
                take: input.limit + 1,
                ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
                include: {
                    tags: true,
                    category: true,
                },
            });

            let nextCursor: string | null = null;
            if (saves.length > input.limit) {
                const nextItem = saves.pop();
                nextCursor = nextItem?.id ?? null;
            }

            return {
                saves,
                category: { id: category.id, name: category.name, slug: category.slug, color: category.color },
                nextCursor,
            };
        }),
});
