import { z } from "zod";
import { generateEmbedding, buildEmbeddingText } from "~/server/ai/embeddings";

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
                source: z.enum(["BROWSER", "X_LIKE", "X_BOOKMARK", "MOBILE_SHARE"]).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const save = await ctx.db.save.create({
                data: {
                    url: input.url,
                    title: input.title,
                    favicon: input.favicon,
                    domain: input.domain ?? new URL(input.url).hostname,
                    source: input.source ?? "BROWSER",
                    user: { connect: { id: ctx.session.user.id } },
                },
            });

            // Generate and store embedding (Async/Fire-and-forget to speed up UI)
            void (async () => {
                try {
                    const text = buildEmbeddingText(input.title, input.url);
                    const embedding = await generateEmbedding(text);
                    if (embedding.length === 0) return; // Skip if embedding generation failed
                    const vectorString = `[${embedding.join(",")}]`;

                    await ctx.db.$executeRaw`
                        UPDATE "Save" 
                        SET embedding = ${vectorString}::vector 
                        WHERE id = ${save.id}
                    `;
                } catch (err) {
                    console.error("Failed to generate/save embedding", err);
                }
            })();

            return save;
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

            // Bulk generate embeddings (Async)
            void (async () => {
                for (const save of saves) {
                    try {
                        const text = buildEmbeddingText(save.title, save.url);
                        const embedding = await generateEmbedding(text);
                        if (embedding.length === 0) continue; // Skip if failed
                        const vectorString = `[${embedding.join(",")}]`;

                        await ctx.db.$executeRaw`
                            UPDATE "Save" 
                            SET embedding = ${vectorString}::vector 
                            WHERE id = ${save.id}
                        `;
                    } catch (e) {
                        console.error("Embedding error for save", save.id);
                    }
                }
            })();

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
     * Search saves — combines semantic search (vector similarity) with keyword matching.
     * Returns a similarity score so the frontend can display relevance.
     */
    search: protectedProcedure
        .input(
            z.object({
                query: z.string().min(1),
                limit: z.number().min(1).max(50).default(20),
            })
        )
        .query(async ({ ctx, input }) => {
            console.log(`[SEARCH] ══════════════════════════════════════`);
            console.log(`[SEARCH] Query: "${input.query}" | User: ${ctx.session.user.id} | Limit: ${input.limit}`);

            type SearchResult = {
                id: string;
                url: string;
                title: string;
                favicon: string | null;
                domain: string | null;
                source: string;
                userId: string;
                similarity: number;
                matchType: "semantic" | "keyword";
                createdAt?: Date;
            };

            const results: SearchResult[] = [];
            const seenUrls = new Set<string>();

            // ── 1. Keyword search (always runs — fast and reliable) ──
            const keywordResults = await ctx.db.save.findMany({
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
                take: input.limit * 3, // fetch extra to account for dedup
            });

            console.log(`[SEARCH] Keyword results (raw): ${keywordResults.length}`);

            for (const r of keywordResults) {
                if (seenUrls.has(r.url)) continue; // skip duplicate URLs
                seenUrls.add(r.url);
                results.push({
                    id: r.id,
                    url: r.url,
                    title: r.title,
                    favicon: r.favicon,
                    domain: r.domain,
                    source: r.source,
                    userId: r.userId,
                    similarity: 1.0,
                    matchType: "keyword",
                    createdAt: r.createdAt,
                });
            }

            console.log(`[SEARCH] Keyword results (deduped): ${results.length}`);

            // ── 2. Semantic search ──
            try {
                if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) throw new Error("No API key");

                console.log(`[SEARCH] Generating query embedding...`);
                const embedding = await generateEmbedding(input.query, "RETRIEVAL_QUERY");
                if (embedding.length === 0) throw new Error("Embedding generation returned empty");
                console.log(`[SEARCH] ✅ Query embedding: ${embedding.length}d`);

                const vectorQuery = `[${embedding.join(",")}]`;

                // Check how many saves have embeddings
                const embeddingCount = await ctx.db.$queryRaw`
                    SELECT COUNT(*) as count FROM "Save" 
                    WHERE "userId" = ${ctx.session.user.id} 
                      AND "deletedAt" IS NULL 
                      AND embedding IS NOT NULL
                ` as Array<{ count: bigint }>;
                console.log(`[SEARCH] Saves with embeddings: ${embeddingCount[0]?.count ?? 0}`);

                // Use DISTINCT ON (url) to avoid duplicate results for same page
                // Threshold 0.60 — Gemini embeddings have higher baseline similarity
                const rawVectorResults = await ctx.db.$queryRaw`
                    SELECT DISTINCT ON (url) 
                           id, url, title, favicon, domain, "source", "userId", "createdAt",
                           1 - (embedding <=> ${vectorQuery}::vector) AS similarity
                    FROM "Save"
                    WHERE "userId" = ${ctx.session.user.id}
                      AND "deletedAt" IS NULL
                      AND embedding IS NOT NULL
                      AND 1 - (embedding <=> ${vectorQuery}::vector) > 0.60
                    ORDER BY url, embedding <=> ${vectorQuery}::vector
                `;

                const semanticResults = rawVectorResults as Array<{
                    id: string;
                    url: string;
                    title: string;
                    favicon: string | null;
                    domain: string | null;
                    source: string;
                    userId: string;
                    similarity: number;
                    createdAt: Date;
                }>;

                // Sort by similarity (DISTINCT ON forces ordering by url first)
                semanticResults.sort((a, b) => b.similarity - a.similarity);

                console.log(`[SEARCH] Semantic results (above 0.60, deduped): ${semanticResults.length}`);
                for (const r of semanticResults.slice(0, input.limit)) {
                    console.log(`[SEARCH]   → ${(r.similarity * 100).toFixed(1)}% "${r.title}"`);
                    if (!seenUrls.has(r.url)) {
                        seenUrls.add(r.url);
                        results.push({
                            ...r,
                            matchType: "semantic",
                        });
                    }
                }
            } catch (err) {
                console.warn("[SEARCH] ⚠️ Semantic search skipped:", err instanceof Error ? err.message : err);
            }

            // ── 3. Sort by similarity (highest first) and return ──
            results.sort((a, b) => b.similarity - a.similarity);
            console.log(`[SEARCH] Final results: ${results.length}`);
            console.log(`[SEARCH] ══════════════════════════════════════`);
            return results.slice(0, input.limit);
        }),

    /**
     * Bulk soft delete
     */
    deleteMany: protectedProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.save.updateMany({
                where: {
                    id: { in: input.ids },
                    userId: ctx.session.user.id,
                },
                data: { deletedAt: new Date() },
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

    /**
     * Reorder saves within a session (for drag-and-drop)
     */
    reorder: protectedProcedure
        .input(
            z.object({
                sessionId: z.string(),
                saveIds: z.array(z.string()), // IDs in new order
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Verify session belongs to user
            const session = await ctx.db.saveSession.findUnique({
                where: {
                    id: input.sessionId,
                    userId: ctx.session.user.id,
                },
            });

            if (!session) {
                throw new Error("Session not found");
            }

            // Update order for each save
            await Promise.all(
                input.saveIds.map((id, index) =>
                    ctx.db.save.update({
                        where: {
                            id,
                            sessionId: input.sessionId,
                            userId: ctx.session.user.id,
                        },
                        data: { order: index },
                    })
                )
            );

            return { success: true };
        }),
});
