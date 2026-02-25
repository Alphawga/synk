import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { TwitterApi } from "twitter-api-v2";

export const xRouter = createTRPCRouter({
    // Get connected account status
    getStatus: protectedProcedure.query(async ({ ctx }) => {
        const account = await ctx.db.account.findFirst({
            where: {
                userId: ctx.session.user.id,
                provider: "twitter",
            },
            select: {
                providerAccountId: true,
                access_token: true,
            },
        });

        if (!account) return { connected: false };

        return {
            connected: true,
            handle: `@${account.providerAccountId}`,
            lastSync: null,
        };
    }),

    // Disconnect X account
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
        await ctx.db.account.deleteMany({
            where: {
                userId: ctx.session.user.id,
                provider: "twitter",
            },
        });
        return { success: true };
    }),

    // Trigger Sync — fetches likes from Twitter API
    sync: protectedProcedure.mutation(async ({ ctx }) => {
        const account = await ctx.db.account.findFirst({
            where: {
                userId: ctx.session.user.id,
                provider: "twitter",
            },
        });

        if (!account?.access_token) {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message: "Twitter account not connected or token missing. Try reconnecting.",
            });
        }

        const client = new TwitterApi(account.access_token);
        const me = await client.v2.me().catch(() => null);

        if (!me?.data?.id) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Twitter token expired. Please reconnect your X account.",
            });
        }

        const userId = me.data.id;
        let savedCount = 0;

        // ── Fetch Liked Tweets ─────────────────────────
        try {
            const likes = await client.v2.userLikedTweets(userId, {
                max_results: 50,
                "tweet.fields": ["created_at", "public_metrics", "entities", "author_id"],
                expansions: ["author_id"],
                "user.fields": ["name", "username", "profile_image_url"],
            });

            const authorMap = new Map<string, { name: string; username: string; profileImageUrl?: string }>();
            if (likes.includes?.users) {
                for (const user of likes.includes.users) {
                    authorMap.set(user.id, {
                        name: user.name,
                        username: user.username,
                        profileImageUrl: user.profile_image_url,
                    });
                }
            }

            if (likes.data?.data) {
                for (const tweet of likes.data.data) {
                    const tweetUrl = `https://x.com/i/status/${tweet.id}`;
                    const author = tweet.author_id ? authorMap.get(tweet.author_id) : undefined;

                    // Skip if already saved (upsert by sourceId)
                    const existing = await ctx.db.save.findFirst({
                        where: {
                            userId: ctx.session.user.id,
                            sourceId: tweet.id,
                            source: "X_LIKE",
                        },
                    });

                    if (existing) continue;

                    await ctx.db.save.create({
                        data: {
                            url: tweetUrl,
                            title: tweet.text?.slice(0, 100) ?? "Tweet",
                            domain: "x.com",
                            favicon: "https://abs.twimg.com/favicons/twitter.3.ico",
                            source: "X_LIKE",
                            sourceId: tweet.id,
                            userId: ctx.session.user.id,
                            author: author ? {
                                name: author.name,
                                handle: `@${author.username}`,
                                avatar: author.profileImageUrl,
                            } : undefined,
                            metadata: {
                                likes: tweet.public_metrics?.like_count,
                                retweets: tweet.public_metrics?.retweet_count,
                                createdAt: tweet.created_at,
                            },
                        },
                    });
                    savedCount++;
                }
            }
        } catch (error) {
            console.error("Failed to fetch likes:", error);
            // Continue to bookmarks even if likes fail
        }

        // ── Fetch Bookmarks ────────────────────────────
        try {
            const bookmarks = await client.v2.bookmarks({
                max_results: 50,
                "tweet.fields": ["created_at", "public_metrics", "entities", "author_id"],
                expansions: ["author_id"],
                "user.fields": ["name", "username", "profile_image_url"],
            });

            const authorMap = new Map<string, { name: string; username: string; profileImageUrl?: string }>();
            if (bookmarks.includes?.users) {
                for (const user of bookmarks.includes.users) {
                    authorMap.set(user.id, {
                        name: user.name,
                        username: user.username,
                        profileImageUrl: user.profile_image_url,
                    });
                }
            }

            if (bookmarks.data?.data) {
                for (const tweet of bookmarks.data.data) {
                    const tweetUrl = `https://x.com/i/status/${tweet.id}`;
                    const author = tweet.author_id ? authorMap.get(tweet.author_id) : undefined;

                    const existing = await ctx.db.save.findFirst({
                        where: {
                            userId: ctx.session.user.id,
                            sourceId: tweet.id,
                            source: "X_BOOKMARK",
                        },
                    });

                    if (existing) continue;

                    await ctx.db.save.create({
                        data: {
                            url: tweetUrl,
                            title: tweet.text?.slice(0, 100) ?? "Bookmarked Tweet",
                            domain: "x.com",
                            favicon: "https://abs.twimg.com/favicons/twitter.3.ico",
                            source: "X_BOOKMARK",
                            sourceId: tweet.id,
                            userId: ctx.session.user.id,
                            author: author ? {
                                name: author.name,
                                handle: `@${author.username}`,
                                avatar: author.profileImageUrl,
                            } : undefined,
                            metadata: {
                                likes: tweet.public_metrics?.like_count,
                                retweets: tweet.public_metrics?.retweet_count,
                                createdAt: tweet.created_at,
                            },
                        },
                    });
                    savedCount++;
                }
            }
        } catch (error) {
            console.error("Failed to fetch bookmarks:", error);
            // Bookmarks may fail if user hasn't granted bookmark scope
        }

        return {
            success: true,
            message: `Synced ${savedCount} new items from X`,
            itemsFound: savedCount,
        };
    }),
});
