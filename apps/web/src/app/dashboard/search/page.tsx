"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "~/trpc/react";

type SourceFilter = "all" | "BROWSER" | "X_LIKE" | "X_BOOKMARK";

/* ─── Suggested queries — shown when no query entered ──── */
const SUGGESTED_QUERIES = [
    "React hooks performance tips",
    "Startup funding threads Q3",
    "LLM architecture papers",
    "UX dark mode patterns",
];

export default function SearchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams.get("q") ?? "";

    const [query, setQuery] = useState(initialQuery);
    const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
    const [recentSearches, setRecentSearches] = useState<
        { term: string; time: string }[]
    >([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load recent searches from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem("synk_recent_searches");
            if (stored) setRecentSearches(JSON.parse(stored) as { term: string; time: string }[]);
        } catch {
            /* ignore */
        }
    }, []);

    // Sync from URL param on navigation
    useEffect(() => {
        const q = searchParams.get("q") ?? "";
        if (q && q !== query) {
            setQuery(q);
            setDebouncedQuery(q);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Debounce
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Auto-focus
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Save to recent searches on search
    const saveRecent = useCallback(
        (term: string) => {
            const now = new Date();
            const entry = {
                term,
                time: formatTimeAgo(now),
            };
            const updated = [
                entry,
                ...recentSearches.filter((r) => r.term !== term),
            ].slice(0, 5);
            setRecentSearches(updated);
            localStorage.setItem(
                "synk_recent_searches",
                JSON.stringify(updated)
            );
        },
        [recentSearches]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            saveRecent(query.trim());
            router.push(
                `/dashboard/search?q=${encodeURIComponent(query.trim())}`
            );
        }
    };

    const handleSuggestionClick = (term: string) => {
        setQuery(term);
        setDebouncedQuery(term);
        saveRecent(term);
        router.push(`/dashboard/search?q=${encodeURIComponent(term)}`);
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem("synk_recent_searches");
    };

    const { data: results, isLoading } = api.saves.search.useQuery(
        { query: debouncedQuery, limit: 30 },
        { enabled: debouncedQuery.length > 0 }
    );

    // Group results by source
    const browserResults =
        results?.filter(
            (r: SearchResult) =>
                !r.source || r.source === "BROWSER"
        ) ?? [];
    const xResults =
        results?.filter(
            (r: SearchResult) =>
                r.source === "X_LIKE" || r.source === "X_BOOKMARK"
        ) ?? [];

    const filteredResults =
        sourceFilter === "all"
            ? results
            : results?.filter(
                (r: SearchResult) => r.source === sourceFilter
            );

    const allResults = filteredResults ?? [];

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!debouncedQuery || !allResults.length) return;
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((p) =>
                    p < allResults.length - 1 ? p + 1 : 0
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((p) =>
                    p > 0 ? p - 1 : allResults.length - 1
                );
            } else if (e.key === "Enter" && selectedIndex >= 0) {
                e.preventDefault();
                const selected = allResults[selectedIndex];
                if (selected)
                    window.open(selected.url, "_blank", "noopener,noreferrer");
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [debouncedQuery, allResults, selectedIndex]);

    const filters: { label: string; value: SourceFilter; icon: string }[] = [
        { label: "All Results", value: "all", icon: "grid_view" },
        { label: "Browser", value: "BROWSER", icon: "public" },
        { label: "X Content", value: "X_LIKE", icon: "tag" },
        { label: "Bookmarks", value: "X_BOOKMARK", icon: "bookmark" },
    ];

    const hasResults = debouncedQuery && allResults.length > 0;
    const showEmptyState = !debouncedQuery;
    const showNoResults =
        debouncedQuery && !isLoading && allResults.length === 0;

    return (
        <div className="w-full flex flex-col h-full">
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto w-full">
                <div className="max-w-3xl mx-auto px-4 py-6">
                    {/* Hero / Title */}
                    <div
                        className={`flex flex-col items-center text-center transition-all duration-300 ${debouncedQuery ? "mb-4" : "mb-8 pt-8"
                            }`}
                    >
                        <div
                            className={`transition-all duration-300 ${debouncedQuery ? "scale-75 opacity-60" : ""}`}
                        >
                            <span className="material-symbols-outlined text-5xl text-primary mb-2 block">
                                saved_search
                            </span>
                            <h1 className="text-2xl font-bold text-text-primary">
                                Semantic Search
                            </h1>
                            {!debouncedQuery && (
                                <p className="text-sm text-text-secondary mt-2 max-w-md">
                                    Search across all your saved tabs, X likes,
                                    and bookmarks using AI-powered semantic
                                    matching.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Search Box */}
                    <form
                        onSubmit={handleSubmit}
                        className="relative mb-5"
                    >
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-xl text-text-muted">
                                    search
                                </span>
                            </span>
                            <input
                                id="search-page-input"
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setSelectedIndex(-1);
                                }}
                                placeholder="Search your library..."
                                className="block w-full pl-11 pr-16 py-3.5 bg-bg-card border-2 border-primary/60 rounded-xl text-base text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-all"
                            />
                            {query ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuery("");
                                        inputRef.current?.focus();
                                    }}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-text-secondary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        close
                                    </span>
                                </button>
                            ) : (
                                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex flex-col items-center rounded border border-border-default bg-bg-surface px-1.5 py-0.5 text-[9px] font-medium text-text-muted leading-tight">
                                    <span>⌘</span>
                                    <span>K</span>
                                </kbd>
                            )}
                        </div>
                    </form>

                    {/* Source Filters */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {filters.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setSourceFilter(f.value)}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${sourceFilter === f.value
                                    ? "bg-primary text-white"
                                    : "bg-bg-card border border-border-default text-text-secondary hover:border-primary/40 hover:text-primary"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">
                                    {f.icon}
                                </span>
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* ─── Empty State: Suggested Queries + Recent ─── */}
                    {showEmptyState && (
                        <div className="space-y-6">
                            {/* Suggested Queries */}
                            <div>
                                <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest text-center mb-3">
                                    Suggested Queries
                                </h3>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {SUGGESTED_QUERIES.map((sq) => (
                                        <button
                                            key={sq}
                                            onClick={() =>
                                                handleSuggestionClick(sq)
                                            }
                                            className="px-3 py-1.5 rounded-lg bg-bg-card border border-border-default text-xs text-text-secondary hover:border-primary/40 hover:text-primary transition-all"
                                        >
                                            {sq}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Searches */}
                            {recentSearches.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-center gap-4 mb-3">
                                        <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
                                            Recent Searches
                                        </h3>
                                        <button
                                            onClick={clearRecentSearches}
                                            className="text-[11px] text-primary hover:text-primary/80 transition-colors"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                    <div className="bg-bg-card rounded-xl border border-border-default divide-y divide-border-default overflow-hidden">
                                        {recentSearches.map((rs, i) => (
                                            <button
                                                key={i}
                                                onClick={() =>
                                                    handleSuggestionClick(
                                                        rs.term
                                                    )
                                                }
                                                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-bg-elevated transition-colors text-left"
                                            >
                                                <span className="material-symbols-outlined text-base text-text-muted">
                                                    history
                                                </span>
                                                <span className="flex-1 text-sm text-text-secondary">
                                                    {rs.term}
                                                </span>
                                                <span className="text-[11px] text-text-muted">
                                                    {rs.time}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── Loading ─── */}
                    {isLoading && debouncedQuery && (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-16 animate-pulse rounded-xl bg-bg-card"
                                />
                            ))}
                        </div>
                    )}

                    {/* ─── Results (grouped by source) ─── */}
                    {hasResults && sourceFilter === "all" && (
                        <div className="space-y-5">
                            {browserResults.length > 0 && (
                                <ResultGroup
                                    title="Browser Tabs"
                                    count={browserResults.length}
                                    results={browserResults}
                                    query={debouncedQuery}
                                    selectedIndex={selectedIndex}
                                    baseIndex={0}
                                />
                            )}
                            {xResults.length > 0 && (
                                <ResultGroup
                                    title="X Content"
                                    count={xResults.length}
                                    results={xResults}
                                    query={debouncedQuery}
                                    selectedIndex={selectedIndex}
                                    baseIndex={browserResults.length}
                                />
                            )}
                        </div>
                    )}

                    {/* Results (filtered — flat list) */}
                    {hasResults && sourceFilter !== "all" && (
                        <div className="bg-bg-card rounded-xl border border-border-default divide-y divide-border-default overflow-hidden">
                            {allResults.map((save, i) => (
                                <ResultRow
                                    key={save.id}
                                    save={save}
                                    query={debouncedQuery}
                                    isSelected={selectedIndex === i}
                                />
                            ))}
                        </div>
                    )}

                    {/* ─── No Results ─── */}
                    {showNoResults && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <span className="material-symbols-outlined text-5xl text-text-muted/50 mb-4">
                                search_off
                            </span>
                            <h2 className="text-lg font-semibold text-text-primary mb-2">
                                No results found
                            </h2>
                            <p className="text-sm text-text-secondary">
                                Try a different search term or adjust your
                                filters.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Footer Bar (when results are shown) ─── */}
            {hasResults && (
                <footer className="flex-shrink-0 flex items-center justify-between px-8 py-2.5 border-t border-border-default bg-bg-base text-[11px] text-text-muted">
                    <span>
                        {allResults.length} result
                        {allResults.length !== 1 ? "s" : ""} found
                    </span>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            Navigate
                            <kbd className="px-1 py-0.5 rounded border border-border-default bg-bg-surface text-[9px] font-medium">
                                ↑
                            </kbd>
                            <kbd className="px-1 py-0.5 rounded border border-border-default bg-bg-surface text-[9px] font-medium">
                                ↓
                            </kbd>
                        </span>
                        <span className="flex items-center gap-1.5">
                            Open
                            <kbd className="px-1 py-0.5 rounded border border-border-default bg-bg-surface text-[9px] font-medium">
                                ↵
                            </kbd>
                        </span>
                    </div>
                </footer>
            )}
        </div>
    );
}

/* ─── Types ────────────────────────────────────────────── */
interface SearchResult {
    id: string;
    url: string;
    title: string;
    favicon: string | null;
    domain: string | null;
    source?: string;
    category?: { name: string; color: string | null } | null;
    createdAt?: Date;
    similarity?: number;
    matchType?: "semantic" | "keyword";
}

/* ─── Result Group ─────────────────────────────────────── */
function ResultGroup({
    title,
    count,
    results,
    query,
    selectedIndex,
    baseIndex,
}: {
    title: string;
    count: number;
    results: SearchResult[];
    query: string;
    selectedIndex: number;
    baseIndex: number;
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
                    {title}
                </h3>
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
                    {count} Match{count !== 1 ? "es" : ""}
                </span>
            </div>
            <div className="bg-bg-card rounded-xl border border-border-default divide-y divide-border-default overflow-hidden">
                {results.map((save, i) => (
                    <ResultRow
                        key={save.id}
                        save={save}
                        query={query}
                        isSelected={selectedIndex === baseIndex + i}
                    />
                ))}
            </div>
        </div>
    );
}

/* ─── Result Row ───────────────────────────────────────── */
function ResultRow({
    save,
    query,
    isSelected,
}: {
    save: SearchResult;
    query: string;
    isSelected: boolean;
}) {
    const isX = save.source === "X_LIKE" || save.source === "X_BOOKMARK";

    // PRD US-5.4: keyword matches ranked higher, semantic labeled "Related to your search"
    const matchLabel =
        save.matchType === "keyword"
            ? "Exact Match"
            : "Related to your search";
    const matchColor =
        save.matchType === "keyword"
            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
            : "bg-blue-500/15 text-blue-400 border-blue-500/30";

    const timeAgo = save.createdAt
        ? formatTimeAgo(new Date(save.createdAt))
        : null;

    return (
        <a
            href={save.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex items-center gap-3 px-4 py-3 hover:bg-bg-elevated transition-colors ${isSelected ? "bg-bg-elevated" : ""
                }`}
        >
            {/* Icon */}
            <div className="flex-shrink-0">
                {save.favicon ? (
                    <Image
                        src={save.favicon}
                        alt=""
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded"
                    />
                ) : (
                    <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xs text-primary">
                            {isX ? "tag" : "public"}
                        </span>
                    </div>
                )}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                    {highlightMatch(save.title, query)}
                </p>
                <p className="text-[11px] text-text-muted truncate mt-0.5">
                    {save.domain}
                    {timeAgo && ` • ${timeAgo}`}
                </p>
            </div>
            {/* Match Badge */}
            <span
                className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold border ${matchColor}`}
            >
                {matchLabel}
            </span>
        </a>
    );
}

/* ─── Utilities ────────────────────────────────────────── */
function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
        regex.test(part) ? (
            <span
                key={i}
                className="text-primary bg-primary/10 px-0.5 rounded"
            >
                {part}
            </span>
        ) : (
            part
        )
    );
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "1d ago";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
}
