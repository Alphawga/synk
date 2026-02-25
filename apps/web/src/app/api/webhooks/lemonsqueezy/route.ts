/**
 * LemonSqueezy Webhook Handler
 *
 * Receives subscription lifecycle events from LemonSqueezy and updates
 * the database accordingly. Events:
 * - subscription_created  → set plan to PRO, create Subscription record
 * - subscription_updated  → update status, period end, cancel flags
 * - subscription_cancelled / subscription_expired → set plan back to FREE
 */

import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { verifyWebhookSignature } from "~/lib/lemonsqueezy";

// ─── Types ───────────────────────────────────────────────
interface LsWebhookEvent {
    meta: {
        event_name: string;
        custom_data?: {
            user_id?: string;
        };
    };
    data: {
        id: string;
        attributes: {
            customer_id: number;
            variant_id: number;
            status: string;
            renews_at: string | null;
            ends_at: string | null;
            cancelled: boolean;
        };
    };
}

// ─── Handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        // 1. Read raw body for signature verification
        const rawBody = await req.text();
        const signature = req.headers.get("x-signature");

        if (!signature) {
            return NextResponse.json(
                { error: "Missing signature" },
                { status: 401 }
            );
        }

        // 2. Verify webhook signature
        const isValid = verifyWebhookSignature(rawBody, signature);
        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            );
        }

        // 3. Parse event
        const event = JSON.parse(rawBody) as LsWebhookEvent;
        const eventName = event.meta.event_name;
        const subscriptionId = event.data.id;
        const customerId = String(event.data.attributes.customer_id);
        const variantId = String(event.data.attributes.variant_id);
        const status = event.data.attributes.status;
        const userId = event.meta.custom_data?.user_id;

        console.log(
            `[LS Webhook] Event: ${eventName}, Subscription: ${subscriptionId}, User: ${userId ?? "unknown"}`
        );

        // 4. Handle events
        switch (eventName) {
            case "subscription_created": {
                if (!userId) {
                    console.error("[LS Webhook] Missing user_id in custom_data");
                    return NextResponse.json(
                        { error: "Missing user_id" },
                        { status: 400 }
                    );
                }

                // Create/update subscription record + set user plan to PRO
                await db.$transaction([
                    db.subscription.upsert({
                        where: { lsSubscriptionId: subscriptionId },
                        create: {
                            userId,
                            lsSubscriptionId: subscriptionId,
                            lsCustomerId: customerId,
                            lsVariantId: variantId,
                            status,
                            currentPeriodEnd: event.data.attributes.renews_at
                                ? new Date(event.data.attributes.renews_at)
                                : null,
                        },
                        update: {
                            status,
                            lsCustomerId: customerId,
                            lsVariantId: variantId,
                            currentPeriodEnd: event.data.attributes.renews_at
                                ? new Date(event.data.attributes.renews_at)
                                : null,
                        },
                    }),
                    db.user.update({
                        where: { id: userId },
                        data: {
                            plan: "PRO",
                            lsCustomerId: customerId,
                            lsSubscriptionId: subscriptionId,
                        },
                    }),
                ]);
                break;
            }

            case "subscription_updated": {
                // Update subscription status
                const sub = await db.subscription.findUnique({
                    where: { lsSubscriptionId: subscriptionId },
                });

                if (sub) {
                    await db.subscription.update({
                        where: { lsSubscriptionId: subscriptionId },
                        data: {
                            status,
                            currentPeriodEnd: event.data.attributes.renews_at
                                ? new Date(event.data.attributes.renews_at)
                                : null,
                            cancelAtPeriodEnd:
                                event.data.attributes.cancelled ?? false,
                        },
                    });

                    // If status changed to active, ensure user is on PRO
                    if (status === "active") {
                        await db.user.update({
                            where: { id: sub.userId },
                            data: { plan: "PRO" },
                        });
                    }
                }
                break;
            }

            case "subscription_cancelled":
            case "subscription_expired": {
                const existingSub = await db.subscription.findUnique({
                    where: { lsSubscriptionId: subscriptionId },
                });

                if (existingSub) {
                    // Update subscription status
                    await db.subscription.update({
                        where: { lsSubscriptionId: subscriptionId },
                        data: {
                            status: eventName === "subscription_cancelled"
                                ? "cancelled"
                                : "expired",
                        },
                    });

                    // Downgrade user to FREE
                    await db.user.update({
                        where: { id: existingSub.userId },
                        data: { plan: "FREE" },
                    });
                }
                break;
            }

            default:
                console.log(`[LS Webhook] Unhandled event: ${eventName}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("[LS Webhook] Error:", error);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}
