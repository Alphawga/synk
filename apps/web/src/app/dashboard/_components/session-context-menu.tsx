"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "~/trpc/react";
import { useToast } from "./toast";

interface SessionContextMenuProps {
    x: number;
    y: number;
    sessionId: string;
    onClose: () => void;
    onRename?: () => void;
    onShare?: () => void;
    onSort?: () => void;
    showRename?: boolean;
    isPinned?: boolean;
    isStarred?: boolean;
    isLocked?: boolean;
    isArchived?: boolean;
}

export function SessionContextMenu({
    x, y, sessionId, onClose, onRename, onShare, onSort, showRename = true,
    isPinned, isStarred, isLocked, isArchived
}: SessionContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const utils = api.useUtils();
    const { showToast } = useToast();
    const [pos, setPos] = useState({ x: -9999, y: -9999 });
    const [isReady, setIsReady] = useState(false);
    const [showFolders, setShowFolders] = useState(false);

    const { data: folders } = api.folders.getAll.useQuery();

    // Measure then position — runs before paint so no flash
    useEffect(() => {
        if (!menuRef.current) return;

        const rect = menuRef.current.getBoundingClientRect();
        const pad = 20;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        setPos({
            x: Math.max(pad, Math.min(x, vw - rect.width - pad)),
            y: Math.max(pad, Math.min(y, vh - rect.height - pad)),
        });
        // Show after position is calculated
        requestAnimationFrame(() => setIsReady(true));
    }, [x, y]);

    // Mutations
    const bulkAction = api.sessions.bulkAction.useMutation({
        onSuccess: () => utils.sessions.invalidate(),
    });

    const deleteSession = api.sessions.delete.useMutation({
        onSuccess: () => utils.sessions.invalidate(),
    });

    const removeDuplicates = api.sessions.removeDuplicates.useMutation({
        onSuccess: () => utils.sessions.invalidate(),
    });

    const moveToFolder = api.sessions.moveToFolder.useMutation({
        onSuccess: () => {
            void utils.sessions.invalidate();
            void utils.folders.invalidate();
        },
    });

    const categorizeSession = api.ai.categorizeSession.useMutation({
        onSuccess: () => utils.sessions.invalidate(),
    });

    const suggestNameForSession = api.ai.suggestNameForSession.useMutation();

    const renameSession = api.sessions.rename.useMutation({
        onSuccess: () => utils.sessions.invalidate(),
    });

    // Close on click outside or Escape
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleKey);
        };
    }, [onClose]);

    // Action handler with toast
    const handleAction = async (action: () => Promise<unknown> | void, successMessage: string) => {
        try {
            await action();
            showToast(successMessage, "success");
        } catch {
            showToast("Something went wrong", "error");
        }
        onClose();
    };

    return createPortal(
        <div
            ref={menuRef}
            className={`fixed z-50 w-52 rounded-xl border border-border-default bg-bg-card shadow-lg py-1 text-[13px] transition-opacity duration-100 ${isReady ? "opacity-100" : "opacity-0"
                }`}
            style={{ top: pos.y, left: pos.x }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Organize */}
            <div className="py-0.5">
                {showRename && (
                    <MenuItem
                        icon="edit"
                        label="Rename"
                        onClick={() => { onRename?.(); onClose(); }}
                    />
                )}
                <MenuItem
                    icon="content_copy"
                    label="Copy link"
                    onClick={() => void handleAction(
                        () => navigator.clipboard.writeText(`${window.location.origin}/dashboard?session=${sessionId}`),
                        "Link copied"
                    )}
                />
                <MenuItem
                    icon="share"
                    label="Share"
                    onClick={() => { onShare?.(); onClose(); }}
                />
            </div>

            <Divider />

            {/* Move to folder */}
            <div className="py-0.5">
                <button
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 transition-colors text-left text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                    onClick={() => setShowFolders(!showFolders)}
                >
                    <span className="material-symbols-outlined text-[16px]">drive_file_move</span>
                    <span className="flex-1">Move to folder</span>
                    <span className={`material-symbols-outlined text-[14px] transition-transform ${showFolders ? "rotate-180" : ""}`}>expand_more</span>
                </button>
                {showFolders && (
                    <div className="mx-2 mt-0.5 mb-0.5 rounded-lg bg-bg-surface/60 border border-border-default/50 overflow-hidden">
                        {!folders || folders.length === 0 ? (
                            <p className="px-3 py-2 text-[12px] text-text-muted italic">No folders yet</p>
                        ) : (
                            folders.map((f) => (
                                <button
                                    key={f.id}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-text-secondary hover:bg-bg-surface hover:text-text-primary transition-colors text-left"
                                    onClick={() => void handleAction(
                                        () => moveToFolder.mutateAsync({ sessionIds: [sessionId], folderId: f.id }),
                                        `Moved to ${f.name}`
                                    )}
                                >
                                    <span className="material-symbols-outlined text-[14px]" style={{ color: f.color ?? "#6366f1" }}>folder</span>
                                    <span className="truncate flex-1">{f.name}</span>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            <Divider />

            {/* Status toggles */}
            <div className="py-0.5">
                <MenuItem
                    icon={isPinned ? "keep_off" : "keep"}
                    label={isPinned ? "Unpin" : "Pin to top"}
                    onClick={() => void handleAction(
                        () => bulkAction.mutateAsync({ sessionIds: [sessionId], action: isPinned ? "unpin" : "pin" }),
                        isPinned ? "Unpinned" : "Pinned"
                    )}
                />
                <MenuItem
                    icon={isStarred ? "star" : "star_outline"}
                    label={isStarred ? "Unstar" : "Star"}
                    onClick={() => void handleAction(
                        () => bulkAction.mutateAsync({ sessionIds: [sessionId], action: isStarred ? "unstar" : "star" }),
                        isStarred ? "Unstarred" : "Starred"
                    )}
                />
                <MenuItem
                    icon={isLocked ? "lock_open" : "lock"}
                    label={isLocked ? "Unlock" : "Lock"}
                    onClick={() => void handleAction(
                        () => bulkAction.mutateAsync({ sessionIds: [sessionId], action: isLocked ? "unlock" : "lock" }),
                        isLocked ? "Unlocked" : "Locked"
                    )}
                />
                <MenuItem
                    icon={isArchived ? "unarchive" : "archive"}
                    label={isArchived ? "Unarchive" : "Archive"}
                    onClick={() => void handleAction(
                        () => bulkAction.mutateAsync({ sessionIds: [sessionId], action: isArchived ? "unarchive" : "archive" }),
                        isArchived ? "Unarchived" : "Archived"
                    )}
                />
            </div>

            <Divider />

            {/* Tools */}
            <div className="py-0.5">
                <MenuItem
                    icon="sort"
                    label="Sort tabs"
                    onClick={() => { onSort?.(); onClose(); }}
                />
                <MenuItem
                    icon="content_copy"
                    label="Remove duplicates"
                    onClick={() => void handleAction(
                        () => removeDuplicates.mutateAsync({ sessionId }),
                        "Duplicates removed"
                    )}
                />
                <MenuItem
                    icon="auto_awesome"
                    label="AI categorize"
                    onClick={() => void handleAction(
                        () => categorizeSession.mutateAsync({ sessionId }),
                        "Categorized with AI"
                    )}
                />
                <MenuItem
                    icon="magic_button"
                    label="AI rename"
                    onClick={() => void handleAction(async () => {
                        const result = await suggestNameForSession.mutateAsync({ sessionId });
                        if (result.name) {
                            await renameSession.mutateAsync({ id: sessionId, name: result.name });
                        }
                    }, "Renamed by AI")}
                />
            </div>

            <Divider />

            {/* Destructive */}
            <div className="py-0.5">
                <MenuItem
                    icon="delete"
                    label="Move to trash"
                    danger
                    onClick={() => void handleAction(
                        () => deleteSession.mutateAsync({ id: sessionId }),
                        "Moved to trash"
                    )}
                />
            </div>
        </div>,
        document.body
    );
}

/* ─── MenuItem ────────────────────────────────────────── */
function MenuItem({
    icon,
    label,
    onClick,
    danger = false,
    disabled = false,
}: {
    icon: string;
    label: string;
    onClick?: () => void;
    danger?: boolean;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 transition-colors text-left ${disabled
                ? "opacity-40 cursor-not-allowed text-text-muted"
                : danger
                    ? "text-red-500 hover:bg-red-50"
                    : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                }`}
        >
            <span className="material-symbols-outlined text-[16px]">{icon}</span>
            <span className="flex-1">{label}</span>
        </button>
    );
}

/* ─── Divider ─────────────────────────────────────────── */
function Divider() {
    return <div className="my-0.5 border-t border-border-default" />;
}
