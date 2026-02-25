"use client";

import Image from "next/image";
import { api } from "~/trpc/react";

export function SavesGrid() {
    const { data, isLoading } = api.saves.getAll.useQuery({ limit: 50 });
    const { data: count } = api.saves.getCount.useQuery();

    if (isLoading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-8 py-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-32 animate-pulse rounded-xl bg-bg-card"
                    />
                ))}
            </div>
        );
    }

    if (!data?.saves || data.saves.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-default bg-bg-card py-16 mx-8 mt-6">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bg-surface">
                    <span className="material-symbols-outlined text-3xl text-text-muted">
                        bookmark
                    </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-text-primary">
                    No saves yet
                </h3>
                <p className="mb-6 max-w-sm text-center text-sm text-text-secondary">
                    Install the Chrome extension and start saving tabs with one
                    click.
                </p>
                <a
                    href="#"
                    className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
                >
                    Get Chrome Extension
                </a>
            </div>
        );
    }

    return (
        <div className="px-8 py-6">
            <div className="mb-4 text-sm text-text-secondary">
                {count} saves total
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.saves.map((save) => (
                    <SaveCard key={save.id} save={save} />
                ))}
            </div>
        </div>
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
            className="group relative flex flex-col rounded-xl border border-border-default bg-bg-card p-4 transition hover:border-primary/30 hover:shadow-sm"
        >
            {/* Delete button */}
            <button
                onClick={handleDelete}
                className="absolute right-2 top-2 rounded-lg p-1.5 text-text-muted opacity-0 transition hover:bg-bg-surface hover:text-danger group-hover:opacity-100"
                title="Delete"
            >
                <span className="material-symbols-outlined text-[16px]">
                    delete
                </span>
            </button>

            {/* Favicon and domain */}
            <div className="mb-3 flex items-center gap-2">
                <Image
                    src={
                        save.favicon ??
                        `https://www.google.com/s2/favicons?domain=${save.domain}&sz=32`
                    }
                    alt=""
                    width={20}
                    height={20}
                    className="rounded"
                />
                <span className="truncate text-xs text-text-muted">
                    {save.domain}
                </span>
            </div>

            {/* Title */}
            <h3 className="mb-2 line-clamp-2 flex-1 text-sm font-medium text-text-primary">
                {save.title}
            </h3>

            {/* Footer */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">
                    {formatDate(save.createdAt)}
                </span>
                {save.category && (
                    <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                            backgroundColor: `${save.category.color ?? "#2b8cee"}20`,
                            color: save.category.color ?? "#2b8cee",
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
