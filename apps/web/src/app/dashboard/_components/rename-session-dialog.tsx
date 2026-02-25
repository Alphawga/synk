"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useToast } from "./toast";

interface RenameSessionDialogProps {
    sessionId: string;
    currentName: string;
    onClose: () => void;
}

export function RenameSessionDialog({ sessionId, currentName, onClose }: RenameSessionDialogProps) {
    const [name, setName] = useState(currentName);
    const utils = api.useUtils();
    const { showToast } = useToast();

    const { mutate, isPending } = api.sessions.rename.useMutation({
        onSuccess: () => {
            void utils.sessions.getAll.invalidate();
            showToast("Session renamed successfully", "success");
            onClose();
        },
        onError: () => {
            showToast("Failed to rename session", "error");
        },
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-xl bg-bg-card p-6 shadow-2xl ring-1 ring-border-default animate-in zoom-in-95 duration-200">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Rename Session</h2>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (name.trim()) mutate({ id: sessionId, name });
                    }}
                >
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border border-border-default bg-bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary mb-6"
                        placeholder="Enter session name"
                        autoFocus
                    />
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !name.trim() || name === currentName}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {isPending ? "Renaming..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
