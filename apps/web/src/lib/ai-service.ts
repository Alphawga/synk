/**
 * Synk AI Service
 * 
 * Provider-agnostic AI integration supporting OpenAI, Gemini, and Claude.
 * Configure via environment variables:
 * - AI_PROVIDER: "openai" | "gemini" | "claude" (default: "openai")
 * - OPENAI_API_KEY: OpenAI API key
 * - GEMINI_API_KEY: Google Gemini API key  
 * - ANTHROPIC_API_KEY: Anthropic Claude API key
 */

export type AIProvider = "openai" | "gemini" | "claude";

export interface AIConfig {
    provider: AIProvider;
    apiKey: string;
    model?: string;
}

export interface CategorizeResult {
    tags: string[];
    category: string;
    confidence: number;
}

interface AIProviderClient {
    categorize(urls: Array<{ url: string; title: string; domain: string }>): Promise<CategorizeResult[]>;
    suggestSessionName(urls: Array<{ url: string; title: string }>): Promise<string>;
}

// Get AI configuration from environment
function getAIConfig(): AIConfig {
    const provider = (process.env.AI_PROVIDER ?? "openai") as AIProvider;

    const apiKeys: Record<AIProvider, string | undefined> = {
        openai: process.env.OPENAI_API_KEY,
        gemini: process.env.GEMINI_API_KEY ?? process.env.OPENAI_API_KEY,
        claude: process.env.ANTHROPIC_API_KEY,
    };

    const apiKey = apiKeys[provider];
    if (!apiKey) {
        throw new Error(`Missing API key for provider: ${provider}. Set ${provider.toUpperCase()}_API_KEY or ANTHROPIC_API_KEY for claude.`);
    }

    return { provider, apiKey };
}

// Default models per provider
const DEFAULT_MODELS: Record<AIProvider, string> = {
    openai: "gpt-4o-mini",
    gemini: "gemini-1.5-flash",
    claude: "claude-3-haiku-20240307",
};

// System prompt for categorization (PRD US-4.1 categories)
const CATEGORIZE_PROMPT = `You are an AI assistant that categorizes web pages based on their URLs and titles.

For each page, provide:
1. tags: 2-4 relevant tags (lowercase, e.g., "react", "performance", "javascript")
2. category: A single category from EXACTLY this list: Technology, Business, Marketing, Design, Finance, Health, Productivity, Learning, Entertainment, News, Personal, Other
3. confidence: A number 0-1 indicating how confident you are

Respond with a JSON object: { "results": [...] } matching the input order.`;

const SESSION_NAME_PROMPT = `Based on these URLs and titles, suggest a short, descriptive name for this tab session (max 4 words).
Just respond with the name, nothing else.`;

// OpenAI Provider Implementation
class OpenAIProvider implements AIProviderClient {
    constructor(private apiKey: string, private model: string = DEFAULT_MODELS.openai) { }

    async categorize(urls: Array<{ url: string; title: string; domain: string }>): Promise<CategorizeResult[]> {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: "system", content: CATEGORIZE_PROMPT },
                    { role: "user", content: JSON.stringify(urls) },
                ],
                response_format: { type: "json_object" },
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json() as { choices: Array<{ message: { content: string } }> };
        const result = JSON.parse(data.choices[0]?.message?.content ?? "[]") as { results?: CategorizeResult[] };
        return result.results ?? [];
    }

    async suggestSessionName(urls: Array<{ url: string; title: string }>): Promise<string> {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: "system", content: SESSION_NAME_PROMPT },
                    { role: "user", content: JSON.stringify(urls.slice(0, 10)) },
                ],
                max_tokens: 20,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json() as { choices: Array<{ message: { content: string } }> };
        return data.choices[0]?.message?.content?.trim() ?? "Untitled Session";
    }
}

// Gemini Provider Implementation
class GeminiProvider implements AIProviderClient {
    constructor(private apiKey: string, private model: string = DEFAULT_MODELS.gemini) { }

    async categorize(urls: Array<{ url: string; title: string; domain: string }>): Promise<CategorizeResult[]> {
        console.log(`[AI-CAT] Sending ${urls.length} URLs to Gemini for categorization...`);
        console.log(`[AI-CAT] Using model: ${this.model}`);

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${CATEGORIZE_PROMPT}\n\nPages to categorize:\n${JSON.stringify(urls, null, 2)}\n\nReturn a JSON object with a "results" key containing an array of categorizations in the same order as input.`,
                        }],
                    }],
                    generationConfig: {
                        responseMimeType: "application/json",
                    },
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[AI-CAT] ❌ Gemini API error: ${response.status} ${errText}`);
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
        const text = data.candidates[0]?.content?.parts[0]?.text ?? "[]";

