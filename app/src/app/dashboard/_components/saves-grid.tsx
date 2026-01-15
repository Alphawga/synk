"use client";

import { api } from "~/trpc/react";

export function SavesGrid() {
    const { data, isLoading } = api.saves.getAll.useQuery({ limit: 50 });
    const { data: count } = api.saves.getCount.useQuery();

    if (isLoading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-32 animate-pulse rounded-xl bg-slate-200"
                    />
                ))}
            </div>
        );
    }

    if (!data?.saves || data.saves.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <svg
                        className="h-8 w-8 text-slate-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                    </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">No saves yet</h3>
                <p className="mb-6 max-w-sm text-center text-sm text-slate-500">
                    Install the Chrome extension and start saving tabs with one click.
                </p>
                <a
                    href="#"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                >
                    Get Chrome Extension
                </a>
            </div>
        );
    }

    return (
        <>
            <div className="mb-4 text-sm text-slate-500">
                {count} saves total
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.saves.map((save) => (
                    <SaveCard key={save.id} save={save} />
                ))}
            </div>
        </>
    );
}

interface SaveCardProps {
    save: {
        id: string;
        url: string;
        title: string;
        favicon: string | null;
        domain: string | null;
        createdAt: Date;
        category: { name: string; color: string | null } | null;
    };
}

function SaveCard({ save }: SaveCardProps) {
    const utils = api.useUtils();
    const deleteMutation = api.saves.delete.useMutation({
        onSuccess: () => {
            void utils.saves.getAll.invalidate();
            void utils.saves.getCount.invalidate();
        },
    });

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        deleteMutation.mutate({ id: save.id });
    };

    return (
        <a
            href={save.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md"
        >
            {/* Delete button */}
            <button
                onClick={handleDelete}
                className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-red-500 group-hover:opacity-100"
                title="Delete"
            >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
            </button>

            {/* Favicon and domain */}
            <div className="mb-3 flex items-center gap-2">
                <img
                    src={save.favicon ?? `https://www.google.com/s2/favicons?domain=${save.domain}&sz=32`}
                    alt=""
                    className="h-5 w-5 rounded"
                />
                <span className="truncate text-xs text-slate-500">{save.domain}</span>
            </div>

            {/* Title */}
            <h3 className="mb-2 line-clamp-2 flex-1 text-sm font-medium text-slate-900">
                {save.title}
            </h3>

            {/* Footer */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                    {formatDate(save.createdAt)}
                </span>
                {save.category && (
                    <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                            backgroundColor: save.category.color ?? '#e5e7eb',
                            color: '#374151',
                        }}
                    >
                        {save.category.name}
                    </span>
                )}
            </div>
        </a>
    );
}

function formatDate(date: Date): string {
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
