/**
 * Shared constants for Synk
 */

export const SAVE_SOURCES = {
    BROWSER: "BROWSER",
    MOBILE_SHARE: "MOBILE_SHARE",
    X_LIKE: "X_LIKE",
    X_BOOKMARK: "X_BOOKMARK",
} as const;

export const DEFAULT_CATEGORIES = [
    { name: "Work", color: "#3B82F6", icon: "briefcase" },
    { name: "Research", color: "#8B5CF6", icon: "book" },
    { name: "Shopping", color: "#F59E0B", icon: "cart" },
    { name: "Entertainment", color: "#EF4444", icon: "play" },
    { name: "Social", color: "#10B981", icon: "users" },
    { name: "News", color: "#6366F1", icon: "newspaper" },
] as const;

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export const PAGINATION = {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 50,
} as const;
