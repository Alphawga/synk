"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { api, type RouterOutputs } from "~/trpc/react";
import { SortableTabList } from "./sortable-tab-list";
import { SessionContextMenu } from "./session-context-menu";
import { BulkActionsBar } from "./bulk-actions-bar";
import { Tooltip } from "./tooltip";
import { RenameSessionDialog } from "./rename-session-dialog";
import { ShareSessionDialog } from "./share-session-dialog";
import { SortSessionDialog } from "./sort-session-dialog";

type ViewMode = "date" | "group";
type SourceFilter = "ALL" | "BROWSER" | "X_LIKE" | "X_BOOKMARK" | "MOBILE_SHARE";
type Session = RouterOutputs["sessions"]["getAll"]["sessions"][number];

const SOURCE_LABELS: Record<SourceFilter, string> = {
    ALL: "All Sources",
    BROWSER: "Browser",
    X_LIKE: "X Likes",
    X_BOOKMARK: "X Bookmarks",
    MOBILE_SHARE: "Mobile Share",
};

const SOURCE_ICONS: Record<SourceFilter, string> = {
    ALL: "filter_list",
    BROWSER: "language",
    X_LIKE: "favorite",
    X_BOOKMARK: "bookmark",
    MOBILE_SHARE: "smartphone",
};

