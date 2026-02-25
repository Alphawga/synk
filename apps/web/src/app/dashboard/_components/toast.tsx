"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {typeof document !== "undefined" && createPortal(
                <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={`
                                flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium
                                animate-in slide-in-from-bottom-2 fade-in duration-300
                                ${toast.type === "success" ? "bg-slate-800 text-white" : ""}
                                ${toast.type === "error" ? "bg-red-500 text-white" : ""}
                                ${toast.type === "info" ? "bg-slate-800 text-white" : ""}
                            `}
                        >
                            {toast.type === "success" && (
                                <span className="material-symbols-outlined text-[18px] text-green-400">check_circle</span>
                            )}
                            {toast.type === "error" && (
                                <span className="material-symbols-outlined text-[18px]">error</span>
                            )}
                            {toast.message}
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}
