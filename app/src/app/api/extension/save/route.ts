import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";

/**
 * Extension API: Save tabs
 * POST /api/extension/save
 */
export async function POST(request: NextRequest) {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.slice(7);

        // Decode the token (simple base64 for dev mode)
        let tokenData: { userId: string; exp: number };
        try {
            tokenData = JSON.parse(Buffer.from(token, "base64").toString());
        } catch {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Check if token is expired
        if (tokenData.exp < Date.now()) {
            return NextResponse.json({ error: "Token expired" }, { status: 401 });
        }

        // Verify user exists
        const user = await db.user.findUnique({
            where: { id: tokenData.userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const { tabs } = body as { tabs: Array<{ url: string; title: string; favicon?: string; domain?: string }> };

        if (!Array.isArray(tabs) || tabs.length === 0) {
            return NextResponse.json({ error: "No tabs provided" }, { status: 400 });
        }

        // Create saves
        const saves = await db.save.createManyAndReturn({
            data: tabs.map((tab) => ({
                url: tab.url,
                title: tab.title,
                favicon: tab.favicon ?? null,
                domain: tab.domain ?? new URL(tab.url).hostname,
                source: "BROWSER" as const,
                userId: user.id,
            })),
        });

        return NextResponse.json({ success: true, count: saves.length });
    } catch (error) {
        console.error("Extension save error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