export function SessionsGrid() {
    // 1. Infinite Query
    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = api.sessions.getAll.useInfiniteQuery(
        { limit: 20 },
        { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );
    const { data: _count } = api.sessions.getCount.useQuery();

    // 2. Flatten Data
    const allSessions = data?.pages.flatMap((page) => page.sessions) ?? [];

    const [viewMode, setViewMode] = useState<ViewMode>("date");
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
    const [showSourceDropdown, setShowSourceDropdown] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        sessionId: string;
    } | null>(null);

    const [activeDialog, setActiveDialog] = useState<{
        type: "rename" | "share" | "sort";
        sessionId: string;
        currentName?: string;
        isPublic?: boolean;
    } | null>(null);

    // 3. Infinite Scroll Observer
    const observerRef = useRef<IntersectionObserver>(null);
    const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoading || isFetchingNextPage) return;
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && hasNextPage) {
                void fetchNextPage();
            }
        });

        if (node) observerRef.current.observe(node);
    }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);


    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const clearSelection = () => setSelectedIds(new Set());

    // Filter sessions by source
    const filteredSessions = useMemo(() => {
        if (sourceFilter === "ALL") return allSessions;
        return allSessions.filter((session) =>
            session.saves.some((save) => save.source === sourceFilter)
        );
    }, [allSessions, sourceFilter]);

    // Group sessions by date for timeline view
    const groupedByDate = useMemo(() => {
        if (!filteredSessions) return [];
        const groups: Record<string, typeof filteredSessions> = {};
        for (const session of filteredSessions) {
            const label = getDateLabel(new Date(session.createdAt));
            groups[label] ??= [];
            groups[label].push(session);
        }
        return Object.entries(groups);
    }, [filteredSessions]);

    /* ─── Loading ─────────────────────────────────── */
    if (isLoading) {
        return (
            <div className="px-4 py-6 space-y-4"> {/* Reduced padding px-8 -> px-4 */}
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-20 animate-pulse rounded-xl bg-bg-card"
                    />
                ))}
            </div>
        );
    }

    /* ─── Empty ──────────────────────────────────── */
    if (!allSessions || allSessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-default bg-bg-card py-16 mx-4 mt-6">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bg-surface">
                    <span className="material-symbols-outlined text-3xl text-text-muted">
                        inventory_2
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

    /* ─── Content ────────────────────────────────── */
    return (
        <>
            {/* Header: View Toggle + Filter */}
            <div className="px-4 pt-6 pb-2 flex items-center justify-between"> {/* Reduced padding */}
                <ViewToggle mode={viewMode} onChange={setViewMode} />
                <div className="relative">
                    <button
                        onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                        className={`flex items-center gap-2 text-sm transition-colors rounded-lg px-3 py-1.5 ${sourceFilter !== "ALL"
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-text-secondary hover:text-text-primary"
                            }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {SOURCE_ICONS[sourceFilter]}
                        </span>
                        {SOURCE_LABELS[sourceFilter]}
                        <span className="material-symbols-outlined text-[14px]">
                            {showSourceDropdown ? "expand_less" : "expand_more"}
                        </span>
                    </button>

                    {/* Dropdown */}
                    {showSourceDropdown && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowSourceDropdown(false)}
                            />
                            <div className="absolute right-0 top-full mt-1 z-50 bg-bg-card border border-border-default rounded-xl shadow-lg py-1 min-w-[180px]">
                                {(Object.keys(SOURCE_LABELS) as SourceFilter[]).map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setSourceFilter(key);
                                            setShowSourceDropdown(false);
                                        }}
                                        className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors ${sourceFilter === key
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            {SOURCE_ICONS[key]}
                                        </span>
                                        {SOURCE_LABELS[key]}
                                        {sourceFilter === key && (
                                            <span className="material-symbols-outlined text-[16px] ml-auto">
                                                check
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Sessions */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8"> {/* Reduced padding */}
                {filteredSessions.length === 0 && sourceFilter !== "ALL" ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <span className="material-symbols-outlined text-3xl text-text-muted mb-3">
                            {SOURCE_ICONS[sourceFilter]}
                        </span>
                        <p className="text-sm text-text-muted">
                            No sessions from {SOURCE_LABELS[sourceFilter].toLowerCase()}
                        </p>
                        <button
                            onClick={() => setSourceFilter("ALL")}
                            className="mt-3 text-sm text-primary hover:underline"
                        >
                            Clear filter
                        </button>
                    </div>
                ) : viewMode === "date" ? (
                    /* ── Timeline View ─────────────── */
                    <>
                        {groupedByDate.map(([label, sessions]) => (
                            <section key={label}>
                                <DateSectionHeader
                                    label={label}
                                    count={sessions.length}
                                />
                                <div className="space-y-0.5"> {/* Tighter spacing */}
                                    {sessions.map((session) => (
                                        <TimelineSessionRow
                                            key={session.id}
                                            session={session}
                                            isSelected={selectedIds.has(
                                                session.id
                                            )}
                                            onToggleSelection={() =>
                                                toggleSelection(session.id)
                                            }
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                setContextMenu({
                                                    x: e.pageX,
                                                    y: e.pageY,
                                                    sessionId: session.id,
                                                });
                                            }}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </>
                ) : (
                    /* ── Group View ────────────────── */
                    <div className="space-y-6">
                        {filteredSessions.map((session) => (
                            <GroupSessionCard
                                key={session.id}
                                session={session}
                                isSelected={selectedIds.has(session.id)}
                                onToggleSelection={() =>
                                    toggleSelection(session.id)
                                }
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    setContextMenu({
                                        x: e.pageX,
                                        y: e.pageY,
                                        sessionId: session.id,
                                    });
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Infinite Scroll Loader */}
                <div ref={loadMoreRef} className="py-4 flex justify-center h-10">
                    {isFetchingNextPage && (
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                </div>
            </div >

            {/* Context Menu */}
            {
                contextMenu && (
                    <SessionContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        sessionId={contextMenu.sessionId}
                        onClose={() => setContextMenu(null)}
                        onRename={() => {
                            const session = allSessions.find(s => s.id === contextMenu.sessionId);
                            setActiveDialog({
                                type: "rename",
                                sessionId: contextMenu.sessionId,
                                currentName: session?.name ?? ""
                            });
                        }}
                        onShare={() => {
                            const session = allSessions.find(s => s.id === contextMenu.sessionId);
                            setActiveDialog({
                                type: "share",
                                sessionId: contextMenu.sessionId,
                                isPublic: session?.isPublic ?? false
                            });
                        }}
                        onSort={() => setActiveDialog({ type: "sort", sessionId: contextMenu.sessionId })}
                        showRename={viewMode !== "date"}
                        isPinned={allSessions.find(s => s.id === contextMenu.sessionId)?.isPinned}
                        isStarred={allSessions.find(s => s.id === contextMenu.sessionId)?.isStarred}
                        isLocked={allSessions.find(s => s.id === contextMenu.sessionId)?.isLocked}
                        isArchived={allSessions.find(s => s.id === contextMenu.sessionId)?.isArchived}
                    />
                )
            }

            {/* Dialogs */}
            {
                activeDialog?.type === "rename" && (
                    <RenameSessionDialog
                        sessionId={activeDialog.sessionId}
                        currentName={activeDialog.currentName ?? ""}
                        onClose={() => setActiveDialog(null)}
                    />
                )
            }
            {
                activeDialog?.type === "share" && (
                    <ShareSessionDialog
                        sessionId={activeDialog.sessionId}
                        isPublic={activeDialog.isPublic ?? false}
                        onClose={() => setActiveDialog(null)}
                    />
                )
            }
            {
                activeDialog?.type === "sort" && (
                    <SortSessionDialog
                        sessionId={activeDialog.sessionId}
                        saves={allSessions.find(s => s.id === activeDialog.sessionId)?.saves ?? []}
                        onClose={() => setActiveDialog(null)}
                    />
                )
            }

            {/* Bulk Actions */}
            <BulkActionsBar
                selectedIds={Array.from(selectedIds)}
                onClearSelection={clearSelection}
            />
        </>
    );
}

/* ─── View Toggle ──────────────────────────────────────── */
function ViewToggle({
    mode,
    onChange,
}: {
    mode: ViewMode;
    onChange: (m: ViewMode) => void;
}) {
    return (
        <div className="flex items-center bg-bg-elevated rounded-lg p-1">
            <button
                onClick={() => onChange("date")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-all ${mode === "date"
                    ? "bg-bg-surface text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                    }`}
            >
                <span className="material-symbols-outlined text-[18px]">
                    list
                </span>
                By date
            </button>
            <button
                onClick={() => onChange("group")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-all ${mode === "group"
                    ? "bg-bg-surface text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                    }`}
            >
                <span className="material-symbols-outlined text-[18px]">
                    grid_view
                </span>
                By group
            </button>
        </div>
    );
}

/* ─── Date Section Header ──────────────────────────────── */
function DateSectionHeader({
    label,
    count,
}: {
    label: string;
    count: number;
}) {
    const isToday = label === "Today";
    return (
        <h3 className="sticky top-0 z-10 bg-bg-base/95 backdrop-blur py-3 text-sm font-semibold text-text-secondary uppercase tracking-wider border-b border-border-default mb-4 flex items-center gap-2">
            {label}
            <span
                className={`text-xs font-normal px-2 py-0.5 rounded-full ${isToday
                    ? "bg-primary/10 text-primary"
                    : "bg-bg-surface text-text-secondary"
                    }`}
            >
                {count} item{count !== 1 ? "s" : ""}
            </span>
        </h3>
    );
}

/* ─── Timeline Row (By Date view) ──────────────────────── */
function TimelineSessionRow({
    session,
    isSelected,
    onToggleSelection,
    onContextMenu,
}: {
    session: Session;
    isSelected: boolean;
    onToggleSelection: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
}) {
    const time = new Date(session.createdAt).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
    const sessionName = session.name ?? "Untitled Session";
    const tabCount = session._count?.saves ?? session.saves?.length ?? 0;
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`group rounded-lg border border-transparent hover:border-border-default transition-all ${isExpanded ? "bg-bg-elevated border-border-default" : "hover:bg-bg-elevated"
            }`}>
            {/* Main Row Content */}
            <div
                className={`flex items-center gap-4 p-3 cursor-pointer rounded-lg transition-colors ${isSelected ? "ring-2 ring-primary bg-primary/5" : ""
                    }`}
                onClick={() => setIsExpanded(!isExpanded)}
                onContextMenu={onContextMenu}
            >
                {/* Time */}
                <div className="flex-shrink-0 w-14 text-text-secondary text-xs font-medium text-right">
                    {time}
                </div>

                {/* Icon */}
                <div className="relative">
                    <div className="w-10 h-10 rounded-lg bg-bg-surface flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px] text-text-secondary">
                            tab
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-text-primary truncate">
                            {sessionName}
                        </h4>
                        {session.isPinned && (
                            <span className="text-amber-400 text-xs">📌</span>
                        )}
                        {session.isStarred && (
                            <span className="text-amber-400 text-xs">★</span>
                        )}
                    </div>
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                        {tabCount} tab{tabCount !== 1 ? "s" : ""}
                        {session.folder && ` · ${session.folder.name}`}
                    </p>
                </div>

                {/* Hover actions */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <Tooltip content="Open all tabs">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                session.saves?.forEach((s) =>
                                    window.open(s.url, "_blank")
                                );
                            }}
                            className="p-1.5 rounded hover:bg-bg-surface text-text-secondary hover:text-text-primary"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                open_in_new
                            </span>
                        </button>
                    </Tooltip>

                    <Tooltip content={isSelected ? "Deselect" : "Select"}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleSelection();
                            }}
                            className="p-1.5 rounded hover:bg-bg-surface text-text-secondary hover:text-text-primary"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {isSelected ? "check_box" : "check_box_outline_blank"}
                            </span>
                        </button>
                    </Tooltip>

                    <Tooltip content="More options">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onContextMenu(e);
                            }}
                            className="p-1.5 rounded hover:bg-bg-surface text-text-secondary hover:text-text-primary"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                more_horiz
                            </span>
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-3 pb-3 pt-0 pl-[4.5rem] animate-in slide-in-from-top-2 duration-200">
                    <SortableTabList
                        sessionId={session.id}
                        saves={session.saves}
                    />
                </div>
            )}
        </div>
    );
}

