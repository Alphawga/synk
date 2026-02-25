import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types.
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

/**
 * NextAuth.js configuration for Synk
 * Uses Credentials provider in dev mode for easy local testing
 */
export const authConfig = {
  providers: [
    GoogleProvider,
    TwitterProvider({
      clientId: process.env.AUTH_TWITTER_ID,
      clientSecret: process.env.AUTH_TWITTER_SECRET,
    }),
    // Dev mode: Simple credentials login (no external OAuth needed)
    CredentialsProvider({
      name: "Dev Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "dev@synk.local" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const email = credentials.email as string;

        // Find or create user in dev mode
        // Find or create user in dev mode
        const existingUser = await db.user.findUnique({
          where: { email },
        });

        const user = existingUser ?? (await db.user.create({
          data: {
            email,
            name: email.split("@")[0],
            image: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
          },
        }));

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt", // Required for Credentials provider
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
      },
    }),
  },
  events: {
    signIn: async ({ user }) => {
      if (user.email) {
        try {
          await db.waitlist.upsert({
            where: {
              email_platform: {
                email: user.email,
                platform: "extension",
              },
            },
            update: { userId: user.id },
            create: {
              email: user.email,
              platform: "extension",
              userId: user.id,
            },
          });
        } catch {
          // Silently fail — don't block sign-in if waitlist insert fails
          console.error("[WAITLIST] Failed to auto-join waitlist for", user.email);
        }
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
} satisfies NextAuthConfig;
