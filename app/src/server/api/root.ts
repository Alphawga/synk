import { savesRouter } from "~/server/api/routers/saves";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * Synk API Router
 */
export const appRouter = createTRPCRouter({
  saves: savesRouter,
});

export type AppRouter = typeof appRouter;

/**
 * Server-side caller for the tRPC API
 */
export const createCaller = createCallerFactory(appRouter);
