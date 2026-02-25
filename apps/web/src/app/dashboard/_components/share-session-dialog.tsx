"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useToast } from "./toast";

interface ShareSessionDialogProps {
    sessionId: string;
    isPublic: boolean;
    onClose: () => void;
}

export function ShareSessionDialog({ sessionId, isPublic: initialIsPublic, onClose }: ShareSessionDialogProps) {
    const [isPublic, setIsPublic] = useState(initialIsPublic);
    const utils = api.useUtils();
    const { showToast } = useToast();

    const { mutate, isPending } = api.sessions.togglePublic.useMutation({
        onSuccess: () => {
            void utils.sessions.getAll.invalidate();
            showToast(isPublic ? "Session is now private" : "Session is now public", "success");
        },
        onError: () => {
            setIsPublic(!isPublic); // Revert on error
            showToast("Failed to update session privacy", "error");
        }
    });

    const shareUrl = typeof window !== "undefined"
        ? `${window.location.origin}/share/${sessionId}`
        : `https://synk.app/share/${sessionId}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl)
            .then(() => showToast("Copied to clipboard", "success"))
            .catch(() => showToast("Failed to copy", "error"));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-xl bg-bg-card p-6 shadow-2xl ring-1 ring-border-default animate-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-text-primary">Share Session</h2>
                        <p className="text-sm text-text-secondary mt-1">
                            Anyone with the link can view this session.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="bg-bg-surface rounded-lg p-4 mb-6 border border-border-default">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-text-primary">Public Access</span>
                        <div
                            className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors ${isPublic ? "bg-primary" : "bg-slate-700"}`}
                            onClick={() => {
                                const newValue = !isPublic;
                                setIsPublic(newValue);
                                mutate({ id: sessionId, isPublic: newValue });
                            }}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isPublic ? "translate-x-5" : "translate-x-0"}`} />
                        </div>
                    </div>

                    {isPublic ? (
                        <div className="flex items-center gap-2">
                            <input
                                readOnly
                                value={shareUrl}
                                className="flex-1 text-xs bg-bg-base border border-border-default rounded px-2 py-1.5 text-text-secondary select-all focus:outline-none"
                            />
                            <button
                                onClick={handleCopy}
                                className="p-1.5 rounded hover:bg-bg-elevated text-text-primary transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                            </button>
                        </div>
                    ) : (
                        <div className="text-xs text-text-secondary italic">
                            Enable public access to generate a link.
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
