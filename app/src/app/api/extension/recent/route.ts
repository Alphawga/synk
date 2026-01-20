import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";

/**
 * Extension API: Get recent saves
 * GET /api/extension/recent?limit=5
 */
export async function GET(request: NextRequest) {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.slice(7);

        // Decode the token
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

        // Get limit from query params
        const url = new URL(request.url);
        const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "5"), 10);

        // Get recent saves
        const saves = await db.save.findMany({
            where: {
                userId: tokenData.userId,
                deletedAt: null,
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: {
                id: true,
                url: true,
                title: true,
                favicon: true,
                domain: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ saves });
    } catch (error) {
        console.error("Extension recent error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
