/**
 * Shared types for Synk across web and mobile
 */

export interface User {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
}

export interface Save {
    id: string;
    url: string;
    title: string;
    favicon: string | null;
    domain: string | null;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    sessionId: string | null;
}

export interface SaveSession {
    id: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
    saves: Save[];
    _count?: { saves: number };
}

export type SaveSource = "BROWSER" | "X_LIKE" | "X_BOOKMARK" | "MOBILE_SHARE";

export interface Category {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
}

// API response types
export interface SessionsResponse {
    sessions: SaveSession[];
    nextCursor?: string;
}

export interface AuthStatus {
    authenticated: boolean;
    user?: User;
}
