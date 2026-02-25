import { View, Text, TouchableOpacity, Image, Linking } from "react-native";
import { useAuth } from "../lib/auth";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-linking";
import { API_URL } from "../lib/trpc";

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
    const { signIn } = useAuth();

    const handleSignIn = async () => {
        // Generate deep link scheme
        const redirectUrl = makeRedirectUri({
            scheme: "synk",
            path: "auth",
        });

        // In a real implementation, we would point to the Next.js auth endpoint
        // For MVP, if we are on simulator, standard OAuth flows might be tricky without full setup
        // We'll mimic the extension flow: open browser -> login -> redirect back

        // For now, let's use a debug login if we can't easily hit localhost auth
        // Or point to the web app's signin page that redirects back

        const authUrl = `${API_URL}/api/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl)}`;

        // For MVP demo, since we don't have the web-side redirect handler set up yet to redirect to synk://
        // We will simulate a successful login for development if needed, OR relies on the user ensuring API_URL is accessible.
        // Ideally: Web app needs a page that handles the auth and redirects to `synk://auth?token=...`

        // Let's assume we implement the web-side redirect later.
        // For now, just open browser.

        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

        if (result.type === "success" && result.url) {
            // Parse token from URL if returned
            // synk://auth?token=xyz
            const url = new URL(result.url);
            const token = url.searchParams.get("token");
            if (token) {
                await signIn(token);
            }
        }
    };

    return (
        <View className="flex-1 items-center justify-center bg-white p-8">
            <View className="items-center mb-12">
                <View className="h-20 w-20 rounded-2xl bg-blue-600 items-center justify-center mb-4 shadow-lg">
                    <Text className="text-4xl text-white font-bold">S</Text>
                </View>
                <Text className="text-3xl font-bold text-slate-900">Synk</Text>
                <Text className="text-slate-500 mt-2 text-center">
                    Your improved browser history
                </Text>
            </View>

            <TouchableOpacity
                onPress={handleSignIn}
                className="w-full bg-blue-600 py-4 rounded-xl items-center shadow-md active:bg-blue-700"
            >
                <Text className="text-white font-semibold text-lg">Sign In</Text>
            </TouchableOpacity>

            <Text className="text-xs text-slate-400 mt-8 text-center">
                Powered by AI & Cloud Sync
            </Text>
        </View>
    );
}
