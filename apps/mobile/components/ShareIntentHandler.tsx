import { ShareIntent, ShareIntentProvider, useShareIntent } from "expo-share-intent";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { api } from "../lib/trpc";
import { useAuth } from "../lib/auth";

export default function ShareIntentHandler() {
    return (
        <ShareIntentProvider>
            <ShareHandler />
        </ShareIntentProvider>
    );
}

function ShareHandler() {
    const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
    const router = useRouter();
    const { token } = useAuth();
    const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

    const saveMutation = api.saves.create.useMutation({
        onSuccess: () => {
            setStatus("success");
            // Wait a moment then close
            setTimeout(() => {
                resetShareIntent();
                router.replace("/(protected)/dashboard");
            }, 1500);
        },
        onError: () => {
            setStatus("error");
        }
    });

    useEffect(() => {
        if (hasShareIntent && shareIntent && (shareIntent.type === "weburl" || shareIntent.type === "text")) {
            // Check if we are logged in
            if (!token) {
                return;
            }

            setStatus("saving");

            // Extract URL from share intent
            // For weburl, use shareIntent.value (some versions) or shareIntent.webUrl or handle text
            // Types seem to suggest 'value' might not exist on the base type, casting or checking properties
            const url = (shareIntent as any).value || (shareIntent as any).webUrl || (shareIntent as any).text;

            if (!url) {
                setStatus("error");
                return;
            }

            // Title might not always be available, fall back to URL or "Shared Link"
            const title = "Shared Link";

            saveMutation.mutate({
                url: url,
                title: title,
                source: "MOBILE_SHARE"
            });
        }
    }, [hasShareIntent, shareIntent, token]);

    if (!hasShareIntent) return null;

    return (
        <View className="flex-1 items-center justify-center bg-white p-6">
            <View className="bg-slate-50 p-6 rounded-2xl w-full items-center shadow-sm border border-slate-100">
                <Text className="font-bold text-lg mb-4 text-slate-800">
                    Saving to Synk...
                </Text>

                {status === "saving" && (
                    <ActivityIndicator size="large" color="#2563EB" />
                )}

                {status === "success" && (
                    <View className="items-center">
                        <View className="h-12 w-12 bg-green-100 rounded-full items-center justify-center mb-2">
                            <Text className="text-2xl">✓</Text>
                        </View>
                        <Text className="text-green-600 font-medium">Saved Successfully!</Text>
                    </View>
                )}

                {status === "error" && (
                    <View className="items-center">
                        <Text className="text-red-500 font-medium mb-2">Failed to save</Text>
                        <TouchableOpacity
                            onPress={() => resetShareIntent()}
                            className="bg-slate-200 px-4 py-2 rounded-lg"
                        >
                            <Text>Close</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {(shareIntent as any)?.value && (
                    <Text className="text-xs text-slate-400 mt-4 text-center px-4" numberOfLines={2}>
                        {(shareIntent as any).value}
                    </Text>
                )}
            </View>
        </View>
    );
}
