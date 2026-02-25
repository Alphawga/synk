"use client";

import { api } from "~/trpc/react";
import { useState } from "react";
import { signOut, signIn } from "next-auth/react";
import { useToast } from "../_components/toast";

export default function SettingsPage() {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { showToast } = useToast();

    const deleteMutation = api.user.deleteAccount.useMutation({
        onSuccess: async () => {
            await signOut({ callbackUrl: "/" });
        },
        onError: (error) => {
            showToast("Failed to delete account: " + error.message, "error");
            setIsDeleting(false);
        },
    });

    const { refetch: fetchExport, isFetching: isExporting } =
        api.user.exportData.useQuery(undefined, { enabled: false });

    const handleExport = async () => {
        const result = await fetchExport();
        if (result.data) {
            const blob = new Blob([JSON.stringify(result.data, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `synk-export-${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("Data exported successfully", "success");
        }
    };

    const handleDelete = () => {
        setIsDeleting(true);
        setShowDeleteConfirm(false);
        deleteMutation.mutate();
    };

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-bold text-text-primary">
                Settings & Integrations
            </h1>

            {/* ── Subscription Plan ─────────────────── */}
            <SubscriptionCard />

            {/* ── Connected Accounts ───────────────── */}
            <SettingsCard>
                <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-text-secondary">
                        link
                    </span>
                    Connected Accounts
                </h2>
                <XIntegrationRow />
            </SettingsCard>

            {/* ── AI Provider ────────────────────────── */}
            <AIProviderCard />

            {/* ── Data & Privacy ───────────────────── */}
            <SettingsCard>
                <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-text-secondary">
                        database
                    </span>
                    Data & Privacy
                </h2>
                <div className="flex items-center justify-between py-2">
                    <div>
                        <p className="text-sm font-medium text-text-primary">
                            Export Data
                        </p>
                        <p className="text-xs text-text-secondary">
                            Download a copy of all your saved content as JSON
                        </p>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="px-4 py-2 bg-bg-surface text-text-primary rounded-xl text-sm font-medium hover:bg-bg-surface/80 transition-colors disabled:opacity-50"
                    >
                        {isExporting ? "Exporting..." : "Export JSON"}
                    </button>
                </div>
            </SettingsCard>

            {/* ── Danger Zone ──────────────────────── */}
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-6">
                <h2 className="text-base font-semibold text-danger mb-1">
                    Danger Zone
                </h2>
                <p className="text-xs text-danger/70 mb-4">
                    These actions are irreversible.
                </p>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-text-primary">
                            Delete Account
                        </p>
                        <p className="text-xs text-text-secondary">
                            Permanently delete your account and all data
                        </p>
                    </div>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-danger text-white rounded-xl text-sm font-medium hover:bg-danger/90 transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? "Deleting..." : "Delete Account"}
                    </button>
                </div>
            </div>

            {/* Delete confirmation dialog */}
            {showDeleteConfirm && (
                <DeleteConfirmDialog
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}
        </div>
    );
}

/* ─── Delete Confirmation Dialog ──────────────────────── */
function DeleteConfirmDialog({
    onConfirm,
    onCancel,
}: {
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const [typed, setTyped] = useState("");

    return (
        <div
            className="fixed inset-0 z-200 flex items-center justify-center"
            onClick={onCancel}
        >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-150" />
            <div
                className="relative z-10 w-[400px] rounded-2xl border border-danger/30 bg-bg-card shadow-xl p-6 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-base font-semibold text-danger mb-2">
                    Delete your account?
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                    This will permanently delete your account, all saved sessions, folders, and data. This action <span className="font-semibold text-text-primary">cannot be undone</span>.
                </p>
                <p className="text-xs text-text-muted mb-2">
                    Type <span className="font-mono font-semibold text-danger">DELETE</span> to confirm:
                </p>
                <input
                    type="text"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder="DELETE"
                    className="w-full rounded-lg border border-border-default bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-danger focus:ring-1 focus:ring-danger transition-colors font-mono"
                    autoFocus
                />
                <div className="flex items-center justify-end gap-2 mt-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-surface transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={typed !== "DELETE"}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-danger text-white hover:bg-danger/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Shared Card ──────────────────────────────────────── */
function SettingsCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-border-default bg-bg-card p-6">
            {children}
        </div>
    );
}

/* ─── X Integration ────────────────────────────────────── */
function XIntegrationRow() {
    const utils = api.useUtils();
    const { showToast } = useToast();
    const { data: status, isLoading } = api.x.getStatus.useQuery();

    const disconnectMutation = api.x.disconnect.useMutation({
        onSuccess: () => {
            void utils.x.getStatus.invalidate();
            showToast("X account disconnected", "success");
        },
    });
    const syncMutation = api.x.sync.useMutation({
        onSuccess: (data) => showToast(data.message, "success"),
        onError: (error) => showToast(error.message, "error"),
    });

    if (isLoading) {
        return (
            <div className="py-4 text-sm text-text-secondary animate-pulse">
                Loading...
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Integration Row */}
            <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-4">
                    {/* X Logo */}
                    <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-black border border-border-default">
                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            className="h-5 w-5 fill-white"
                        >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-text-primary">
                                X (Twitter)
                            </h3>
                            {status?.connected && (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold uppercase tracking-wide border border-emerald-500/20">
                                        Active
                                    </span>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">
                            {status?.connected
                                ? `${status.handle} · Import bookmarks & likes`
                                : "Import your bookmarks and liked posts"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {status?.connected ? (
                        <>
                            <button
                                onClick={() => syncMutation.mutate()}
                                disabled={syncMutation.isPending}
                                className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <span className={`material-symbols-outlined text-base ${syncMutation.isPending ? "animate-spin" : ""}`}>
                                    sync
                                </span>
                                {syncMutation.isPending ? "Syncing..." : "Sync Now"}
                            </button>
                            <button
                                onClick={() => disconnectMutation.mutate()}
                                className="px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10 rounded-xl transition-colors"
                            >
                                Disconnect
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => void signIn("twitter")}
                            className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            Connect
                        </button>
                    )}
                </div>
            </div>

            {/* Disconnected — Feature Highlights */}
            {!status?.connected && (
                <div className="flex gap-6 px-4 py-3 bg-bg-surface/50 rounded-xl border border-border-default">
                    {[
                        { icon: "bookmark", label: "Import Bookmarks" },
                        { icon: "auto_awesome", label: "Auto-Tagging" },
                        { icon: "lock", label: "Private & Secure" },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 text-xs text-text-secondary">
                            <span className="material-symbols-outlined text-sm text-emerald-400">{item.icon}</span>
                            {item.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Subscription Card ────────────────────────────────── */
function SubscriptionCard() {
    const { showToast } = useToast();
    const { data: subscription, isLoading } = api.subscription.getStatus.useQuery();
    const createCheckout = api.subscription.createCheckout.useMutation();
    const getPortalUrl = api.subscription.getPortalUrl.useMutation();

    const handleUpgrade = async () => {
        try {
            const { checkoutUrl } = await createCheckout.mutateAsync();
            window.location.href = checkoutUrl;
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Failed to start checkout", "error");
        }
    };

    const handleManage = async () => {
        try {
            const { portalUrl } = await getPortalUrl.mutateAsync();
            window.location.href = portalUrl;
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Failed to get portal URL", "error");
        }
    };

    if (isLoading) {
        return (
            <SettingsCard>
                <div className="animate-pulse space-y-4">
                    <div className="h-6 w-1/3 bg-bg-surface rounded" />
                    <div className="h-4 w-full bg-bg-surface rounded" />
                    <div className="h-10 w-full bg-bg-surface rounded" />
                </div>
            </SettingsCard>
        );
    }

    if (!subscription) return null;

    const isPro = subscription.plan === "PRO";
    const percent = subscription.usagePercent;

    return (
        <SettingsCard>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-[24px]">
                        workspace_premium
                    </span>
                    <div>
                        <h2 className="text-base font-semibold text-text-primary">
                            Your Plan
                        </h2>
                        <p className="text-xs text-text-secondary">
                            {isPro ? "Thanks for being a Pro member!" : "Upgrade to unlock more features"}
                        </p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full border text-xs font-medium uppercase tracking-wider ${isPro
                    ? "border-primary text-primary bg-primary/10"
                    : "border-text-secondary text-text-secondary"
                    }`}>
                    {subscription.planName} Tier
                </span>
            </div>

            <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-secondary">
                        Library Usage
                    </span>
                    <span className="text-text-primary font-medium">
                        {subscription.maxSaves === null
                            ? `${subscription.saveCount} saves (Unlimited)`
                            : `${subscription.saveCount} / ${subscription.maxSaves} saves`
                        }
                    </span>
                </div>
                <div className="w-full h-2 bg-bg-surface rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${isPro ? "bg-primary" : "bg-text-secondary"
                            }`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                </div>
            </div>

            {isPro ? (
                <button
                    onClick={handleManage}
                    disabled={getPortalUrl.isPending}
                    className="w-full py-2.5 bg-bg-surface text-text-primary text-sm font-medium rounded-xl hover:bg-bg-surface/80 transition-colors border border-border-default"
                >
                    {getPortalUrl.isPending ? "Loading..." : "Manage Subscription"}
                </button>
            ) : (
                <button
                    onClick={handleUpgrade}
                    disabled={createCheckout.isPending}
                    className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
                >
                    {createCheckout.isPending ? "Redirecting..." : "Upgrade to Pro"}
                </button>
            )}
        </SettingsCard>
    );
}

/* ─── AI Provider Card ─────────────────────────────────── */
function AIProviderCard() {
    const { data: aiStatus, isLoading } = api.ai.isConfigured.useQuery();

    if (isLoading) {
        return (
            <SettingsCard>
                <div className="animate-pulse space-y-3">
                    <div className="h-6 w-1/3 bg-bg-surface rounded" />
                    <div className="h-4 w-full bg-bg-surface rounded" />
                </div>
            </SettingsCard>
        );
    }

    return (
        <SettingsCard>
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-text-secondary">
                    psychology
                </span>
                AI Provider
            </h2>
            <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                        <span className="material-symbols-outlined text-primary text-[20px]">
                            auto_awesome
                        </span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-text-primary capitalize">
                                {aiStatus?.provider?.provider ?? "Not configured"}
                            </h3>
                            {aiStatus?.configured ? (
                                <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-semibold uppercase">
                                    Active
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 rounded-full bg-warning/20 text-warning text-[10px] font-semibold uppercase">
                                    Not Set
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-text-secondary">
                            {aiStatus?.configured
                                ? `Model: ${aiStatus.provider?.model ?? "default"} · Used for categorization & name suggestions`
                                : "Set AI_PROVIDER and the corresponding API key in your environment"}
                        </p>
                    </div>
                </div>
            </div>
        </SettingsCard>
    );
}
