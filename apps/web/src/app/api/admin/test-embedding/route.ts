import { NextResponse } from "next/server";
import { generateEmbedding } from "~/server/ai/embeddings";

/**
 * GET /api/admin/test-embedding
 * Tests if the embedding API is working correctly.
 */
export async function GET() {
    const testText = "So Will I (100 Billion X) YouTube Music";

    console.log("=== EMBEDDING TEST ===");
    console.log("OPENAI_API_KEY set:", !!process.env.OPENAI_API_KEY);
    console.log("GEMINI_API_KEY set:", !!process.env.GEMINI_API_KEY);
    console.log("Key prefix:", (process.env.OPENAI_API_KEY ?? process.env.GEMINI_API_KEY)?.substring(0, 8));

    try {
        const start = Date.now();
        const embedding = await generateEmbedding(testText);
        const elapsed = Date.now() - start;

        return NextResponse.json({
            success: embedding.length > 0,
            dimensions: embedding.length,
            elapsed_ms: elapsed,
            sample: embedding.slice(0, 5),
            text: testText,
            env: {
                OPENAI_API_KEY_set: !!process.env.OPENAI_API_KEY,
                GEMINI_API_KEY_set: !!process.env.GEMINI_API_KEY,
                key_prefix: (process.env.OPENAI_API_KEY ?? process.env.GEMINI_API_KEY)?.substring(0, 8),
            },
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            env: {
                OPENAI_API_KEY_set: !!process.env.OPENAI_API_KEY,
                GEMINI_API_KEY_set: !!process.env.GEMINI_API_KEY,
            },
        }, { status: 500 });
    }
}
