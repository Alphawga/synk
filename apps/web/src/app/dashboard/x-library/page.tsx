"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import Image from "next/image";

export default function XLibraryPage() {
    const { data: xStatus, isLoading: statusLoading } =
        api.x.getStatus.useQuery();
    const { data: xSaves, isLoading: savesLoading } =
        api.saves.getAll.useQuery({
            limit: 50,
            source: "X_LIKE",
        } as { limit: number; source?: string });

    const utils = api.useUtils();
    const syncMutation = api.x.sync.useMutation({
        onSuccess: () => {
            void utils.saves.invalidate();
        },
    });

    const isLoading = statusLoading || savesLoading;

    return (
        <div className="flex flex-col h-full">
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-5xl mx-auto">
                    {/* Page Title */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold text-text-primary">
                                X Library
                            </h1>
                            {xStatus?.connected && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                    Connected
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {xStatus?.connected && (
                                <button
                                    onClick={() => syncMutation.mutate()}
                                    disabled={syncMutation.isPending}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
                                >
                                    <span
                                        className={`material-symbols-outlined text-lg ${syncMutation.isPending ? "animate-spin" : ""}`}
                                    >
                                        sync
                                    </span>
                                    {syncMutation.isPending
                                        ? "Syncing..."
                                        : "Sync Now"}
                                </button>
                            )}
                        </div>
                    </div>
                    {/* Not Connected State */}
                    {!statusLoading && !xStatus?.connected && (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-full max-w-4xl bg-bg-card border border-border-default rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
                                {/* Left Panel — Logo Visualization */}
                                <div className="md:w-5/12 bg-bg-elevated p-8 flex flex-col items-center justify-center border-r border-border-default relative">
                                    <div className="relative w-64 h-48 mb-6">
                                        {/* Synk Logo */}
                                        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-primary rounded-2xl flex items-center justify-center z-20">
                                            <span className="text-2xl font-bold text-white">S</span>
                                        </div>
                                        {/* Connection Line */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-[2px] border-t-2 border-dashed border-border-default" />
                                        {/* X Logo */}
                                        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-text-primary border border-border-default rounded-2xl flex items-center justify-center z-20">
                                            <svg aria-hidden="true" className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="text-center px-4">
                                        <h3 className="text-text-primary font-medium mb-2">Smart Syncing</h3>
                                        <p className="text-xs text-text-muted leading-relaxed">
                                            Synk automatically categorizes your bookmarks and threads, making them searchable with semantic AI.
                                        </p>
                                    </div>
                                </div>

                                {/* Right Panel — Connect CTA */}
                                <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center">
                                    <div className="mb-8">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            Recommended Integration
                                        </div>
                                        <h1 className="text-3xl font-bold text-text-primary mb-3">Connect X (Twitter)</h1>
                                        <p className="text-text-secondary text-sm leading-relaxed">
                                            Import your bookmarks and liked posts directly into your Synk library. Our AI will tag them by topic for easy retrieval.
                                        </p>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <FeatureBenefit
                                            title="Import Bookmarks"
                                            description="Automatically sync all your existing bookmarks."
                                        />
                                        <FeatureBenefit
                                            title="Auto-Tagging"
                                            description="AI analysis to categorize content by topic."
                                        />
                                        <FeatureBenefit
                                            title="Private & Secure"
                                            description="Read-only access. Your data is encrypted."
                                        />
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <Link
                                            href="/api/auth/signin"
                                            className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 group"
                                        >
                                            <span>Authorize Integration</span>
                                            <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                                                arrow_forward
                                            </span>
                                        </Link>
                                        <Link
                                            href="/dashboard"
                                            className="w-full py-3.5 px-4 bg-transparent hover:bg-bg-surface text-text-muted hover:text-text-primary font-medium rounded-xl transition-colors text-sm text-center"
                                        >
                                            Skip for now
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {isLoading && (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-36 animate-pulse rounded-xl bg-bg-card"
                                />
                            ))}
                        </div>
                    )}

                    {/* X Saves Grid */}
                    {xStatus?.connected &&
                        !savesLoading &&
                        xSaves?.saves &&
                        xSaves.saves.length > 0 && (
                            <>
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="material-symbols-outlined text-primary">
                                        auto_awesome
                                    </span>
                                    <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                                        Your X Saves ({xSaves.saves.length})
                                    </h2>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {xSaves.saves.map((save) => (
                                        <XSaveCard
                                            key={save.id}
                                            save={save}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                    {/* Empty State (connected but no saves) */}
                    {xStatus?.connected &&
                        !savesLoading &&
                        (!xSaves?.saves || xSaves.saves.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <span className="material-symbols-outlined text-5xl text-text-muted/50 mb-4">
                                    bookmark_border
                                </span>
                                <h2 className="text-lg font-semibold text-text-primary mb-2">
                                    No X saves yet
                                </h2>
                                <p className="text-text-secondary max-w-md mb-6">
                                    Click &quot;Sync Now&quot; to import your X
                                    likes and bookmarks.
                                </p>
                                <button
                                    onClick={() => syncMutation.mutate()}
                                    disabled={syncMutation.isPending}
                                    className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
                                >
                                    Start First Sync
                                </button>
                            </div>
                        )}
                </div>
            </div>
        </div >
    );
}

interface XSaveCardProps {
    save: {
        id: string;
        url: string;
        title: string;
        favicon: string | null;
        domain: string | null;
        createdAt: Date;
    };
}

function XSaveCard({ save }: XSaveCardProps) {
    return (
        <a
            href={save.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col p-5 bg-bg-card hover:bg-bg-elevated rounded-xl border border-border-default hover:border-primary/30 transition-all"
        >
            <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center">
                    {save.favicon ? (
                        <Image
                            src={save.favicon}
                            alt=""
                            width={16}
                            height={16}
                            className="rounded"
                        />
                    ) : (
                        <svg
                            className="w-3 h-3 text-text-muted"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                    )}
                </div>
                <span className="text-xs text-text-muted truncate">
                    {save.domain}
                </span>
            </div>
            <h3 className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors line-clamp-2 flex-1">
                {save.title}
            </h3>
            <div className="mt-3 pt-3 border-t border-border-default flex items-center justify-between">
                <span className="text-xs text-text-muted">
                    {formatRelativeDate(save.createdAt)}
                </span>
                <span className="material-symbols-outlined text-sm text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    open_in_new
                </span>
            </div>
        </a>
    );
}

function formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
}

function FeatureBenefit({ title, description }: { title: string; description: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5 shrink-0">
                <span className="material-symbols-outlined text-emerald-400 text-[14px]">check</span>
            </div>
            <div>
                <h4 className="text-sm font-medium text-text-primary">{title}</h4>
                <p className="text-xs text-text-muted">{description}</p>
            </div>
        </div>
    );
}
