import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { generateEmbedding } from "~/server/ai/embeddings";

/**
 * GET /api/admin/debug-search?q=your+query
 * Shows raw similarity scores for ALL saves against a query.
 * Useful for understanding why ranking is off.
 */
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const query = url.searchParams.get("q") ?? "what's video I was watching on building and deploy AI?";

    console.log(`\n[DEBUG-SEARCH] ══════════════════════════════════════`);
    console.log(`[DEBUG-SEARCH] Query: "${query}"`);
    console.log(`[DEBUG-SEARCH] User: ${session.user.id}`);

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query, "RETRIEVAL_QUERY");
    console.log(`[DEBUG-SEARCH] Query embedding: ${queryEmbedding.length}d`);

    if (queryEmbedding.length === 0) {
        return NextResponse.json({ error: "Failed to generate query embedding" }, { status: 500 });
    }

    const vectorQuery = `[${queryEmbedding.join(",")}]`;

    // Get ALL saves with their similarities — no threshold, no limit
    const allResults = await db.$queryRaw`
        SELECT DISTINCT ON (url)
               id, url, title, domain,
               1 - (embedding <=> ${vectorQuery}::vector) AS similarity,
               CASE WHEN embedding IS NOT NULL THEN true ELSE false END AS has_embedding
        FROM "Save"
        WHERE "userId" = ${session.user.id}
          AND "deletedAt" IS NULL
        ORDER BY url, "createdAt" DESC
    ` as Array<{
        id: string;
        url: string;
        title: string;
        domain: string | null;
        similarity: number | null;
        has_embedding: boolean;
    }>;

    // Sort by similarity descending
    allResults.sort((a, b) => (b.similarity ?? -1) - (a.similarity ?? -1));

    console.log(`[DEBUG-SEARCH] Total unique saves: ${allResults.length}`);
    for (const r of allResults) {
        console.log(`[DEBUG-SEARCH]   ${r.has_embedding ? "✅" : "❌"} ${((r.similarity ?? 0) * 100).toFixed(1)}% | "${r.title}" (${r.domain})`);
    }
    console.log(`[DEBUG-SEARCH] ══════════════════════════════════════\n`);

    return NextResponse.json({
        query,
        queryEmbeddingDims: queryEmbedding.length,
        totalSaves: allResults.length,
        results: allResults.map(r => ({
            title: r.title,
            domain: r.domain,
            similarity: r.similarity ? Number((r.similarity * 100).toFixed(1)) : null,
            hasEmbedding: r.has_embedding,
        })),
    });
}
