/**
 * AI Categorization using Gemini API directly.
 * Same pattern as embeddings.ts — no multi-provider abstraction.
 *
 * Uses gemini-2.0-flash with structured JSON output (responseSchema)
 * to reliably categorize saved content into PRD-defined categories.
 *
 * Docs: https://ai.google.dev/gemini-api/docs/structured-output
 */

const GEMINI_API_KEY = process.env.OPENAI_API_KEY ?? process.env.GEMINI_API_KEY;
const CATEGORIZATION_MODEL = "gemini-2.5-flash";

// PRD US-4.1 categories
const VALID_CATEGORIES = [
    "Technology", "Business", "Marketing", "Design", "Finance",
    "Health", "Productivity", "Learning", "Entertainment", "News",
    "Personal", "Other",
] as const;

export type CategoryName = (typeof VALID_CATEGORIES)[number];

export interface CategorizationResult {
    category: CategoryName;
    tags: string[];
    confidence: number;
}

interface GeminiGenerateResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{ text?: string }>;
        };
    }>;
    error?: { message: string; code: number };
}

/**
 * Categorize a batch of URLs/titles using Gemini's structured JSON output.
 * Returns one result per input, in order.
 */
export async function categorizeContent(
    items: Array<{ url: string; title: string; domain: string }>
): Promise<CategorizationResult[]> {
    if (!GEMINI_API_KEY) {
        console.warn("[CATEGORIZE] No API key. Skipping.");
        return [];
    }

    if (items.length === 0) return [];

    console.log(`[CATEGORIZE] Categorizing ${items.length} items via Gemini...`);

    const prompt = `You are categorizing saved web pages. For each page, assign:
1. category: exactly ONE from [${VALID_CATEGORIES.join(", ")}]
2. tags: 2-4 lowercase descriptive tags
3. confidence: 0.0 to 1.0

Pages to categorize:
${items.map((item, i) => `${i + 1}. "${item.title}" (${item.domain})`).join("\n")}

Return a JSON array with one object per page, in the same order.`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${CATEGORIZATION_MODEL}:generateContent`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": GEMINI_API_KEY,
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    category: {
                                        type: "STRING",
                                        enum: [...VALID_CATEGORIES],
                                    },
                                    tags: {
                                        type: "ARRAY",
                                        items: { type: "STRING" },
                                    },
                                    confidence: {
                                        type: "NUMBER",
                                    },
                                },
                                required: ["category", "tags", "confidence"],
                            },
                        },
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[CATEGORIZE] ❌ API error ${response.status}: ${errorText}`);
            return [];
        }

        const data = (await response.json()) as GeminiGenerateResponse;

        if (data.error) {
            console.error(`[CATEGORIZE] ❌ Gemini error: ${data.error.message}`);
            return [];
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            console.error("[CATEGORIZE] ❌ Empty response from Gemini");
            return [];
        }

        console.log(`[CATEGORIZE] Raw response: ${text.slice(0, 300)}`);

        const results = JSON.parse(text) as CategorizationResult[];

        // Validate and log
        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            if (r) {
                console.log(`[CATEGORIZE] ✅ "${items[i]?.title}" → ${r.category} [${r.tags.join(", ")}]`);
            }
        }

        return results;
    } catch (error) {
        console.error("[CATEGORIZE] ❌ Failed:", error);
        return [];
    }
}
