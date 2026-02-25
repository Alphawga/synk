"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

export default function AdminWaitlistPage() {
    const { data, isLoading, error } = api.waitlist.adminStats.useQuery();

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-bg-base">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-bg-base">
                <div className="rounded-2xl border border-red-500/30 bg-red-950/50 px-8 py-6 text-center">
                    <p className="text-lg font-semibold text-red-300">Access Denied</p>
                    <p className="mt-2 text-sm text-red-400/70">{error.message}</p>
                </div>
            </main>
        );
    }

    const entries = data?.entries ?? [];
    const total = data?.total ?? 0;

    // Count by platform
    const platformCounts = entries.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.platform] = (acc[entry.platform] ?? 0) + 1;
        return acc;
    }, {});

    // Count by day for chart
    const dailyCounts = entries.reduce<Record<string, number>>((acc, entry) => {
        const day = new Date(entry.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
        acc[day] = (acc[day] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <main className="min-h-screen bg-bg-base text-text-primary">
            <div className="mx-auto max-w-5xl px-6 py-12">
                {/* Header */}
                <div className="mb-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-bold">
                                S
                            </div>
                            <h1 className="text-2xl font-bold">Synk Admin</h1>
                        </div>
                        <p className="text-text-muted">Waitlist & signups dashboard</p>
                    </div>
                    <Link
                        href="/"
                        className="rounded-full border border-border-default bg-bg-card px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-bg-elevated"
                    >
                        ← Back to site
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border-default bg-bg-card p-6">
                        <p className="text-sm text-text-muted">Total Signups</p>
                        <p className="mt-2 text-4xl font-bold text-primary">{total}</p>
                    </div>
                    <div className="rounded-2xl border border-border-default bg-bg-card p-6">
                        <p className="text-sm text-text-muted">Extension</p>
                        <p className="mt-2 text-4xl font-bold text-emerald-400">
                            {platformCounts.extension ?? 0}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border-default bg-bg-card p-6">
                        <p className="text-sm text-text-muted">Mobile</p>
                        <p className="mt-2 text-4xl font-bold text-amber-400">
                            {platformCounts.mobile ?? 0}
                        </p>
                    </div>
                </div>

                {/* Daily Signups */}
                {Object.keys(dailyCounts).length > 0 && (
                    <div className="mb-8 rounded-2xl border border-border-default bg-bg-card p-6">
                        <h2 className="mb-4 text-lg font-semibold">Daily Signups</h2>
                        <div className="flex items-end gap-2 overflow-x-auto pb-2">
                            {Object.entries(dailyCounts).map(([day, count]) => (
                                <div key={day} className="flex flex-col items-center gap-1">
                                    <span className="text-xs font-medium text-primary">{count}</span>
                                    <div
                                        className="w-10 rounded-t-md bg-primary/80"
                                        style={{ height: `${Math.max(count * 20, 8)}px` }}
                                    />
                                    <span className="text-[10px] text-text-muted whitespace-nowrap">{day}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Entries Table */}
                <div className="rounded-2xl border border-border-default bg-bg-card overflow-hidden">
                    <div className="border-b border-border-default px-6 py-4">
                        <h2 className="text-lg font-semibold">All Signups</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border-default bg-bg-elevated/50">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-text-muted">#</th>
                                    <th className="px-6 py-3 font-medium text-text-muted">Email</th>
                                    <th className="px-6 py-3 font-medium text-text-muted">Platform</th>
                                    <th className="px-6 py-3 font-medium text-text-muted">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default">
                                {entries.map((entry, index) => (
                                    <tr key={entry.id} className="transition hover:bg-bg-elevated/30">
                                        <td className="px-6 py-3 text-text-muted">{index + 1}</td>
                                        <td className="px-6 py-3 font-medium">{entry.email}</td>
                                        <td className="px-6 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${entry.platform === "extension"
                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                    : entry.platform === "mobile"
                                                        ? "bg-amber-500/10 text-amber-400"
                                                        : "bg-primary/10 text-primary"
                                                    }`}
                                            >
                                                {entry.platform}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-text-muted">
                                            {new Date(entry.createdAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </td>
                                    </tr>
                                ))}
                                {entries.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                                            No signups yet. Share your landing page!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
