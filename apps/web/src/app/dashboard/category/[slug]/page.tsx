"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import Image from "next/image";

export default function CategoryPage() {
    const params = useParams<{ slug: string }>();
    const router = useRouter();
    const slug = params.slug;

    const { data, isLoading } = api.categories.getSaves.useQuery({
        slug,
        limit: 50,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!data?.category) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-text-muted">
                <p className="text-lg">Category not found</p>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="mt-4 text-primary hover:underline"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="text-text-muted hover:text-text-primary text-sm mb-4 flex items-center gap-1 transition-colors"
                >
                    ← Back
                </button>
                <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                    <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: data.category.color ?? "#3b82f6" }}
                    />
                    {data.category.name}
                </h1>
                <p className="text-text-muted mt-1">
                    {data.saves.length} saved item{data.saves.length !== 1 ? "s" : ""}
                </p>
            </div>

            {/* Saves Grid */}
            {data.saves.length === 0 ? (
                <div className="text-center text-text-muted py-16">
                    No saves in this category yet
                </div>
            ) : (
                <div className="space-y-2">
                    {data.saves.map((save) => (
                        <a
                            key={save.id}
                            href={save.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 p-4 rounded-xl bg-bg-surface/50 border border-border-subtle hover:border-primary/30 hover:bg-bg-surface transition-all group"
                        >
                            {/* Favicon */}
                            <div className="w-8 h-8 rounded-lg bg-bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {save.favicon ? (
                                    <Image
                                        src={save.favicon}
                                        alt=""
                                        width={20}
                                        height={20}
                                        className="rounded"
                                        unoptimized
                                    />
                                ) : (
                                    <span className="text-xs text-text-muted">
                                        {save.domain?.charAt(0)?.toUpperCase() ?? "?"}
                                    </span>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                                    {save.title}
                                </h3>
                                <p className="text-xs text-text-muted truncate mt-0.5">
                                    {save.domain}
                                </p>
                            </div>

                            {/* Tags */}
                            <div className="flex gap-1.5 flex-shrink-0">
                                {save.tags?.slice(0, 3).map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                                    >
                                        {tag.name}
                                    </span>
                                ))}
                            </div>

                            {/* External link icon */}
                            <svg
                                className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                            </svg>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
