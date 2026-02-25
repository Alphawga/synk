import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
    // Delete user account and all data
    deleteAccount: protectedProcedure
        .mutation(async ({ ctx }) => {
            // Soft delete user (or hard, depending on requirements)
            // For privacy compliance, usually hard delete is safer, or anonymize
            // Cascading delete in Prisma usually handles related data if configured

            // Let's do a hard delete for simplicity and compliance
            return ctx.db.user.delete({
                where: { id: ctx.session.user.id },
            });
        }),

    // Export all user data as JSON
    exportData: protectedProcedure
        .query(async ({ ctx }) => {
            const sessions = await ctx.db.saveSession.findMany({
                where: { userId: ctx.session.user.id },
                include: {
                    saves: true
                }
            });

            const orphanedSaves = await ctx.db.save.findMany({
                where: {
                    userId: ctx.session.user.id,
                    sessionId: null
                }
            });

            return {
                user: {
                    id: ctx.session.user.id,
                    email: ctx.session.user.email,
                    name: ctx.session.user.name,
                },
                sessions,
                orphanedSaves,
                exportedAt: new Date().toISOString()
            };
        }),
});
