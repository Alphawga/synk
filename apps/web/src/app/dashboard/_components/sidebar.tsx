"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Session } from "next-auth";
import { signOut } from "next-auth/react";
import { api } from "~/trpc/react";
import { useState, useEffect } from "react";
import { FolderContextMenu } from "./folder-context-menu";
import { FolderDialog } from "./folder-dialog";
import { Tooltip } from "./tooltip";

interface SidebarProps {
    user: Session["user"];
}

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();
    const { data: folders } = api.folders.getAll.useQuery();
    const { data: categories } = api.categories.getAll.useQuery();
    const utils = api.useUtils();

    const createFolder = api.folders.create.useMutation({
        onSuccess: () => utils.folders.invalidate(),
    });
    const updateFolder = api.folders.update.useMutation({
        onSuccess: () => utils.folders.invalidate(),
    });
    const deleteFolder = api.folders.delete.useMutation({
        onSuccess: () => utils.folders.invalidate(),
    });

    const [isCollapsed, setIsCollapsed] = useState(false);

    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        folderId: string;
        folderName: string;
    } | null>(null);

    const [folderDialog, setFolderDialog] = useState<{
        mode: "create" | "rename" | "delete";
        folderId?: string;
        folderName?: string;
    } | null>(null);

    // Load persisted state
    useEffect(() => {
        const collapsed = localStorage.getItem("synk-sidebar-collapsed");
        if (collapsed === "true") setIsCollapsed(true);
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("synk-sidebar-collapsed", String(newState));
    };

    return (
        <aside
            className={`flex-shrink-0 flex flex-col justify-between border-r border-border-default bg-bg-base transition-all duration-300 ${isCollapsed ? "w-20 px-2 py-4" : "w-56 px-3 py-4"
                }`}
        >
            <div className="flex flex-col gap-5">
                {/* Logo — click to toggle collapse */}
                <button
                    onClick={toggleCollapse}
                    className={`flex items-center gap-2.5 transition-all cursor-pointer group ${isCollapsed ? "justify-center px-0" : "px-2 pt-0.5"}`}
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <div className="w-7 h-7 rounded-lg shrink-0 bg-primary flex items-center justify-center text-white font-bold text-sm">
                        S
                    </div>
                    {!isCollapsed && (
                        <div className="flex items-center gap-2 flex-1">
                            <h1 className="text-base font-bold tracking-tight text-text-primary animate-in fade-in duration-300">
                                Synk
                            </h1>
                            <span className="material-symbols-outlined text-[16px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                chevron_left
                            </span>
                        </div>
                    )}
                </button>

                {/* Main Navigation */}
                <nav className="space-y-0.5">
                    <NavItem
                        href="/dashboard"
                        active={pathname === "/dashboard"}
                        icon="grid_view"
                        label="All Saves"
                        collapsed={isCollapsed}
                    />
                    <NavItem
                        href="/dashboard/tab-groups"
                        active={pathname.startsWith("/dashboard/tab-groups")}
                        icon="tab"
                        label="Browser Tabs"
                        collapsed={isCollapsed}
                    />
                    <NavItem
                        href="/dashboard/x-library"
                        active={pathname.startsWith("/dashboard/x-library")}
                        icon="tag"
                        label="X Content"
                        collapsed={isCollapsed}
                    />
                    <NavItem
                        href="/dashboard/search"
                        active={pathname.startsWith("/dashboard/search")}
                        icon="search"
                        label="Search"
                        collapsed={isCollapsed}
                    />
                </nav>

                {/* Categories */}
                <div>
                    {!isCollapsed && (
                        <span className="px-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest animate-in fade-in">
                            Categories
                        </span>
                    )}
                    <div className={`mt-2 space-y-0.5 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
                        {categories && categories.length > 0 ? (
                            categories.slice(0, 5).map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/dashboard/category/${cat.slug}`}
                                    className={`flex items-center gap-2.5 rounded-lg text-[13px] transition-colors ${isCollapsed
                                        ? "justify-center w-10 h-10 p-0"
                                        : "px-3 py-1.5 w-full"
                                        } ${pathname.includes(`/category/${cat.slug}`)
                                            ? "text-primary bg-primary/10"
                                            : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                                        }`}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{
                                            backgroundColor: cat.color ?? "#3b82f6",
                                        }}
                                    />
                                    {!isCollapsed && (
                                        <span className="truncate">
                                            {cat.name}
                                        </span>
                                    )}
                                </Link>
                            ))
                        ) : (
                            isCollapsed ? (
                                /* Collapsed placeholders */
                                <>
                                    <div className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-bg-surface"><span className="w-2 h-2 rounded-full bg-blue-500"></span></div>
                                    <div className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-bg-surface"><span className="w-2 h-2 rounded-full bg-emerald-500"></span></div>
                                </>
                            ) : (
                                <>
                                    <CategoryPlaceholder name="Development" color="#3b82f6" />
                                    <CategoryPlaceholder name="AI Research" color="#10b981" />
                                    <CategoryPlaceholder name="Design Inspiration" color="#8b5cf6" />
                                </>
                            )
                        )}
                    </div>
                </div>

                {/* Folders */}
                <div>
                    {!isCollapsed ? (
                        <div className="flex items-center justify-between px-3 mb-1.5 group">
                            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
                                Folders
                            </span>
                            <button
                                className="text-text-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                                onClick={() => setFolderDialog({ mode: "create" })}
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    add
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="h-4" /> /* Spacer when collapsed */
                    )}

                    <div className="space-y-0.5">
                        {folders?.map((folder) => (
                            <FolderNavItem
                                key={folder.id}
                                folder={folder}
                                active={pathname.includes(folder.id)}
                                collapsed={isCollapsed}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setContextMenu({
                                        x: e.pageX,
                                        y: e.pageY,
                                        folderId: folder.id,
                                        folderName: folder.name,
                                    });
                                }}
                            />
                        ))}
                        {!isCollapsed && (!folders || folders.length === 0) && (
                            <p className="px-3 text-[11px] text-text-muted italic">
                                No folders yet
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom: Toggle + Trash + Settings + User */}
            <div className="space-y-0.5 pt-2">

                <NavItem
                    href="/dashboard/trash"
                    active={pathname.startsWith("/dashboard/trash")}
                    icon="delete"
                    label="Trash"
                    collapsed={isCollapsed}
                />
                <NavItem
                    href="/dashboard/settings"
                    active={pathname.startsWith("/dashboard/settings")}
                    icon="settings"
                    label="Settings"
                    collapsed={isCollapsed}
                />

                {/* User */}
                <div className={`flex items-center gap-2.5 mt-3 border-t border-border-default pt-4 transition-all ${isCollapsed ? "justify-center px-0 flex-col" : "px-3 py-2"
                    }`}>
                    <div className="h-7 w-7 shrink-0 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                        {user?.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    {!isCollapsed && (
                        <>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-text-primary truncate">
                                    {user?.name ?? "User"}
                                </p>
                                <p className="text-[10px] text-text-muted leading-none">
                                    Free Plan
                                </p>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="text-text-muted hover:text-danger transition-colors"
                                title="Sign out"
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    logout
                                </span>
                            </button>
                        </>
                    )}
                    {isCollapsed && (
                        <Tooltip content="Sign out" side="right">
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="text-text-muted hover:text-danger transition-colors p-1"
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    logout
                                </span>
                            </button>
                        </Tooltip>
                    )}
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <FolderContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    folderId={contextMenu.folderId}
                    folderName={contextMenu.folderName}
                    onClose={() => setContextMenu(null)}
                    onRename={() => {
                        setFolderDialog({
                            mode: "rename",
                            folderId: contextMenu.folderId,
                            folderName: contextMenu.folderName,
                        });
                        setContextMenu(null);
                    }}
                    onDelete={() => {
                        setFolderDialog({
                            mode: "delete",
                            folderId: contextMenu.folderId,
                            folderName: contextMenu.folderName,
                        });
                        setContextMenu(null);
                    }}
                    onCreateSub={() => {
                        setFolderDialog({
                            mode: "create",
                            folderId: contextMenu.folderId,
                        });
                        setContextMenu(null);
                    }}
                />
            )}

            {/* Folder Dialog */}
            {folderDialog && (
                <FolderDialog
                    mode={folderDialog.mode}
                    folderName={folderDialog.folderName}
                    onCancel={() => setFolderDialog(null)}
                    onConfirm={(value) => {
                        if (folderDialog.mode === "create") {
                            void createFolder.mutateAsync({
                                name: value,
                                parentId: folderDialog.folderId,
                            });
                        } else if (folderDialog.mode === "rename" && folderDialog.folderId) {
                            void updateFolder.mutateAsync({
                                id: folderDialog.folderId,
                                name: value,
                            });
                        } else if (folderDialog.mode === "delete" && folderDialog.folderId) {
                            void deleteFolder.mutateAsync({
                                id: folderDialog.folderId,
                            });
                        }
                        setFolderDialog(null);
                    }}
                />
            )}
        </aside>
    );
}

