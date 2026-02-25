import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { categorizeContent } from "~/server/ai/categorization";

/**
 * POST /api/admin/backfill-categories
 * Re-categorizes ALL saves using direct Gemini API.
 * Processes in batches of 10 to stay within rate limits.
 */
export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const saves = await db.save.findMany({
        where: { userId: session.user.id, deletedAt: null },
        select: { id: true, title: true, url: true, domain: true },
        orderBy: { createdAt: "desc" },
    });

    console.log(`[BACKFILL-CAT] Starting for ${saves.length} saves...`);

    let processed = 0;
    let failed = 0;
    const batchSize = 10;

    for (let i = 0; i < saves.length; i += batchSize) {
        const batch = saves.slice(i, i + batchSize);
        const items = batch.map(s => ({
            url: s.url,
            title: s.title,
            domain: s.domain ?? "unknown",
        }));

        try {
            const results = await categorizeContent(items);

            for (let j = 0; j < results.length; j++) {
                const result = results[j];
                const save = batch[j];
                if (!result || !save) continue;

                try {
                    const slug = result.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                    const category = await db.category.upsert({
                        where: { slug },
                        create: { name: result.category, slug },
                        update: {},
                    });

                    const tagConnects: { id: string }[] = [];
                    for (const tagName of result.tags) {
                        const tag = await db.tag.upsert({
                            where: { name: tagName.toLowerCase() },
                            create: { name: tagName.toLowerCase() },
                            update: {},
                        });
                        tagConnects.push({ id: tag.id });
                    }

                    await db.save.update({
                        where: { id: save.id },
                        data: { categoryId: category.id, tags: { set: tagConnects } },
                    });

                    processed++;
                } catch (err) {
                    failed++;
                    console.error(`[BACKFILL-CAT] ❌ ${save.title}`, err);
                }
            }
        } catch (err) {
            console.error(`[BACKFILL-CAT] ❌ Batch failed:`, err);
            failed += batch.length;
        }

        if (i + batchSize < saves.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log(`[BACKFILL-CAT] Done: ${processed} success, ${failed} failed`);

    return NextResponse.json({
        total: saves.length,
        processed,
        failed,
        message: `Re-categorized ${processed} saves.${failed > 0 ? ` ${failed} failed.` : ""}`,
    });
}
