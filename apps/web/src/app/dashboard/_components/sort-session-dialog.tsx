"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useToast } from "./toast";

interface SortSessionDialogProps {
    sessionId: string;
    saves: { id: string; title: string; domain: string | null; createdAt: Date }[];
    onClose: () => void;
}

type SortOption = "title" | "domain" | "date";

export function SortSessionDialog({ sessionId, saves, onClose }: SortSessionDialogProps) {
    const [sortBy, setSortBy] = useState<SortOption>("title");
    const utils = api.useUtils();
    const { showToast } = useToast();

    const { mutate, isPending } = api.saves.reorder.useMutation({
        onSuccess: () => {
            void utils.sessions.getAll.invalidate();
            showToast(`Sorted by ${sortBy}`, "success");
            onClose();
        },
        onError: () => {
            showToast("Failed to sort tabs", "error");
        }
    });

    const handleSort = () => {
        const sorted = [...saves].sort((a, b) => {
            switch (sortBy) {
                case "title":
                    return a.title.localeCompare(b.title);
                case "domain":
                    return (a.domain ?? "").localeCompare(b.domain ?? "");
                case "date":
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                default:
                    return 0;
            }
        });

        const saveIds = sorted.map(s => s.id);
        mutate({ sessionId, saveIds });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-xl bg-bg-card p-6 shadow-2xl ring-1 ring-border-default animate-in zoom-in-95 duration-200">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Sort Tabs</h2>

                <div className="space-y-1 mb-6">
                    {[
                        { id: "title", label: "Alphabetical (A-Z)", icon: "sort_by_alpha" },
                        { id: "domain", label: "By Website Domain", icon: "language" },
                        { id: "date", label: "Date Added (Newest First)", icon: "calendar_today" },
                    ].map((option) => (
                        <button
                            key={option.id}
                            onClick={() => setSortBy(option.id as SortOption)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${sortBy === option.id
                                ? "bg-primary/10 text-primary"
                                : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[20px]">{option.icon}</span>
                                {option.label}
                            </div>
                            {sortBy === option.id && (
                                <span className="material-symbols-outlined text-[18px]">check</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSort}
                        disabled={isPending}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
                    >
                        Sort Tabs
                    </button>
                </div>
            </div>
        </div>
    );
}
