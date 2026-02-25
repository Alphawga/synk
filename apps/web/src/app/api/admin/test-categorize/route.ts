import { NextResponse } from "next/server";
import { categorizeContent } from "~/server/ai/categorization";

/**
 * GET /api/admin/test-categorize
 * Quick test to verify Gemini categorization API works.
 * No auth required — just a diagnostic endpoint.
 */
export async function GET() {
    console.log("\n[TEST-CAT] ══════════════════════════════════");
    console.log("[TEST-CAT] Testing Gemini categorization API...");

    const testItems = [
        { url: "https://youtube.com/watch?v=abc", title: "Build and Deploy an AI React App", domain: "youtube.com" },
        { url: "https://biblegateway.com/passage", title: "Romans 5:12-21 NLT", domain: "biblegateway.com" },
        { url: "https://notebooklm.google.com", title: "MVP Product Roadmap - NotebookLM", domain: "notebooklm.google.com" },
    ];

    console.log("[TEST-CAT] Test items:", testItems.map(i => i.title));

    try {
        const results = await categorizeContent(testItems);

        console.log("[TEST-CAT] ✅ Results:", JSON.stringify(results, null, 2));
        console.log("[TEST-CAT] ══════════════════════════════════\n");

        return NextResponse.json({
            success: true,
            testItems: testItems.map(i => i.title),
            results,
        });
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error("[TEST-CAT] ❌ FAILED:", errMsg);
        console.log("[TEST-CAT] ══════════════════════════════════\n");

        return NextResponse.json({
            success: false,
            error: errMsg,
        }, { status: 500 });
    }
}
