/**
 * Subscription Router
 *
 * Handles plan status, checkout creation, and billing portal access
 * via LemonSqueezy integration.
 */

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
    createCheckout,
    getCustomerPortalUrl,
    PLAN_LIMITS,
} from "~/lib/lemonsqueezy";

export const subscriptionRouter = createTRPCRouter({
    /**
     * Get the current user's subscription status, plan, and usage
     */
    getStatus: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // Get user with subscription
        const user = await ctx.db.user.findUniqueOrThrow({
            where: { id: userId },
            select: {
                plan: true,
                subscription: {
                    select: {
                        status: true,
                        currentPeriodEnd: true,
                        cancelAtPeriodEnd: true,
                    },
                },
            },
        });

        // Count saves for usage tracking
        const saveCount = await ctx.db.save.count({
            where: {
                userId,
                deletedAt: null,
            },
        });

        const plan = user.plan;
        const limits = PLAN_LIMITS[plan];

        return {
            plan,
            planName: limits.name,
            saveCount,
            maxSaves: limits.maxSaves === Infinity ? null : limits.maxSaves,
            usagePercent:
                limits.maxSaves === Infinity
                    ? 0
                    : Math.round((saveCount / limits.maxSaves) * 100),
            subscription: user.subscription
                ? {
                    status: user.subscription.status,
                    currentPeriodEnd: user.subscription.currentPeriodEnd,
                    cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
                }
                : null,
        };
    }),

    /**
     * Create a LemonSqueezy checkout URL for upgrading to Pro
     */
    createCheckout: protectedProcedure.mutation(async ({ ctx }) => {
        const user = ctx.session.user;

        if (!user.email) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Email is required to create a checkout",
            });
        }

        // Check if already on Pro
        const dbUser = await ctx.db.user.findUniqueOrThrow({
            where: { id: user.id },
            select: { plan: true },
        });

        if (dbUser.plan === "PRO") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "You are already on the Pro plan",
            });
        }

        const checkoutUrl = await createCheckout({
            userId: user.id,
            email: user.email,
            name: user.name ?? undefined,
        });

        return { checkoutUrl };
    }),

    /**
     * Get the LemonSqueezy customer portal URL for managing subscription
     */
    getPortalUrl: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        const subscription = await ctx.db.subscription.findUnique({
            where: { userId },
        });

        if (!subscription) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "No active subscription found",
            });
        }

        const portalUrl = await getCustomerPortalUrl(
            subscription.lsSubscriptionId
        );

        return { portalUrl };
    }),
});