/* ─── Group Card (By Group view) ───────────────────────── */
function GroupSessionCard({
    session,
    isSelected,
    onToggleSelection: _onToggleSelection,
    onContextMenu,
}: {
    session: Session;
    isSelected: boolean;
    onToggleSelection: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(true);
    const _utils = api.useUtils();

    const sessionName = session.name ?? "Untitled Session";
    const formattedDate = formatSessionDate(session.createdAt);
    const tabCount = session._count?.saves ?? session.saves?.length ?? 0;

    return (
        <div
            className={`rounded-xl border transition-all ${isSelected
                ? "ring-2 ring-primary border-primary/30"
                : "border-border-default hover:border-border-default/80"
                } bg-bg-card`}
            onContextMenu={onContextMenu}
        >
            {/* Card Header */}
            <div
                className="flex items-center justify-between p-4 border-b border-border-default/50 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[20px]">
                            tab
                        </span>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-text-primary">
                            {sessionName}
                        </h3>
                        <p className="text-xs text-text-secondary">
                            {formattedDate} · {tabCount} tab
                            {tabCount !== 1 ? "s" : ""}
                        </p>
                    </div>
                    {session.isPinned && (
                        <span className="text-amber-400 text-xs">📌</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="p-1.5 rounded hover:bg-bg-surface text-text-secondary"
                    >
                        <span
                            className={`material-symbols-outlined text-[20px] transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"
                                }`}
                        >
                            expand_more
                        </span>
                    </button>

                    <Tooltip content="Open all tabs">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                session.saves?.forEach((s) =>
                                    window.open(s.url, "_blank")
                                )
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors"
                        >
                            Restore all
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Tab List */}
            {isExpanded && (
                <div className="p-2">
                    <SortableTabList
                        sessionId={session.id}
                        saves={session.saves}
                    />
                </div>
            )}
        </div>
    );
}

/* ─── Helpers ──────────────────────────────────────────── */
function getDateLabel(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );
    const diff = Math.floor(
        (today.getTime() - target.getTime()) / 86400000
    );

    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return date.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
    });
}

function formatSessionDate(date: Date): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7)
        return d.toLocaleDateString(undefined, {
            weekday: "long",
            hour: "numeric",
            minute: "2-digit",
        });
    return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
