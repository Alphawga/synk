"use client";

import { useState } from "react";
import Image from "next/image";
import { api } from "~/trpc/react";

export default function TrashPage() {
    const [view, setView] = useState<"date" | "group">("group");

    // Query for deleted saves (soft deleted)
    const { data: deletedSaves, isLoading } = api.saves.getAll.useQuery({
        limit: 100,
        includeDeleted: true,
    } as { limit: number; includeDeleted?: boolean });

    const utils = api.useUtils();

    const restoreMutation = api.saves.restore.useMutation({
        onSuccess: () => {
            void utils.saves.invalidate();
        },
    });

    const permanentDeleteMutation = api.saves.permanentDelete.useMutation({
        onSuccess: () => {
            void utils.saves.invalidate();
        },
    });

    return (
        <div className="flex flex-col h-full">
            {/* Content */}
            <div className="px-4 py-6">
                <div className="p-8">
                    {/* Page Title */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold text-text-primary">
                                Trash
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-border-default text-sm font-medium text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors">
                                <span className="material-symbols-outlined text-lg">
                                    restore
                                </span>
                                Restore All
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-danger text-white text-sm font-medium hover:bg-danger/90 transition-all shadow-lg shadow-danger/20">
                                <span className="material-symbols-outlined text-lg">
                                    delete_forever
                                </span>
                                Empty Trash
                            </button>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center justify-end mb-8">
                        <div className="bg-bg-card p-1 rounded-lg flex text-sm border border-border-default">
                            <button
                                onClick={() => setView("date")}
                                className={`px-3 py-1.5 rounded-md transition-colors ${view === "date"
                                    ? "bg-bg-elevated text-text-primary shadow-sm font-medium"
                                    : "text-text-muted hover:text-text-secondary"
                                    }`}
                            >
                                By Date
                            </button>
                            <button
                                onClick={() => setView("group")}
                                className={`px-3 py-1.5 rounded-md transition-colors ${view === "group"
                                    ? "bg-bg-elevated text-text-primary shadow-sm font-medium"
                                    : "text-text-muted hover:text-text-secondary"
                                    }`}
                            >
                                By Group
                            </button>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-bg-card border border-border-default text-text-secondary">
                        <span className="material-symbols-outlined text-lg mt-0.5 text-text-muted">
                            info
                        </span>
                        <div className="text-sm leading-relaxed">
                            Items in trash are permanently deleted after{" "}
                            <strong className="text-text-primary">
                                30 days
                            </strong>
                            . You can restore items before they&apos;re
                            permanently removed.
                        </div>
                    </div>

                    {/* Loading */}
                    {isLoading && (
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-32 animate-pulse rounded-xl bg-bg-card"
                                />
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading &&
                        (!deletedSaves?.saves ||
                            deletedSaves.saves.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-20 h-20 rounded-full bg-bg-card flex items-center justify-center mb-6">
                                    <span className="material-symbols-outlined text-4xl text-text-muted">
                                        delete_sweep
                                    </span>
                                </div>
                                <h2 className="text-xl font-semibold text-text-primary mb-2">
                                    Trash is empty
                                </h2>
                                <p className="text-text-secondary max-w-md">
                                    Items you delete will appear here. They will
                                    be permanently removed after 30 days.
                                </p>
                            </div>
                        )}

                    {/* Deleted Items */}
                    {deletedSaves?.saves && deletedSaves.saves.length > 0 && (
                        <div className="space-y-4">
                            {deletedSaves.saves.map((save) => (
                                <TrashItemCard
                                    key={save.id}
                                    save={save}
                                    onRestore={() =>
                                        restoreMutation.mutate({
                                            id: save.id,
                                        })
                                    }
                                    onDelete={() =>
                                        permanentDeleteMutation.mutate({
                                            id: save.id,
                                        })
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface TrashItemProps {
    save: {
        id: string;
        url: string;
        title: string;
        favicon: string | null;
        domain: string | null;
        createdAt: Date;
    };
    onRestore: () => void;
    onDelete: () => void;
}

function TrashItemCard({ save, onRestore, onDelete }: TrashItemProps) {
    return (
        <div className="group flex items-start gap-4 p-5 bg-bg-card hover:bg-bg-elevated rounded-xl border border-border-default transition-colors">
            <div className="w-10 h-10 rounded-lg bg-bg-surface flex items-center justify-center flex-shrink-0">
                {save.favicon ? (
                    <Image
                        src={save.favicon}
                        alt=""
                        width={20}
                        height={20}
                        className="rounded"
                    />
                ) : (
                    <span className="material-symbols-outlined text-text-muted">
                        public
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-text-primary truncate">
                    {save.title}
                </h4>
                <p className="text-xs text-text-muted truncate mt-0.5">
                    {save.domain ?? save.url}
                </p>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onRestore}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                    Restore
                </button>
                <button
                    onClick={onDelete}
                    className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                    title="Delete permanently"
                >
                    <span className="material-symbols-outlined text-lg">
                        delete_forever
                    </span>
                </button>
            </div>
        </div>
    );
}
