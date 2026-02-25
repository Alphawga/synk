import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { generateEmbedding, buildEmbeddingText } from "~/server/ai/embeddings";
import { categorizeContent } from "~/server/ai/categorization";
import { z } from "zod";

// Input validation
const saveTabsSchema = z.object({
    tabs: z.array(
        z.object({
            url: z.string().url(),
            title: z.string(),
            favIconUrl: z.string().optional(),
        })
    ),
    pinned: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check
        const session = await auth();
        console.log("[EXT-SAVE] Auth check:", session?.user?.id ? `✅ user=${session.user.id}` : "❌ no session");

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse Body
        const body = (await req.json()) as unknown;
        const result = saveTabsSchema.safeParse(body);

        if (!result.success) {
            console.log("[EXT-SAVE] ❌ Invalid body:", result.error.flatten());
            return NextResponse.json(
                { error: "Invalid request body", details: result.error.flatten() },
                { status: 400 }
            );
        }

        const { tabs } = result.data;
        console.log(`[EXT-SAVE] Saving ${tabs.length} tabs...`);

        // 3. Create Session Name
        const date = new Date();
        const sessionName = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
        });

        // 4. Database Transaction
        const savedData = await db.$transaction(async (tx) => {
            const newSession = await tx.saveSession.create({
                data: {
                    name: sessionName,
                    userId: session.user.id,
                },
            });

            if (tabs.length > 0) {
                await tx.save.createMany({
                    data: tabs.map((tab, index) => ({
                        url: tab.url,
                        title: tab.title || "Untitled",
                        favicon: tab.favIconUrl,
                        domain: new URL(tab.url).hostname,
                        userId: session.user.id,
                        sessionId: newSession.id,
                        source: "BROWSER",
                        order: index,
                    })),
                });
            }

            return { session: newSession, count: tabs.length };
        });

        console.log(`[EXT-SAVE] ✅ ${savedData.count} tabs saved to session ${savedData.session.id}`);

        // 5. Generate embeddings in background (fire-and-forget)
        void (async () => {
            const saves = await db.save.findMany({
                where: { sessionId: savedData.session.id },
                select: { id: true, title: true, url: true },
            });

            console.log(`[EXT-EMBED] Generating embeddings for ${saves.length} saves...`);

            let success = 0;
            let failed = 0;

            for (const save of saves) {
                try {
                    const text = buildEmbeddingText(save.title, save.url);
                    const embedding = await generateEmbedding(text);

                    if (embedding.length === 0) {
                        console.log(`[EXT-EMBED] ⚠️ Empty embedding for: ${save.title}`);
                        failed++;
                        continue;
                    }

                    const vectorString = `[${embedding.join(",")}]`;
                    await db.$executeRaw`
                        UPDATE "Save"
                        SET embedding = ${vectorString}::vector
                        WHERE id = ${save.id}
                    `;
                    success++;
                    console.log(`[EXT-EMBED] ✅ Embedded: ${save.title} (${embedding.length}d)`);
                } catch (err) {
                    failed++;
                    console.error(`[EXT-EMBED] ❌ Failed: ${save.title}`, err);
                }
            }

            console.log(`[EXT-EMBED] Done: ${success} success, ${failed} failed`);
        })();

        // 6. Auto-categorize in background (fire-and-forget) — PRD US-4.1
        void (async () => {
            try {
                const saves = await db.save.findMany({
                    where: { sessionId: savedData.session.id },
                    select: { id: true, title: true, url: true, domain: true },
                });

                const items = saves.map(s => ({
                    url: s.url,
                    title: s.title,
                    domain: s.domain ?? new URL(s.url).hostname,
                }));

                const results = await categorizeContent(items);
                if (results.length === 0) {
                    console.log("[EXT-CAT] ⚠️ No categorization results returned");
                    return;
                }

                for (let i = 0; i < results.length; i++) {
                    const result = results[i];
                    const save = saves[i];
                    if (!result || !save) continue;

                    try {
                        // Upsert Category
                        const slug = result.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                        const category = await db.category.upsert({
                            where: { slug },
                            create: { name: result.category, slug },
                            update: {},
                        });

                        // Upsert Tags
                        const tagConnects: { id: string }[] = [];
                        for (const tagName of result.tags) {
                            const tag = await db.tag.upsert({
                                where: { name: tagName.toLowerCase() },
                                create: { name: tagName.toLowerCase() },
                                update: {},
                            });
                            tagConnects.push({ id: tag.id });
                        }

                        // Update Save with category + tags
                        await db.save.update({
                            where: { id: save.id },
                            data: {
                                categoryId: category.id,
                                tags: { connect: tagConnects },
                            },
                        });

                        console.log(`[EXT-CAT] ✅ "${save.title}" → ${result.category} [${result.tags.join(", ")}]`);
                    } catch (err) {
                        console.error(`[EXT-CAT] ❌ Failed: ${save.title}`, err);
                    }
                }

                console.log(`[EXT-CAT] Done categorizing session`);
            } catch (err) {
                console.error("[EXT-CAT] ❌ Categorization failed:", err);
            }
        })();

        return NextResponse.json({
            success: true,
            message: `${savedData.count} tabs saved`,
            sessionId: savedData.session.id,
        });
    } catch (error) {
        console.error("[EXT-SAVE] ❌ Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
