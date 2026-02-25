import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

export const waitlistRouter = createTRPCRouter({
    join: protectedProcedure
        .input(z.object({
            platform: z.enum(["extension", "mobile", "general"]).default("general"),
        }))
        .mutation(async ({ ctx, input }) => {
            const email = ctx.session.user.email;
            if (!email) {
                throw new Error("Email is required to join the waitlist");
            }

            await ctx.db.waitlist.upsert({
                where: {
                    email_platform: {
                        email,
                        platform: input.platform,
                    },
                },
                create: {
                    email,
                    platform: input.platform,
                    userId: ctx.session.user.id,
                },
                update: {},
            });

            return { success: true };
        }),

    status: protectedProcedure
        .query(async ({ ctx }) => {
            const email = ctx.session.user.email;
            if (!email) return { joined: [] };

            const entries = await ctx.db.waitlist.findMany({
                where: { email },
                select: { platform: true, createdAt: true },
            });

            return {
                joined: entries.map((e) => e.platform),
            };
        }),

    adminStats: protectedProcedure
        .query(async ({ ctx }) => {
            const email = ctx.session.user.email;
            if (!email || !ADMIN_EMAILS.includes(email)) {
                throw new Error("Unauthorized");
            }

            const [entries, totalCount] = await Promise.all([
                ctx.db.waitlist.findMany({
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        email: true,
                        platform: true,
                        createdAt: true,
                    },
                }),
                ctx.db.waitlist.count(),
            ]);

            return {
                total: totalCount,
                entries,
            };
        }),
});
