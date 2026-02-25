import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

/**
 * Extension API: Get recent saves
 * GET /api/extension/recent?limit=5
 * Uses cookie-based session auth (same as /api/extension/save)
 */
export async function GET(request: NextRequest) {
    try {
        // Use the same cookie-based auth as the save endpoint
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get limit from query params
        const url = new URL(request.url);
        const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "5"), 10);

        // Get recent saves
        const saves = await db.save.findMany({
            where: {
                userId: session.user.id,
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
