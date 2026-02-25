import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import React, { useState } from "react";
import { api } from "@synk/api-client";
export { api };
import { useAuth } from "./auth";
import superjson from "superjson";
import Constants from "expo-constants";

export const API_URL = (() => {
    // Use localhost for dev, but generic instructions for prod
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(":")[0];

    if (!localhost) {
        // Production URL or fallback
        return process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
    }

    // Emulator/Simulator uses localhost, real device uses IP
    return `http://${localhost}:3000`;
})();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
    const { token } = useAuth();

    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                retry: 1,
            },
        },
    }));

    const [trpcClient] = useState(() =>
        api.createClient({
            links: [
                httpBatchLink({
                    url: `${API_URL}/api/trpc`,
                    transformer: superjson,
                    async headers() {
                        const headers = new Map<string, string>();
                        headers.set("x-trpc-source", "expo-react");

                        if (token) {
                            headers.set("Authorization", `Bearer ${token}`);
                        }

                        return Object.fromEntries(headers);
                    },
                }),
            ],
        })
    );

    return (
        <api.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </api.Provider>
    );
}
