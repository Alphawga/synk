import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
} from "~/server/api/trpc";
import { aiService } from "~/lib/ai-service";

export const aiRouter = createTRPCRouter({
    /**
     * Check if AI is configured
     */
    isConfigured: protectedProcedure
        .query(() => {
            return {
                configured: aiService.isConfigured(),
                provider: aiService.getProviderInfo(),
            };

        }),

    /**
     * Categorize URLs with AI-generated tags
     */
    categorize: protectedProcedure
        .input(
            z.object({
                urls: z.array(z.object({
                    url: z.string(),
                    title: z.string(),
                    domain: z.string(),
                })),
            })
        )
        .mutation(async ({ input }) => {
            const results = await aiService.categorize(input.urls);
            return { results };
        }),

    /**
     * Generate a suggested session name
     */
    suggestSessionName: protectedProcedure
        .input(
            z.object({
                urls: z.array(z.object({
                    url: z.string(),
                    title: z.string(),
                })),
            })
        )
        .mutation(async ({ input }) => {
            const name = await aiService.suggestSessionName(input.urls);
            return { name };
        }),

    /**
     * Auto-categorize a session's tabs and update the database
     */
    categorizeSession: protectedProcedure
        .input(z.object({ sessionId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // Get the session with its saves
            const session = await ctx.db.saveSession.findUnique({
                where: {
                    id: input.sessionId,
                    userId: ctx.session.user.id,
                },
                include: {
                    saves: {
                        where: { deletedAt: null },
                        select: {
                            id: true,
                            url: true,
                            title: true,
                            domain: true,
                        },
                    },
                },
            });

            if (!session) {
                throw new Error("Session not found");
            }

            // Categorize the URLs
            const urls = session.saves.map(s => ({
                url: s.url,
                title: s.title,
                domain: s.domain ?? new URL(s.url).hostname,
            }));

            const results = await aiService.categorize(urls);

            // Persist results to database
            await Promise.all(results.map(async (result, index) => {
                const save = session.saves[index];
                if (!save) return;

                // 1. Handle Category
                let categoryId: string | undefined;
                if (result.category) {
                    const slug = result.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                    const category = await ctx.db.category.upsert({
                        where: { slug },
                        create: { name: result.category, slug },
                        update: {},
                    });
                    categoryId = category.id;
                }

                // 2. Handle Tags
                const tagConnects = [];
                for (const tagName of result.tags) {
                    const tag = await ctx.db.tag.upsert({
                        where: { name: tagName.toLowerCase() },
                        create: { name: tagName.toLowerCase() },
                        update: {},
                    });
                    tagConnects.push({ id: tag.id });
                }

                // 3. Update Save
                await ctx.db.save.update({
                    where: { id: save.id },
                    data: {
                        categoryId,
                        tags: {
                            connect: tagConnects
                        }
                    }
                });
            }));

            // Suggest a session name if not already named
            let suggestedName: string | null = null;
            if (!session.name) {
                suggestedName = await aiService.suggestSessionName(
                    urls.map(u => ({ url: u.url, title: u.title }))
                );
            }

            return {
                categorization: results,
                suggestedName,
                saveCount: session.saves.length,
            };
        }),

    /**
     * Suggest a name for a session based on its tabs (server-side URL fetch)
     */
    suggestNameForSession: protectedProcedure
        .input(z.object({ sessionId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const session = await ctx.db.saveSession.findUnique({
                where: {
                    id: input.sessionId,
                    userId: ctx.session.user.id,
                },
                include: {
                    saves: {
                        where: { deletedAt: null },
                        select: { url: true, title: true },
                        take: 10,
                    },
                },
            });

            if (!session) {
                throw new Error("Session not found");
            }

            const name = await aiService.suggestSessionName(
                session.saves.map(s => ({ url: s.url, title: s.title }))
            );

            return { name };
        }),
});