/* ─── Nav Item ─────────────────────────────────────────── */
function NavItem({
    href,
    active,
    icon,
    label,
    collapsed,
}: {
    href: string;
    active: boolean;
    icon: string;
    label: string;
    collapsed: boolean;
}) {
    const content = (
        <Link
            href={href}
            className={`flex items-center gap-3 rounded-lg text-[13px] font-medium transition-colors ${collapsed
                ? "justify-center w-10 h-10 p-0"
                : "px-3 py-2 w-full"
                } ${active
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                }`}
        >
            <span className="material-symbols-outlined text-[18px]">
                {icon}
            </span>
            {!collapsed && label}
        </Link>
    );

    if (collapsed) {
        return (
            <div className="flex justify-center w-full">
                <Tooltip content={label} side="right">
                    {content}
                </Tooltip>
            </div>
        );
    }

    return content;
}

/* ─── Category Placeholder ─────────────────────────────── */
function CategoryPlaceholder({
    name,
    color,
}: {
    name: string;
    color: string;
}) {
    return (
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] text-text-secondary cursor-default">
            <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
            />
            <span className="truncate">{name}</span>
        </div>
    );
}

/* ─── Folder Nav Item ──────────────────────────────────── */
function FolderNavItem({
    folder,
    active,
    onContextMenu,
    collapsed,
}: {
    folder: {
        id: string;
        name: string;
        color?: string | null;
        _count?: { sessions: number };
    };
    active: boolean;
    onContextMenu: (e: React.MouseEvent) => void;
    collapsed: boolean;
}) {
    const content = (
        <Link
            href={`/dashboard/folder/${folder.id}`}
            className={`flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-colors group ${collapsed
                ? "justify-center w-10 h-10 p-0"
                : "px-3 py-1.5 w-full"
                } ${active
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                }`}
            onContextMenu={onContextMenu}
        >
            <span className="material-symbols-outlined text-[16px] text-text-muted">
                folder
            </span>
            {!collapsed && <span className="truncate flex-1">{folder.name}</span>}
        </Link>
    );

    if (collapsed) {
        return (
            <div className="flex justify-center w-full">
                <Tooltip content={folder.name} side="right">
                    {content}
                </Tooltip>
            </div>
        );
    }

    return content;
}
