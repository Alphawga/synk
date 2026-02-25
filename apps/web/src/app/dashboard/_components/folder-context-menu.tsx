"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface FolderContextMenuProps {
    x: number;
    y: number;
    folderId: string;
    folderName: string;
    onClose: () => void;
    onRename: () => void;
    onDelete: () => void;
    onCreateSub: () => void;
}

export function FolderContextMenu({
    x, y, onClose, onRename, onDelete, onCreateSub
}: FolderContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ x: -9999, y: -9999 });
    const [isReady, setIsReady] = useState(false);

    // Position clamping
    useEffect(() => {
        if (!menuRef.current) return;
        const rect = menuRef.current.getBoundingClientRect();
        const pad = 20;
        setPos({
            x: Math.max(pad, Math.min(x, window.innerWidth - rect.width - pad)),
            y: Math.max(pad, Math.min(y, window.innerHeight - rect.height - pad)),
        });
        requestAnimationFrame(() => setIsReady(true));
    }, [x, y]);

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

    return createPortal(
        <div
            ref={menuRef}
            className={`fixed z-50 w-48 rounded-xl border border-border-default bg-bg-card shadow-lg py-1 text-[13px] transition-opacity duration-100 ${isReady ? "opacity-100" : "opacity-0"
                }`}
            style={{ top: pos.y, left: pos.x }}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div className="py-0.5">
                <MenuItem icon="edit" label="Rename" onClick={onRename} />
                <MenuItem icon="create_new_folder" label="New subfolder" onClick={onCreateSub} />
            </div>
            <div className="my-0.5 border-t border-border-default" />
            <div className="py-0.5">
                <MenuItem icon="delete" label="Delete folder" danger onClick={onDelete} />
            </div>
        </div>,
        document.body
    );
}

function MenuItem({
    icon,
    label,
    onClick,
    danger = false,
}: {
    icon: string;
    label: string;
    onClick?: () => void;
    danger?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 transition-colors text-left ${danger
                    ? "text-red-500 hover:bg-red-50"
                    : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                }`}
        >
            <span className="material-symbols-outlined text-[16px]">{icon}</span>
            <span className="flex-1">{label}</span>
        </button>
    );
}
