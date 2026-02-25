import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../lib/auth";
import { TRPCProvider } from "../lib/trpc";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ShareIntentHandler from "../components/ShareIntentHandler";

function RootLayoutNav() {
    const { token, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inProtectedGroup = segments[0] === "(protected)";

        if (!token && inProtectedGroup) {
            // Redirect to sign-in if not authenticated
            router.replace("/");
        } else if (token && !inProtectedGroup) {
            // Redirect to dashboard if authenticated
            router.replace("/(protected)/dashboard");
        }
    }, [token, isLoading, segments]);

    return <Slot />;
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <TRPCProvider>
                <SafeAreaProvider>
                    <RootLayoutNav />
                    <ShareIntentHandler />
                </SafeAreaProvider>
            </TRPCProvider>
        </AuthProvider>
    );
}
