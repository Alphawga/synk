import { NextResponse } from "next/server";
import { auth } from "~/server/auth";

/**
 * API Route: Generate extension token
 * GET /api/auth/extension-token
 * 
 * Redirects to /auth/extension-callback with token in URL hash
 */
export async function GET() {
    const session = await auth();
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    if (!session?.user) {
        // Not logged in, redirect to sign in first
        return NextResponse.redirect(
            new URL("/auth/signin?callbackUrl=/api/auth/extension-token", baseUrl)
        );
    }

    // Generate token for extension
    const token = Buffer.from(
        JSON.stringify({
            userId: session.user.id,
            email: session.user.email,
            exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        })
    ).toString("base64");

    const user = encodeURIComponent(JSON.stringify({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
    }));

    // Redirect to callback page with token in hash
    const callbackUrl = new URL("/auth/extension-callback", baseUrl);
    callbackUrl.hash = `token=${token}&user=${user}`;

    return NextResponse.redirect(callbackUrl.toString());
}
