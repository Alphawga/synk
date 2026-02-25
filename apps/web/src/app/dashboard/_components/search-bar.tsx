"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";

export function SearchBar() {
    const router = useRouter();
    const [query, setQuery] = useState("");

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (query.trim()) {
                router.push(
                    `/dashboard/search?q=${encodeURIComponent(query.trim())}`
                );
            }
        },
        [query, router]
    );

    // ⌘K shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                document.getElementById("search-bar")?.focus();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    return (
        <form onSubmit={handleSearch} className="relative w-full">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-text-muted text-[20px]">
                    search
                </span>
            </span>
            <input
                id="search-bar"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="block w-full pl-11 pr-20 py-3 border-none rounded-full bg-bg-elevated text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm ring-1 ring-white/10"
                placeholder="Search saved tabs, X posts, and history..."
            />
            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center gap-0.5 rounded border border-border-default bg-bg-surface px-2 py-1 text-[10px] font-medium text-text-muted">
                ⌘K
            </kbd>
        </form>
    );
}
