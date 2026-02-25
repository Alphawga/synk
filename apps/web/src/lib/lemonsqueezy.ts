/**
 * LemonSqueezy API Client
 *
 * Handles checkout creation, customer portal URLs, and webhook signature
 * verification for the Synk subscription system.
 */

import crypto from "crypto";

// ─── Config ──────────────────────────────────────────────
const LS_API_BASE = "https://api.lemonsqueezy.com/v1";

function getApiKey(): string {
    const key = process.env.LEMONSQUEEZY_API_KEY;
    if (!key) throw new Error("LEMONSQUEEZY_API_KEY is not set");
    return key;
}

function getStoreId(): string {
    const id = process.env.LEMONSQUEEZY_STORE_ID;
    if (!id) throw new Error("LEMONSQUEEZY_STORE_ID is not set");
    return id;
}

function getProVariantId(): string {
    const id = process.env.LEMONSQUEEZY_PRO_VARIANT_ID;
    if (!id) throw new Error("LEMONSQUEEZY_PRO_VARIANT_ID is not set");
    return id;
}

function getWebhookSecret(): string {
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    if (!secret) throw new Error("LEMONSQUEEZY_WEBHOOK_SECRET is not set");
    return secret;
}

// ─── Types ───────────────────────────────────────────────
interface LsCheckoutResponse {
    data: {
        id: string;
        attributes: {
            url: string;
        };
    };
}

interface LsSubscriptionResponse {
    data: {
        id: string;
        attributes: {
            urls: {
                customer_portal: string;
                update_payment_method: string;
            };
        };
    };
}

// ─── Plan Limits ─────────────────────────────────────────
export const PLAN_LIMITS = {
    FREE: {
        maxSaves: 500,
        name: "Free",
    },
    PRO: {
        maxSaves: Infinity,
        name: "Pro",
    },
} as const;

// ─── Checkout ────────────────────────────────────────────
export async function createCheckout(input: {
    userId: string;
    email: string;
    name?: string;
}): Promise<string> {
    const response = await fetch(`${LS_API_BASE}/checkouts`, {
        method: "POST",
        headers: {
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
            Authorization: `Bearer ${getApiKey()}`,
        },
        body: JSON.stringify({
            data: {
                type: "checkouts",
                attributes: {
                    checkout_data: {
                        email: input.email,
                        name: input.name ?? undefined,
                        custom: {
                            user_id: input.userId,
                        },
                    },
                    product_options: {
                        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://synk.ai"}/dashboard/settings?upgraded=true`,
                    },
                },
                relationships: {
                    store: {
                        data: {
                            type: "stores",
                            id: getStoreId(),
                        },
                    },
                    variant: {
                        data: {
                            type: "variants",
                            id: getProVariantId(),
                        },
                    },
                },
            },
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("LemonSqueezy checkout error:", errorBody);
        throw new Error("Failed to create checkout session");
    }

    const data = (await response.json()) as LsCheckoutResponse;
    return data.data.attributes.url;
}

// ─── Customer Portal ─────────────────────────────────────
export async function getCustomerPortalUrl(
    lsSubscriptionId: string
): Promise<string> {
    const response = await fetch(
        `${LS_API_BASE}/subscriptions/${lsSubscriptionId}`,
        {
            method: "GET",
            headers: {
                Accept: "application/vnd.api+json",
                Authorization: `Bearer ${getApiKey()}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch subscription details");
    }

    const data = (await response.json()) as LsSubscriptionResponse;
    return data.data.attributes.urls.customer_portal;
}

// ─── Webhook Verification ────────────────────────────────
export function verifyWebhookSignature(
    payload: string,
    signature: string
): boolean {
    const secret = getWebhookSecret();
    const hmac = crypto.createHmac("sha256", secret);
    const digest = hmac.update(payload).digest("hex");
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(digest)
    );
}
