"use client";

import Image from "next/image";
import { api } from "~/trpc/react";

/* ─── Color palette for group icons ──────────────────────────── */
const GROUP_COLORS = [
    { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/20" },
    { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/20" },
    { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/20" },
    { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/20" },
    { bg: "bg-pink-500/15", text: "text-pink-400", border: "border-pink-500/20" },
    { bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/20" },
];

const GROUP_ICONS = [
    "neurology", "science", "folder_open", "code", "design_services",
    "article", "work", "school", "sell", "analytics",
];

function getGroupStyle(index: number) {
    return GROUP_COLORS[index % GROUP_COLORS.length]!;
}

function getGroupIcon(index: number) {
    return GROUP_ICONS[index % GROUP_ICONS.length]!;
}

export default function TabGroupsPage() {
    const { data, isLoading } = api.sessions.getAll.useQuery({ limit: 50 });

    return (
        <div className="flex min-h-screen flex-col bg-bg-base">
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="space-y-6">
                    {/* Page Title */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold text-text-primary">
                                Tab Groups
                            </h1>
                            {data?.sessions && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                    {data.sessions.length}
                                </span>
                            )}
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors">
                            <span className="material-symbols-outlined text-lg">
                                sort
                            </span>
                            Recent
                        </button>
                    </div>
                    {/* Loading */}
                    {isLoading && (
                        <div className="space-y-6">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="animate-pulse rounded-xl bg-bg-card border border-border-default"
                                >
                                    <div className="h-16 rounded-t-xl bg-bg-elevated" />
                                    <div className="p-4 space-y-3">
                                        <div className="h-10 rounded-lg bg-bg-elevated" />
                                        <div className="h-10 rounded-lg bg-bg-elevated" />
                                        <div className="h-10 rounded-lg bg-bg-elevated" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading &&
                        (!data?.sessions || data.sessions.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-20 h-20 rounded-full bg-bg-card flex items-center justify-center mb-6 border border-border-default">
                                    <span className="material-symbols-outlined text-4xl text-text-muted">
                                        tab_group
                                    </span>
                                </div>
                                <h2 className="text-xl font-semibold text-text-primary mb-2">
                                    No tab groups yet
                                </h2>
                                <p className="text-text-secondary max-w-md">
                                    Save tab sessions from the Chrome extension
                                    to organize them into groups here.
                                </p>
                            </div>
                        )}

                    {/* Session Groups — flat card list (always expanded) */}
                    {data?.sessions?.map((session, index) => (
                        <SessionGroupCard
                            key={session.id}
                            session={session}
                            colorIndex={index}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─── Types ───────────────────────────────────────────────────── */
interface SessionData {
    id: string;
    name: string | null;
    createdAt: Date;
    saves: {
        id: string;
        url: string;
        title: string;
        favicon: string | null;
        domain: string | null;
        createdAt: Date;
    }[];
    _count: { saves: number };
}

/* ─── Session Group Card ──────────────────────────────────────── */
function SessionGroupCard({
    session,
    colorIndex,
}: {
    session: SessionData;
    colorIndex: number;
}) {
    const style = getGroupStyle(colorIndex);
    const icon = getGroupIcon(colorIndex);
    const tabCount = session._count.saves;

    const handleRestoreAll = () => {
        session.saves.forEach((tab) => {
            window.open(tab.url, "_blank", "noopener,noreferrer");
        });
    };

    const handleCopyLinks = async () => {
        const links = session.saves.map((t) => t.url).join("\n");
        await navigator.clipboard.writeText(links);
    };

    return (
        <div className="bg-bg-card rounded-xl border border-border-default overflow-hidden hover:border-primary/20 transition-all">
            {/* Group Header */}
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4 min-w-0">
                    <div
                        className={`w-10 h-10 rounded-lg ${style.bg} ${style.border} border flex items-center justify-center flex-shrink-0`}
                    >
                        <span
                            className={`material-symbols-outlined ${style.text}`}
                        >
                            {icon}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-text-primary truncate">
                            {session.name ?? "Untitled Session"}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                            {tabCount} tab{tabCount !== 1 ? "s" : ""} •{" "}
                            {formatRelativeDate(session.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRestoreAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">
                            open_in_new
                        </span>
                        Restore All
                    </button>
                    <button
                        onClick={() => void handleCopyLinks()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-bg-elevated transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">
                            content_copy
                        </span>
                        Copy Links
                    </button>
                </div>
            </div>

            {/* Tab List — always visible */}
            {session.saves.length > 0 && (
                <div className="border-t border-border-default divide-y divide-border-default">
                    {session.saves.map((tab) => (
                        <a
                            key={tab.id}
                            href={tab.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 px-6 py-3 hover:bg-bg-elevated transition-colors"
                        >
                            <Image
                                src={
                                    tab.favicon ??
                                    `https://www.google.com/s2/favicons?domain=${tab.domain}&sz=32`
                                }
                                alt=""
                                width={16}
                                height={16}
                                className="w-4 h-4 rounded flex-shrink-0"
                            />
                            <span className="text-sm text-text-secondary group-hover:text-primary truncate transition-colors flex-1">
                                {tab.title}
                            </span>
                            <span className="text-xs text-text-muted truncate max-w-[200px] hidden sm:block">
                                {tab.domain}
                            </span>
                            <span className="text-xs text-text-muted hidden sm:block">
                                {formatTime(tab.createdAt)}
                            </span>
                            <span className="material-symbols-outlined text-sm text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                open_in_new
                            </span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Utilities ───────────────────────────────────────────────── */
function formatRelativeDate(date: Date): string {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `Updated ${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return `Created ${d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    })}`;
}

function formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}
