"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Declare chrome types for the extension callback page
declare const chrome: {
    storage?: {
        local: {
            set: (items: Record<string, unknown>, callback?: () => void) => void;
        };
    };
} | undefined;

interface User {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
}

/**
 * Extension Auth Callback - Client Component
 * 
 * This page receives the token from server and stores it for the extension.
 */
export default function ExtensionCallbackPage() {
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        // Check for token in URL hash (set by server redirect)
        const hash = window.location.hash;
        if (hash.startsWith("#token=")) {
            const params = new URLSearchParams(hash.slice(1));
            const token = params.get("token");
            const userJson = params.get("user");

            if (token && userJson) {
                try {
                    const user = JSON.parse(decodeURIComponent(userJson)) as User;

                    // Store in chrome.storage.local if available
                    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
                    if (typeof chrome !== "undefined" && chrome?.storage?.local) {
                        chrome.storage.local.set({ token, user }, () => {
                            setStatus("success");
                            setMessage(`Signed in as ${user.email}`);

                            // Auto-close after delay
                            setTimeout(() => window.close(), 2000);
                        });
                    } else {
                        // Fallback: store in localStorage for debugging
                        localStorage.setItem("synk_token", token);
                        localStorage.setItem("synk_user", JSON.stringify(user));
                        setStatus("success");
                        setMessage(`Signed in as ${user.email}`);
                    }
                } catch {
                    setStatus("error");
                    setMessage("Failed to parse auth data");
                }
            } else {
                setStatus("error");
                setMessage("Missing auth data in URL");
            }
        } else {
            setStatus("error");
            setMessage("No auth data found. Please sign in again.");
        }
    }, []);

    return (
        <main className="flex min-h-screen items-center justify-center bg-bg-base">
            <div className="w-full max-w-md rounded-2xl border border-border-default bg-bg-card p-8 text-center shadow-sm">
                {/* Logo */}
                <div className="mb-6 flex items-center justify-center gap-2 text-2xl font-bold text-text-primary">
                    <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    Synk
                </div>

                {status === "loading" && (
                    <>
                        <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary/10">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                        <h1 className="mb-2 text-xl font-semibold text-text-primary">Connecting...</h1>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-success/10">
                            <svg className="h-8 w-8 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h1 className="mb-2 text-xl font-semibold text-text-primary">Connected!</h1>
                        <p className="mb-4 text-sm text-text-secondary">{message}</p>
                        <p className="text-sm text-text-muted">You can close this tab and reopen the extension.</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-danger/10">
                            <svg className="h-8 w-8 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </div>
                        <h1 className="mb-2 text-xl font-semibold text-text-primary">Connection Failed</h1>
                        <p className="mb-4 text-sm text-text-secondary">{message}</p>


                        <Link
                            href="/api/auth/extension-token"
                            className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                        >
                            Try Again
                        </Link>
                    </>
                )}
            </div>
        </main>
    );
}
