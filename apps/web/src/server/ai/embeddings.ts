/**
 * Embedding generation using Gemini's gemini-embedding-001 model.
 * Outputs 768-dimensional vectors (configurable via EMBEDDING_DIMS).
 *
 * Uses task types for better quality:
 * - RETRIEVAL_DOCUMENT: when embedding saved content (tabs, bookmarks)
 * - RETRIEVAL_QUERY: when embedding a search query
 *
 * Docs: https://ai.google.dev/gemini-api/docs/embeddings
 */

const GEMINI_API_KEY = process.env.OPENAI_API_KEY ?? process.env.GEMINI_API_KEY;

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMS = 768;

type TaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" | "SEMANTIC_SIMILARITY";

interface GeminiEmbeddingResponse {
    embedding: {
        values: number[];
    };
}

/**
 * Build clean text for embedding generation.
 * Strips noise like tab counts `(1)`, pipe separators, and uses domain instead of full URL.
 * This dramatically improves semantic search quality.
 */
export function buildEmbeddingText(title: string, url: string): string {
    // Clean title: remove leading counts like "(1) " or "(42) "
    let cleanTitle = title.replace(/^\(\d+\)\s*/, "");

    // Remove common suffixes that add noise
    cleanTitle = cleanTitle
        .replace(/\s*[-|–—]\s*(YouTube|Twitter|X|Google Search|GitHub|Reddit)$/i, "")
        .trim();

    // Extract domain from URL (much cleaner than full URL with random IDs)
    let domain = "";
    try {
        domain = new URL(url).hostname.replace("www.", "");
    } catch {
        // ignore malformed URLs
    }

    // Combine: clean title + domain for context
    return `${cleanTitle} (${domain})`.trim();
}

export async function generateEmbedding(
    text: string,
    taskType: TaskType = "RETRIEVAL_DOCUMENT"
): Promise<number[]> {
    if (!GEMINI_API_KEY) {
        console.warn("No API key set (OPENAI_API_KEY / GEMINI_API_KEY). Skipping embedding.");
        return [];
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": GEMINI_API_KEY,
                },
                body: JSON.stringify({
                    model: `models/${EMBEDDING_MODEL}`,
                    content: {
                        parts: [{ text: text.replace(/\n/g, " ").slice(0, 2048) }],
                    },
                    taskType,
                    outputDimensionality: EMBEDDING_DIMS,
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini Embedding API Error: ${response.status} - ${errorText}`);
        }

        const data = (await response.json()) as GeminiEmbeddingResponse;

        if (!data.embedding?.values?.length) {
            throw new Error("Invalid response format from Gemini embedding API");
        }

        return data.embedding.values;
    } catch (error) {
        console.error("Failed to generate embedding:", error);
        return [];
    }
}
