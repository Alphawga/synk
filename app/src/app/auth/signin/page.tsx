"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
    const [email, setEmail] = useState("dev@synk.local");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await signIn("credentials", {
            email,
            redirect: false,
        });

        if (result?.ok) {
            router.push("/dashboard");
        } else {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-800/50 p-8 backdrop-blur-sm">
                {/* Logo */}
                <div className="mb-8 flex items-center justify-center gap-2 text-2xl font-bold text-white">
                    <svg className="h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    Synk
                </div>

                <h1 className="mb-2 text-center text-xl font-semibold text-white">
                    Welcome back
                </h1>
                <p className="mb-8 text-center text-sm text-slate-400">
                    Sign in to access your saved content
                </p>

                {/* Dev mode banner */}
                <div className="mb-6 rounded-lg bg-amber-500/10 p-3 text-center text-sm text-amber-400">
                    🛠️ Dev Mode: Enter any email to sign in
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                    >
                        {isLoading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-slate-500">
                    A new account will be created if this email doesn&apos;t exist
                </p>
            </div>
        </main>
    );
}
