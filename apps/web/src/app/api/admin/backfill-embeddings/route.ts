import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { generateEmbedding, buildEmbeddingText } from "~/server/ai/embeddings";

/**
 * POST /api/admin/backfill-embeddings
 * Regenerates embeddings for ALL saves (clears existing ones first).
 * Uses buildEmbeddingText for clean, semantic-friendly text.
 */
export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get ALL saves for the user (we regenerate everything with clean text)
    const saves = await db.$queryRaw`
        SELECT id, title, url
        FROM "Save"
        WHERE "userId" = ${session.user.id}
          AND "deletedAt" IS NULL
        ORDER BY "createdAt" DESC
        LIMIT 500
    ` as Array<{ id: string; title: string; url: string }>;

    console.log(`[BACKFILL] Starting backfill for ${saves.length} saves...`);

    let processed = 0;
    let failed = 0;

    for (const save of saves) {
        try {
            const text = buildEmbeddingText(save.title, save.url);
            console.log(`[BACKFILL] Embedding: "${text}"`);

            const embedding = await generateEmbedding(text);
            if (embedding.length === 0) {
                console.log(`[BACKFILL] ⚠️ Empty embedding for: ${save.title}`);
                failed++;
                continue;
            }

            const vectorString = `[${embedding.join(",")}]`;
            await db.$executeRaw`
                UPDATE "Save"
                SET embedding = ${vectorString}::vector
                WHERE id = ${save.id}
            `;
            processed++;
            console.log(`[BACKFILL] ✅ ${processed}/${saves.length}: "${save.title}" (${embedding.length}d)`);
        } catch (err) {
            console.error(`[BACKFILL] ❌ Failed: ${save.title}`, err);
            failed++;
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log(`[BACKFILL] Done: ${processed} success, ${failed} failed`);

    return NextResponse.json({
        total: saves.length,
        processed,
        failed,
        message: `Generated embeddings for ${processed} saves.${failed > 0 ? ` ${failed} failed.` : ""}`,
    });
}
