"use client";

import { api } from "~/trpc/react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function SharedSessionPage() {
    const params = useParams();
    const sessionId = params.sessionId as string;

    const { data: session, isLoading, error } = api.sessions.getPublic.useQuery({ id: sessionId });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg-base flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-full bg-bg-surface flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-3xl text-text-secondary">
                        lock
                    </span>
                </div>
                <h1 className="text-xl font-semibold text-text-primary mb-2">
                    Session not found or private
                </h1>
                <p className="text-text-secondary mb-6 text-center max-w-sm">
                    This session either doesn&apos;t exist or hasn&apos;t been made public by its owner.
                </p>
                <Link
                    href="/"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Go Home
                </Link>
            </div>
        );
    }

    const handleOpenAll = () => {
        session.saves.forEach(save => {
            window.open(save.url, "_blank");
        });
    };

    return (
        <div className="min-h-screen bg-bg-base">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 h-16 bg-bg-base/80 backdrop-blur-md border-b border-border-default z-10">
                <div className="h-full max-w-4xl mx-auto px-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                            S
                        </div>
                        <span className="font-semibold text-text-primary">Synk</span>
                    </Link>

                    <a
                        href="https://synk.app"
                        target="_blank"
                        className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors hover:underline"
                    >
                        Get Synk
                    </a>
                </div>
            </header>

            {/* Content */}
            <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
                <div className="bg-bg-card rounded-2xl border border-border-default shadow-sm overflow-hidden">
                    {/* Session Info */}
                    <div className="p-6 border-b border-border-default bg-bg-surface/50">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-text-primary mb-2">
                                    {session.name ?? "Untitled Session"}
                                </h1>
                                <div className="flex items-center gap-3 text-sm text-text-secondary">
                                    <div className="flex items-center gap-1.5">
                                        {session.user.image ? (
                                            <Image
                                                src={session.user.image}
                                                alt={session.user.name ?? "User"}
                                                width={20}
                                                height={20}
                                                className="rounded-full"
                                            />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white">
                                                {session.user.name?.[0] ?? "U"}
                                            </div>
                                        )}
                                        <span>{session.user.name ?? "Unknown User"}</span>
                                    </div>
                                    <span>•</span>
                                    <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{session.saves.length} tabs</span>
                                </div>
                            </div>

                            <button
                                onClick={handleOpenAll}
                                className="px-4 py-2 bg-text-primary text-bg-base rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                                Open All
                            </button>
                        </div>
                    </div>

                    {/* Tabs List */}
                    <div className="divide-y divide-border-default">
                        {session.saves.map((save) => (
                            <a
                                key={save.id}
                                href={save.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 p-4 hover:bg-bg-surface transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-bg-surface border border-border-default flex items-center justify-center flex-shrink-0">
                                    {save.favicon ? (
                                        <Image
                                            src={save.favicon}
                                            alt=""
                                            width={20}
                                            height={20}
                                            className="w-5 h-5"
                                            unoptimized
                                        />
                                    ) : (
                                        <span className="material-symbols-outlined text-text-secondary">public</span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                                        {save.title}
                                    </h3>
                                    <p className="text-xs text-text-secondary truncate mt-0.5">
                                        {save.domain ?? new URL(save.url).hostname}
                                    </p>
                                </div>

                                <div className="text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-[20px]">arrow_outward</span>
                                </div>
                            </a>
                        ))}
                    </div>

                    {session.saves.length === 0 && (
                        <div className="p-12 text-center text-text-secondary">
                            <p>This session is empty.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
