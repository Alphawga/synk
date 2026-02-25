"use client";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect } from "react";
import Image from "next/image";
import { api } from "~/trpc/react";

interface SortableSave {
    id: string;
    url: string;
    title: string;
    favicon: string | null;
    domain: string | null;
}

interface SortableTabListProps {
    sessionId: string;
    saves: SortableSave[];
}

export function SortableTabList({ sessionId, saves: initialSaves }: SortableTabListProps) {
    const [saves, setSaves] = useState(initialSaves);

    // Sync with prop changes
    useEffect(() => {
        setSaves(initialSaves);
    }, [initialSaves]);

    const utils = api.useUtils();

    const reorderMutation = api.saves.reorder.useMutation({
        onSuccess: () => {
            void utils.sessions.getAll.invalidate();
        },
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = saves.findIndex((s) => s.id === active.id);
            const newIndex = saves.findIndex((s) => s.id === over.id);

            const newSaves = arrayMove(saves, oldIndex, newIndex);
            setSaves(newSaves);

            // Persist to server
            reorderMutation.mutate({
                sessionId,
                saveIds: newSaves.map((s) => s.id),
            });
        }
    };

    return (
        <div className="relative">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={saves.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="pt-1">
                        {saves.map((save) => (
                            <SortableTab
                                key={save.id}
                                save={save}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}

interface SortableTabProps {
    save: SortableSave;
}

function SortableTab({ save }: SortableTabProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: save.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 0,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center gap-2 py-1 px-2 rounded-lg transition hover:bg-bg-elevated ${isDragging ? 'opacity-50' : ''}`}
        >
            {/* Drag Handle (Hidden until hover) */}
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab text-text-muted hover:text-text-secondary active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity w-4"
            >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="8" cy="12" r="1.5" />
                    <circle cx="16" cy="12" r="1.5" />
                </svg>
            </button>

            {/* Favicon */}
            <Image
                src={save.favicon ?? `https://www.google.com/s2/favicons?domain=${save.domain}&sz=32`}
                alt=""
                width={14}
                height={14}
                className="rounded-sm"
            />

            {/* Title & Domain */}
            <a
                href={save.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate text-xs text-text-secondary hover:text-primary hover:underline min-w-0"
                onClick={(e) => e.stopPropagation()}
            >
                {save.title}
            </a>
        </div>
    );
}
