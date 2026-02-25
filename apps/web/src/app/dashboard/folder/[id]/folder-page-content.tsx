"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { useToast } from "../../_components/toast";
import { SessionContextMenu } from "../../_components/session-context-menu";
import { RenameSessionDialog } from "../../_components/rename-session-dialog";
import { ShareSessionDialog } from "../../_components/share-session-dialog";
import { SortSessionDialog } from "../../_components/sort-session-dialog";
import { FolderDialog } from "../../_components/folder-dialog";

interface FolderPageContentProps {
    folderId: string;
}

export function FolderPageContent({ folderId }: FolderPageContentProps) {
    const router = useRouter();
    const { data: folder, isLoading } = api.folders.getById.useQuery({ id: folderId });
    const { data: allFolders } = api.folders.getAll.useQuery();
    const utils = api.useUtils();
    const { showToast } = useToast();

    const moveToFolder = api.sessions.moveToFolder.useMutation({
        onSuccess: () => {
            void utils.folders.invalidate();
            void utils.sessions.invalidate();
        },
    });

    const updateFolder = api.folders.update.useMutation({
        onSuccess: () => void utils.folders.invalidate(),
    });

    const deleteFolder = api.folders.delete.useMutation({
        onSuccess: () => {
            void utils.folders.invalidate();
            router.push("/dashboard");
        },
    });

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [contextMenu, setContextMenu] = useState<{
        x: number; y: number; sessionId: string;
    } | null>(null);
    const [activeDialog, setActiveDialog] = useState<{
        type: "rename" | "share" | "sort";
        sessionId: string;
        currentName?: string;
        isPublic?: boolean;
    } | null>(null);
    const [folderDialog, setFolderDialog] = useState<{
        mode: "rename" | "delete";
    } | null>(null);
    const [showMoveDialog, setShowMoveDialog] = useState(false);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleRemoveFromFolder = (sessionIds: string[]) => {
        void moveToFolder.mutateAsync({ sessionIds, folderId: null }).then(() => {
            showToast("Removed from folder", "success");
            setSelectedIds(new Set());
        });
    };

    const handleMoveToFolder = (targetFolderId: string) => {
        const ids = Array.from(selectedIds);
        void moveToFolder.mutateAsync({ sessionIds: ids, folderId: targetFolderId }).then(() => {
            showToast("Moved to folder", "success");
            setSelectedIds(new Set());
            setShowMoveDialog(false);
        });
    };

    /* ─── Loading ─── */
    if (isLoading) {
        return (
            <div className="px-4 py-6 space-y-4">
                <div className="h-8 w-48 animate-pulse rounded-lg bg-bg-card" />
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-bg-card" />
                ))}
            </div>
        );
    }

    /* ─── Not Found ─── */
    if (!folder) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-4xl text-text-muted mb-3">
                    folder_off
                </span>
                <h3 className="text-lg font-semibold text-text-primary mb-1">Folder not found</h3>
                <p className="text-sm text-text-secondary mb-4">
                    This folder may have been deleted.
                </p>
                <Link
                    href="/dashboard"
                    className="text-sm text-primary hover:underline"
                >
                    ← Back to dashboard
                </Link>
            </div>
        );
    }

    const sessions = folder.sessions ?? [];

    return (
        <>
            {/* Header */}
            <div className="px-4 pt-4 pb-3">
                <div className="flex items-center gap-2 text-sm text-text-muted mb-2">
                    <Link href="/dashboard" className="hover:text-text-primary transition-colors">
                        All Saves
                    </Link>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="text-text-primary font-medium">{folder.name}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: (folder.color ?? "#6366f1") + "15" }}
                        >
                            <span
                                className="material-symbols-outlined text-[20px]"
                                style={{ color: folder.color ?? "#6366f1" }}
                            >
                                folder
                            </span>
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-text-primary">
                                {folder.name}
                            </h1>
                            <p className="text-xs text-text-muted">
                                {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setFolderDialog({ mode: "rename" })}
                            className="p-2 rounded-lg text-text-muted hover:bg-bg-surface hover:text-text-primary transition-colors"
                            title="Rename folder"
                        >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                            onClick={() => setFolderDialog({ mode: "delete" })}
                            className="p-2 rounded-lg text-text-muted hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="Delete folder"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Selection bar */}
            {selectedIds.size > 0 && (
                <div className="mx-4 mb-2 flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 px-4 py-2.5 text-sm">
                    <span className="text-text-secondary font-medium">
                        {selectedIds.size} selected
                    </span>
                    <div className="flex-1" />
                    <button
                        onClick={() => setShowMoveDialog(true)}
                        className="flex items-center gap-1.5 text-primary hover:text-primary-hover transition-colors font-medium"
                    >
                        <span className="material-symbols-outlined text-[16px]">drive_file_move</span>
                        Move to folder
                    </button>
                    <button
                        onClick={() => handleRemoveFromFolder(Array.from(selectedIds))}
                        className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors font-medium"
                    >
                        <span className="material-symbols-outlined text-[16px]">folder_off</span>
                        Remove from folder
                    </button>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="text-text-muted hover:text-text-primary transition-colors ml-2"
                    >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>
            )}

            {/* Sessions */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5">
                {sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <span className="material-symbols-outlined text-3xl text-text-muted mb-3">
                            folder_open
                        </span>
                        <p className="text-sm text-text-secondary mb-1">This folder is empty</p>
                        <p className="text-xs text-text-muted">
                            Right-click a session on the dashboard and move it here
                        </p>
                    </div>
                ) : (
                    sessions.map((session) => (
                        <div
                            key={session.id}
                            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors cursor-pointer ${selectedIds.has(session.id)
                                ? "bg-primary/5 border border-primary/20"
                                : "hover:bg-bg-surface border border-transparent"
                                }`}
                            onClick={() => toggleSelection(session.id)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setContextMenu({
                                    x: e.pageX,
                                    y: e.pageY,
                                    sessionId: session.id,
                                });
                            }}
                        >
                            {/* Checkbox */}
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${selectedIds.has(session.id)
                                ? "bg-primary border-primary"
                                : "border-border-default group-hover:border-text-muted"
                                }`}>
                                {selectedIds.has(session.id) && (
                                    <span className="material-symbols-outlined text-[12px] text-white">check</span>
                                )}
                            </div>

                            {/* Session info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-text-primary truncate">
                                    {session.name ?? `Session · ${new Date(session.createdAt).toLocaleDateString()}`}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[11px] text-text-muted">
                                        {session._count.saves} tab{session._count.saves !== 1 ? "s" : ""}
                                    </span>
                                    {session.isPinned && (
                                        <span className="material-symbols-outlined text-[12px] text-amber-500">keep</span>
                                    )}
                                    {session.isLocked && (
                                        <span className="material-symbols-outlined text-[12px] text-text-muted">lock</span>
                                    )}
                                </div>
                            </div>

                            {/* Favicons */}
                            <div className="flex -space-x-1.5 shrink-0">
                                {session.saves.slice(0, 4).map((save) => (
                                    <img
                                        key={save.id}
                                        src={save.favicon ?? `https://www.google.com/s2/favicons?domain=${save.domain}&sz=32`}
                                        alt=""
                                        className="w-4 h-4 rounded-sm border border-bg-card bg-white"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                    />
                                ))}
                                {session.saves.length > 4 && (
                                    <span className="text-[10px] text-text-muted ml-1.5">
                                        +{session.saves.length - 4}
                                    </span>
                                )}
                            </div>

                            {/* Remove button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFromFolder([session.id]);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-text-primary transition-all"
                                title="Remove from folder"
                            >
                                <span className="material-symbols-outlined text-[16px]">folder_off</span>
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Move to Folder Dialog */}
            {showMoveDialog && (
                <MoveToFolderDialog
                    folders={(allFolders ?? []).filter((f) => f.id !== folderId)}
                    onMove={handleMoveToFolder}
                    onCancel={() => setShowMoveDialog(false)}
                />
            )}

            {/* Context Menu */}
            {contextMenu && (
                <SessionContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    sessionId={contextMenu.sessionId}
                    onClose={() => setContextMenu(null)}
                    onRename={() => {
                        const session = sessions.find((s) => s.id === contextMenu.sessionId);
                        setActiveDialog({
                            type: "rename",
                            sessionId: contextMenu.sessionId,
                            currentName: session?.name ?? "",
                        });
                    }}
                    onShare={() => {
                        const session = sessions.find((s) => s.id === contextMenu.sessionId);
                        setActiveDialog({
                            type: "share",
                            sessionId: contextMenu.sessionId,
                            isPublic: session?.isPublic ?? false,
                        });
                    }}
                    onSort={() => setActiveDialog({ type: "sort", sessionId: contextMenu.sessionId })}
                    isPinned={sessions.find((s) => s.id === contextMenu.sessionId)?.isPinned}
                    isStarred={sessions.find((s) => s.id === contextMenu.sessionId)?.isStarred}
                    isLocked={sessions.find((s) => s.id === contextMenu.sessionId)?.isLocked}
                    isArchived={sessions.find((s) => s.id === contextMenu.sessionId)?.isArchived}
                />
            )}

            {/* Dialogs */}
            {activeDialog?.type === "rename" && (
                <RenameSessionDialog
                    sessionId={activeDialog.sessionId}
                    currentName={activeDialog.currentName ?? ""}
                    onClose={() => setActiveDialog(null)}
                />
            )}
            {activeDialog?.type === "share" && (
                <ShareSessionDialog
                    sessionId={activeDialog.sessionId}
                    isPublic={activeDialog.isPublic ?? false}
                    onClose={() => setActiveDialog(null)}
                />
            )}
            {activeDialog?.type === "sort" && (() => {
                const session = sessions.find((s) => s.id === activeDialog.sessionId);
                return (
                    <SortSessionDialog
                        sessionId={activeDialog.sessionId}
                        saves={(session?.saves ?? []).map((s) => ({
                            id: s.id,
                            title: s.title,
                            domain: s.domain,
                            createdAt: s.createdAt,
                        }))}
                        onClose={() => setActiveDialog(null)}
                    />
                );
            })()}

            {/* Folder rename/delete dialog */}
            {folderDialog && (
                <FolderDialog
                    mode={folderDialog.mode}
                    folderName={folder.name}
                    onCancel={() => setFolderDialog(null)}
                    onConfirm={(value) => {
                        if (folderDialog.mode === "rename") {
                            void updateFolder.mutateAsync({ id: folderId, name: value }).then(() => {
                                showToast("Folder renamed", "success");
                            });
                        } else if (folderDialog.mode === "delete") {
                            void deleteFolder.mutateAsync({ id: folderId }).then(() => {
                                showToast("Folder deleted", "success");
                            });
                        }
                        setFolderDialog(null);
                    }}
                />
            )}
        </>
    );
}

/* ─── Move To Folder Dialog ────────────────────────────── */
function MoveToFolderDialog({
    folders,
    onMove,
    onCancel,
}: {
    folders: Array<{ id: string; name: string; color?: string | null; _count?: { sessions: number } }>;
    onMove: (folderId: string) => void;
    onCancel: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-200 flex items-center justify-center"
            onClick={onCancel}
        >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-150" />
            <div
                className="relative z-10 w-[340px] rounded-2xl border border-border-default bg-bg-card shadow-xl p-5 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-[15px] font-semibold text-text-primary mb-3">
                    Move to folder
                </h3>

                {folders.length === 0 ? (
                    <p className="text-sm text-text-muted py-4 text-center">
                        No other folders available
                    </p>
                ) : (
                    <div className="space-y-0.5 max-h-[240px] overflow-y-auto">
                        {folders.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => onMove(f.id)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-surface hover:text-text-primary transition-colors text-left"
                            >
                                <span
                                    className="material-symbols-outlined text-[18px]"
                                    style={{ color: f.color ?? "#6366f1" }}
                                >
                                    folder
                                </span>
                                <span className="flex-1 truncate">{f.name}</span>
                                <span className="text-[11px] text-text-muted">
                                    {f._count?.sessions ?? 0}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex justify-end mt-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-surface transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
