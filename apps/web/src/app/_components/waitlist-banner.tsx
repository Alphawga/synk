"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function WaitlistBanner() {
    const searchParams = useSearchParams();
    const joined = searchParams.get("joined");
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (joined === "true") {
            setVisible(true);
            // Auto-dismiss after 10 seconds
            const timer = setTimeout(() => setVisible(false), 10000);
            return () => clearTimeout(timer);
        }
    }, [joined]);

    if (!visible) return null;

    return (
        <div className="fixed top-20 left-4 right-4 z-50 mx-auto max-w-lg animate-in slide-in-from-top fade-in duration-500 md:left-1/2 md:right-auto md:-translate-x-1/2">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-950/90 px-4 py-3 shadow-2xl shadow-emerald-900/20 backdrop-blur-lg md:px-6 md:py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 md:h-10 md:w-10">
                    <span className="text-lg md:text-xl">🎉</span>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-emerald-100 md:text-base">
                        You&apos;re on the list!
                    </p>
                    <p className="text-xs text-emerald-300/80 md:text-sm">
                        We&apos;ll email you when the Chrome extension is live.
                    </p>
                </div>
                <button
                    onClick={() => setVisible(false)}
                    className="shrink-0 rounded-full p-1 text-emerald-400 transition hover:bg-emerald-800/50 hover:text-emerald-200"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
