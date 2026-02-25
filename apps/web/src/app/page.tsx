import Link from "next/link";
import { Suspense } from "react";
import { auth } from "~/server/auth";
import { WaitlistBanner } from "./_components/waitlist-banner";
export default async function Home() {
  const session = await auth();

  return (
    <div className="relative min-h-screen bg-bg-base text-text-primary overflow-hidden">
      {/* Waitlist Success Banner */}
      <Suspense>
        <WaitlistBanner />
      </Suspense>

      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-purple-400/5 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* ─── NAVBAR ─────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border-default bg-bg-base/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
              S
            </div>
            <span>Synk</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-text-muted">
            <a href="#how-it-works" className="transition hover:text-text-primary">How It Works</a>
            <a href="#features" className="transition hover:text-text-primary">Features</a>
          </nav>

          <div className="flex items-center gap-4">
            {session ? (
              <span className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-950/80 px-4 py-2 text-sm font-medium text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                On the waitlist
              </span>
            ) : (
              <>
                <Link
                  href="/api/auth/signin"
                  className="text-sm text-text-muted transition hover:text-text-primary"
                >
                  Log in
                </Link>
                <Link
                  href="/api/auth/signin"
                  className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  Join the Waitlist
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO ───────────────────────────────────── */}
      <section className="relative z-10 pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Now in Beta
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight md:text-7xl">
            Your digital memory,
            <br />
            <span className="text-primary">
              unified.
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-text-secondary">
            Save all your browser tabs in one click. Let AI organize them.
            Search by meaning, not keywords. Never lose a link again.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={session ? "#early-access" : "/api/auth/signin"}
              className="group rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white transition hover:bg-primary/90 hover:scale-[1.02] active:scale-95"
            >
              {session ? "You're on the list ✓" : "Join the Waitlist"}
              {!session && <span className="ml-2 inline-block transition-transform group-hover:translate-x-0.5">→</span>}
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-border-default bg-bg-card px-8 py-3.5 text-base font-semibold text-text-primary transition hover:bg-bg-elevated hover:border-border-default"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────── */}
      <section id="how-it-works" className="relative z-10 border-t border-border-default py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Three steps to a clutter-free mind.
            </h2>
            <p className="mx-auto max-w-xl text-text-muted">
              Synk fits seamlessly into how you already work. No learning curve, no disruption.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="group relative rounded-2xl border border-border-default bg-bg-card p-8 transition hover:border-primary/30 hover:shadow-sm">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                1
              </div>
              <h3 className="mb-3 text-lg font-semibold">Save in one click</h3>
              <p className="mb-6 text-sm leading-relaxed text-text-muted">
                Hit <kbd className="rounded border border-border-default bg-bg-elevated px-1.5 py-0.5 text-xs font-mono">⌘+Shift+S</kbd> or
                click the extension icon. All your open tabs are instantly saved as a session —
                titled, timestamped, and organized automatically.
              </p>
              <div className="rounded-xl border border-border-default bg-bg-elevated p-4 text-xs text-text-muted">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded bg-primary/20" />
                  <span className="text-text-secondary">React Research</span>
                  <span className="ml-auto text-[10px] text-text-muted">12 tabs</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {["reactjs.org", "github.com", "stackoverflow", "mdn", "vercel"].map((d) => (
                    <span key={d} className="rounded bg-bg-base px-1.5 py-0.5 text-[10px]">{d}</span>
                  ))}
                  <span className="text-[10px] text-text-muted">+7 more</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative rounded-2xl border border-border-default bg-bg-card p-8 transition hover:border-purple-400/30 hover:shadow-sm">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-600">
                2
              </div>
              <h3 className="mb-3 text-lg font-semibold">AI organizes everything</h3>
              <p className="mb-6 text-sm leading-relaxed text-text-muted">
                Synk&apos;s AI auto-categorizes your tabs, suggests smart session names,
                and builds a semantic index — so you can search by meaning, not just keywords.
              </p>
              <div className="space-y-2">
                <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                  <span className="text-[10px] font-medium text-purple-600">AI SUGGESTED</span>
                  <p className="text-xs text-text-secondary mt-0.5">&quot;Frontend Architecture Research&quot;</p>
                </div>
                <div className="flex gap-2">
                  {["React", "TypeScript", "Design"].map((tag) => (
                    <span key={tag} className="rounded-full bg-bg-elevated border border-border-default px-2 py-0.5 text-[10px] text-text-muted">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative rounded-2xl border border-border-default bg-bg-card p-8 transition hover:border-emerald-400/30 hover:shadow-sm">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-600">
                3
              </div>
              <h3 className="mb-3 text-lg font-semibold">Find anything, instantly</h3>
              <p className="mb-6 text-sm leading-relaxed text-text-muted">
                Type what you remember — even vaguely. &quot;That article about React performance&quot;
                finds it instantly. Your entire browsing history becomes a searchable knowledge base.
              </p>
              <div className="rounded-xl border border-border-default bg-bg-elevated p-3">
                <div className="flex items-center gap-2 rounded-lg bg-bg-base px-3 py-2 mb-2">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-text-muted" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span className="text-xs text-text-muted">react server components...</span>
                </div>
                <div className="space-y-1.5">
                  {["React Server Components – reactjs.org", "Understanding RSC – vercel.com"].map((r) => (
                    <div key={r} className="flex items-center gap-2 rounded px-2 py-1.5 text-[10px] text-text-muted hover:bg-bg-base">
                      <div className="h-3 w-3 rounded bg-emerald-100" />
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────── */}
      <section id="features" className="relative z-10 border-t border-border-default py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Engineered for flow.
            </h2>
            <p className="mx-auto max-w-xl text-text-muted">
              Experience zero-latency interactions with a keyboard-first design
              built for speed.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              }
              title="Semantic Search"
              description="Find anything across your library in milliseconds. AI understands meaning, not just keywords."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              }
              title="Session Management"
              description="Pin, star, lock, archive your sessions. Organize by folders and categories. Your workflow, your way."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                </svg>
              }
              title="AI-Powered"
              description="Auto-categorize tabs, smart naming suggestions, and semantic indexing — AI works silently to keep you organized."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              }
              title="Share Sessions"
              description="Generate a public link to share curated sessions with anyone. Perfect for research collections and collaboration."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z" />
                </svg>
              }
              title="X Integration"
              description="Sync your X bookmarks and liked tweets directly into your library. Everything searchable in one place."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="6" y1="12" x2="18" y2="12" /><line x1="6" y1="8" x2="12" y2="8" /><line x1="6" y1="16" x2="14" y2="16" />
                </svg>
              }
              title="Keyboard First"
              description="Navigate your entire workflow without touching the mouse. Every action has a shortcut built in."
            />
          </div>
        </div>
      </section>

      {/* ─── EARLY ACCESS CTA ────────────────────────── */}
      <section className="relative z-10 border-t border-border-default py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Early Access
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Be among the first.
          </h2>
          <p className="mb-10 text-text-muted max-w-xl mx-auto">
            Synk is launching soon. Sign in to join the waitlist and be the first
            to know when the Chrome Extension and mobile app go live.
          </p>

          <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto mb-10">
            {/* Chrome Extension */}
            <div className="rounded-2xl border border-primary/20 bg-bg-card p-8 text-left">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M8 2v4M16 2v4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Chrome Extension</h3>
              <p className="text-sm text-text-muted mb-6">
                Save tabs, search your library, and auto-organize — all from your browser toolbar. Launching on the Chrome Web Store soon.
              </p>
              {session ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-950/80 px-6 py-2.5 text-sm font-medium text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  You&apos;re on the list
                </span>
              ) : (
                <Link
                  href="/api/auth/signin"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  Join the Waitlist
                  <span>→</span>
                </Link>
              )}
            </div>

            {/* Mobile App */}
            <div className="rounded-2xl border border-border-default bg-bg-card p-8 text-left">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-bg-elevated border border-border-default">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Mobile App</h3>
              <p className="text-sm text-text-muted mb-6">
                Save links from any app, browse your library on the go. Coming soon to iOS &amp; Android.
              </p>
              <span className="inline-flex items-center gap-2 rounded-full border border-border-default bg-bg-elevated px-6 py-2.5 text-sm font-medium text-text-muted">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────── */}
      <footer className="relative z-10 border-t border-border-default bg-bg-elevated py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2 text-lg font-bold">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
                S
              </div>
              Synk
            </div>
            <p className="text-xs text-text-muted">
              Your digital memory, unified. Save once, find instantly.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://x.com/alphawga" target="_blank" rel="noreferrer" className="text-text-muted transition hover:text-text-secondary">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-border-default pt-6 text-center">
            <p className="text-xs text-text-muted">© {new Date().getFullYear()} Synk. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Feature Card ─────────────────────────────────────── */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-border-default bg-bg-card p-8 transition hover:border-primary/30 hover:shadow-sm">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-border-default bg-bg-elevated text-primary transition group-hover:border-primary/30 group-hover:bg-primary/10">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-text-muted">{description}</p>
    </div>
  );
}
