"use client";

import { api } from "~/trpc/react";

interface BulkActionsBarProps {
    selectedIds: string[];
    onClearSelection: () => void;
}

export function BulkActionsBar({
    selectedIds,
    onClearSelection,
}: BulkActionsBarProps) {
    const utils = api.useUtils();
    const bulkAction = api.sessions.bulkAction.useMutation({
        onSuccess: () => {
            void utils.sessions.invalidate();
            onClearSelection();
        },
    });

    if (selectedIds.length === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
            <div className="flex items-center gap-2 bg-bg-card border border-border-default text-text-primary p-2 rounded-2xl shadow-2xl shadow-black/40 backdrop-blur-lg">
                <div className="pl-3 pr-2 font-medium text-sm border-r border-border-default">
                    {selectedIds.length} selected
                </div>

                <div className="flex items-center gap-1">
                    <ActionButton
                        icon="drive_file_move"
                        label="Move"
                        onClick={() => { }}
                    />
                    <ActionButton
                        icon="star"
                        label="Star"
                        onClick={() =>
                            bulkAction.mutate({
                                sessionIds: selectedIds,
                                action: "star",
                            })
                        }
                    />
                    <ActionButton
                        icon="archive"
                        label="Archive"
                        onClick={() =>
                            bulkAction.mutate({
                                sessionIds: selectedIds,
                                action: "archive",
                            })
                        }
                    />
                    <div className="w-px h-6 bg-border-default mx-1" />
                    <ActionButton
                        icon="delete"
                        label="Delete"
                        className="text-danger hover:bg-danger/10"
                        onClick={() => {
                            if (
                                confirm(
                                    `Delete ${selectedIds.length} sessions?`
                                )
                            ) {
                                onClearSelection();
                            }
                        }}
                    />
                </div>

                <button
                    onClick={onClearSelection}
                    className="ml-2 p-1.5 hover:bg-bg-surface rounded-full text-text-muted hover:text-text-primary transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">
                        close
                    </span>
                </button>
            </div>
        </div>
    );
}

function ActionButton({
    icon,
    label,
    onClick,
    className = "text-text-secondary hover:bg-bg-surface hover:text-text-primary",
}: {
    icon: string;
    label: string;
    onClick: () => void;
    className?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg gap-1 text-[10px] transition-colors ${className}`}
        >
            <span className="material-symbols-outlined text-[18px]">
                {icon}
            </span>
            <span>{label}</span>
        </button>
    );
}
