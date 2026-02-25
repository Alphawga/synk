"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
    content: string;
    children: React.ReactElement;
    side?: "top" | "bottom" | "right";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();

        let x = 0;
        let y = 0;

        if (side === "top") {
            x = rect.left + rect.width / 2;
            y = rect.top - 8;
        } else if (side === "bottom") {
            x = rect.left + rect.width / 2;
            y = rect.bottom + 8;
        } else if (side === "right") {
            x = rect.right + 8;
            y = rect.top + rect.height / 2;
        }

        // Prevent overflow logic (simplified for side-specific)
        // If right side, ensure it doesn't go off screen? (Usually sidebar is left, so right is safe)

        setCoords({ x, y });
    }, [side]);

    const handleMouseEnter = () => {
        updatePosition();
        setIsVisible(true);
    };

    // Recalculate on scroll/resize if visible
    useEffect(() => {
        if (isVisible) {
            window.addEventListener("scroll", updatePosition);
            window.addEventListener("resize", updatePosition);
            return () => {
                window.removeEventListener("scroll", updatePosition);
                window.removeEventListener("resize", updatePosition);
            }
        }
    }, [isVisible, updatePosition]);

    return (
        <div
            ref={triggerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsVisible(false)}
            /* Use flex to fit content */
            className="flex w-full"
        >
            {children}
            {isVisible && createPortal(
                <div
                    className="fixed z-[9999] px-2.5 py-1.5 text-xs font-medium text-white bg-slate-800 rounded shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                    style={{
                        top: coords.y,
                        left: coords.x,
                        // Transforms for centering based on side
                        transform: side === "right"
                            ? "translate(0, -50%)"
                            : "translate(-50%, 0)",
                        // Margin adjustment if needed
                        marginTop: side === "top" ? "-2rem" : "0"
                    }}
                >
                    {content}
                    {/* Tiny triangle pointer */}
                    <div
                        className={`absolute border-4 border-transparent ${side === "top"
                            ? "top-full left-1/2 -translate-x-1/2 border-t-slate-800"
                            : side === "bottom"
                                ? "bottom-full left-1/2 -translate-x-1/2 border-b-slate-800"
                                : "right-full top-1/2 -translate-y-1/2 border-r-slate-800"
                            }`}
                    />
                </div>,
                document.body
            )}
        </div>
    );
}