        console.log(`[AI-CAT] Raw Gemini response: ${text.slice(0, 500)}`);

        // Parse — handle both { results: [...] } and plain array [...]
        const parsed = JSON.parse(text) as CategorizeResult[] | { results?: CategorizeResult[] };
        const results = Array.isArray(parsed)
            ? parsed
            : (parsed.results ?? []);

        console.log(`[AI-CAT] Parsed ${results.length} categorizations:`);
        for (const r of results) {
            console.log(`[AI-CAT]   → "${r.category}" [${r.tags?.join(", ")}] (${(r.confidence * 100).toFixed(0)}%)`);
        }

        return results;
    }

    async suggestSessionName(urls: Array<{ url: string; title: string }>): Promise<string> {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${SESSION_NAME_PROMPT}\n\nPages:\n${JSON.stringify(urls.slice(0, 10))}`,
                        }],
                    }],
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
        return data.candidates[0]?.content?.parts[0]?.text?.trim() ?? "Untitled Session";
    }
}

// Claude Provider Implementation
class ClaudeProvider implements AIProviderClient {
    constructor(private apiKey: string, private model: string = DEFAULT_MODELS.claude) { }

    async categorize(urls: Array<{ url: string; title: string; domain: string }>): Promise<CategorizeResult[]> {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": this.apiKey,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 1024,
                system: CATEGORIZE_PROMPT,
                messages: [
                    { role: "user", content: JSON.stringify(urls) },
                ],
            }),
        });

        if (!response.ok) {
            throw new Error(`Claude API error: ${response.statusText}`);
        }

        const data = await response.json() as { content: Array<{ text: string }> };
        const text = data.content[0]?.text ?? "[]";
        // Extract JSON from response (Claude may add text around it)
        const jsonRegex = /\[[\s\S]*\]/;
        const jsonMatch = jsonRegex.exec(text);
        if (!jsonMatch) return [];
        return JSON.parse(jsonMatch[0]) as CategorizeResult[];
    }

    async suggestSessionName(urls: Array<{ url: string; title: string }>): Promise<string> {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": this.apiKey,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 50,
                system: SESSION_NAME_PROMPT,
                messages: [
                    { role: "user", content: JSON.stringify(urls.slice(0, 10)) },
                ],
            }),
        });

        if (!response.ok) {
            throw new Error(`Claude API error: ${response.statusText}`);
        }

        const data = await response.json() as { content: Array<{ text: string }> };
        return data.content[0]?.text?.trim() ?? "Untitled Session";
    }
}

// Factory to create the appropriate AI provider client
function createAIClient(config?: AIConfig): AIProviderClient {
    const cfg = config ?? getAIConfig();

    switch (cfg.provider) {
        case "openai":
            return new OpenAIProvider(cfg.apiKey, cfg.model ?? DEFAULT_MODELS.openai);
        case "gemini":
            return new GeminiProvider(cfg.apiKey, cfg.model ?? DEFAULT_MODELS.gemini);
        case "claude":
            return new ClaudeProvider(cfg.apiKey, cfg.model ?? DEFAULT_MODELS.claude);
        default:
            throw new Error(`Unsupported AI provider: ${cfg.provider as string}`);
    }
}

// Singleton instance (lazy loaded)
let aiClient: AIProviderClient | null = null;

function getAIClient(): AIProviderClient {
    aiClient ??= createAIClient();
    return aiClient;
}

// Public API
export const aiService = {
    /**
     * Categorize a list of URLs with AI-generated tags and categories
     */
    async categorize(urls: Array<{ url: string; title: string; domain: string }>): Promise<CategorizeResult[]> {
        try {
            return await getAIClient().categorize(urls);
        } catch (error) {
            console.error("[AI-SERVICE] ❌ Categorization error:", error);
            // Re-throw so caller can handle — don't silently return "Other"
            throw error;
        }
    },

    /**
     * Generate a suggested name for a session based on its URLs
     */
    async suggestSessionName(urls: Array<{ url: string; title: string }>): Promise<string> {
        try {
            return await getAIClient().suggestSessionName(urls);
        } catch (error) {
            console.error("AI session name error:", error);
            return "Untitled Session";
        }
    },

    /**
     * Check if AI is configured and available
     */
    isConfigured(): boolean {
        try {
            getAIConfig();
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Get current AI provider info
     */
    getProviderInfo(): { provider: AIProvider; model: string } | null {
        try {
            const config = getAIConfig();
            return {
                provider: config.provider,
                model: config.model ?? DEFAULT_MODELS[config.provider],
            };
        } catch {
            return null;
        }
    },
};

export default aiService;
