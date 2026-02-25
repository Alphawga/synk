"use client";

import { usePathname } from "next/navigation";

export function TopBar() {
    const pathname = usePathname();
    const isSearchPage = pathname.startsWith("/dashboard/search");

    // Don't render topbar on search page — the search page has its own header
    if (isSearchPage) return null;

    return (
        <header className="flex items-center justify-end px-6 py-3 shrink-0 bg-bg-base">
            <div className="flex items-center gap-3">
                {/* Sync Status Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-card border border-border-default">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Sync Active
                    </span>
                </div>
                {/* User Avatar */}

            </div>
        </header>
    );
}
