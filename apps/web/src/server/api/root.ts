import { categoriesRouter } from "~/server/api/routers/categories";
import { foldersRouter } from "~/server/api/routers/folders";
import { aiRouter } from "~/server/api/routers/ai";
import { savesRouter } from "~/server/api/routers/saves";
import { sessionsRouter } from "~/server/api/routers/sessions";
import { subscriptionRouter } from "~/server/api/routers/subscription";
import { userRouter } from "~/server/api/routers/user";
import { waitlistRouter } from "~/server/api/routers/waitlist";
import { xRouter } from "~/server/api/routers/x";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  categories: categoriesRouter,
  folders: foldersRouter,
  ai: aiRouter,
  saves: savesRouter,
  sessions: sessionsRouter,
  subscription: subscriptionRouter,
  user: userRouter,
  waitlist: waitlistRouter,
  x: xRouter,
});

export type AppRouter = typeof appRouter;

/**
 * Server-side caller for the tRPC API
 */
export const createCaller = createCallerFactory(appRouter);

