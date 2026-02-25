"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface FolderDialogProps {
    mode: "create" | "rename" | "delete";
    /** Current folder name (for rename/delete modes) */
    folderName?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
}

const CONFIG = {
    create: {
        title: "New Folder",
        placeholder: "Folder name",
        confirmLabel: "Create",
        confirmClass: "bg-primary hover:bg-primary-hover text-white",
    },
    rename: {
        title: "Rename Folder",
        placeholder: "New name",
        confirmLabel: "Rename",
        confirmClass: "bg-primary hover:bg-primary-hover text-white",
    },
    delete: {
        title: "Delete Folder",
        placeholder: "",
        confirmLabel: "Delete",
        confirmClass: "bg-red-500 hover:bg-red-600 text-white",
    },
} as const;

export function FolderDialog({ mode, folderName = "", onConfirm, onCancel }: FolderDialogProps) {
    const [value, setValue] = useState(mode === "rename" ? folderName : "");
    const inputRef = useRef<HTMLInputElement>(null);
    const config = CONFIG[mode];

    // Auto-focus & select on mount
    useEffect(() => {
        requestAnimationFrame(() => inputRef.current?.select());
    }, []);

    // Escape to close
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [onCancel]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === "delete") {
            onConfirm(folderName);
        } else if (value.trim()) {
            onConfirm(value.trim());
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-200 flex items-center justify-center"
            onClick={onCancel}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-150" />

            {/* Dialog */}
            <form
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 w-[360px] rounded-2xl border border-border-default bg-bg-card shadow-xl p-5 animate-in fade-in zoom-in-95 duration-150"
            >
                <h3 className="text-[15px] font-semibold text-text-primary mb-3">
                    {config.title}
                </h3>

                {mode === "delete" ? (
                    <p className="text-sm text-text-secondary mb-4">
                        Delete <span className="font-medium text-text-primary">&ldquo;{folderName}&rdquo;</span>?
                        Sessions inside will be moved to All Saves.
                    </p>
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={config.placeholder}
                        className="w-full rounded-lg border border-border-default bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                        autoFocus
                    />
                )}

                <div className="flex items-center justify-end gap-2 mt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-surface transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={mode !== "delete" && !value.trim()}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${config.confirmClass}`}
                    >
                        {config.confirmLabel}
                    </button>
                </div>
            </form>
        </div>,
        document.body
    );
}
