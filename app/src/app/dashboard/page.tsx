import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { SavesGrid } from "./_components/saves-grid";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/api/auth/signin");
    }

    // Prefetch saves for the dashboard
    void api.saves.getAll.prefetch({ limit: 50 });
    void api.saves.getCount.prefetch();

    return (
        <HydrateClient>
            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
                            <svg className="h-7 w-7 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                            Synk
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-600">
                                {session.user.email}
                            </span>
                            <a
                                href="/api/auth/signout"
                                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                            >
                                Sign out
                            </a>
                        </div>
                    </div>
                </header>

                <div className="mx-auto max-w-7xl px-6 py-8">
                    {/* Page Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Your Saves</h1>
                            <p className="text-sm text-slate-500">All your saved tabs in one place</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <input
                                    type="search"
                                    placeholder="Search saves..."
                                    className="w-64 rounded-lg border border-slate-200 bg-white px-4 py-2 pl-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <svg
                                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Saves Grid */}
                    <SavesGrid />
                </div>
            </div>
        </HydrateClient>
    );
}
