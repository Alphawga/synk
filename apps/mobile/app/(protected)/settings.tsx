import { View, Text, TouchableOpacity, Alert, ScrollView, Switch } from "react-native";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/trpc";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Settings() {
    const { signOut } = useAuth();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const { colorScheme, toggleColorScheme } = useColorScheme();
    const insets = useSafeAreaInsets();

    const deleteMutation = api.user.deleteAccount.useMutation({
        onSuccess: async () => {
            await signOut();
            router.replace("/");
        },
        onError: (error) => {
            Alert.alert("Error", error.message);
            setIsDeleting(false);
        }
    });

    const handleDelete = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        setIsDeleting(true);
                        deleteMutation.mutate();
                    }
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-900" style={{ paddingTop: insets.top }}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View className="px-6 py-4 flex-row items-center border-b border-slate-200 dark:border-slate-800">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} className="text-slate-900 dark:text-white" color={colorScheme === "dark" ? "white" : "black"} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-900 dark:text-white">Settings</Text>
            </View>

            <ScrollView className="flex-1 px-4 py-6">

                {/* Appearance Section */}
                <View className="mb-8">
                    <Text className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider px-2">Appearance</Text>
                    <View className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <View className="flex-row items-center justify-between p-4">
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 items-center justify-center mr-3">
                                    <Ionicons name="moon" size={18} color="#6366f1" />
                                </View>
                                <Text className="text-slate-900 dark:text-white font-medium">Dark Mode</Text>
                            </View>
                            <Switch
                                value={colorScheme === "dark"}
                                onValueChange={toggleColorScheme}
                                trackColor={{ false: "#e2e8f0", true: "#818cf8" }}
                            />
                        </View>
                    </View>
                </View>

                {/* Account Section */}
                <View className="mb-8">
                    <Text className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider px-2">Account</Text>
                    <View className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                        <TouchableOpacity
                            onPress={() => signOut()}
                            className="p-4 flex-row items-center active:bg-slate-50 dark:active:bg-slate-700/50"
                        >
                            <View className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center mr-3">
                                <Ionicons name="log-out-outline" size={18} color={colorScheme === "dark" ? "#94a3b8" : "#475569"} />
                            </View>
                            <Text className="text-slate-900 dark:text-white flex-1 font-medium">Sign Out</Text>
                            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Data Section */}
                <View className="mb-8">
                    <Text className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider px-2">Data</Text>
                    <View className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 p-4">
                        <Text className="text-slate-900 dark:text-white font-medium mb-1">Export Data</Text>
                        <Text className="text-sm text-slate-500 dark:text-slate-400">Please visit the web application to export your data.</Text>
                    </View>
                </View>

                {/* Danger Zone */}
                <View className="mb-8">
                    <Text className="text-sm font-semibold text-red-500 mb-2 uppercase tracking-wider px-2">Danger Zone</Text>
                    <View className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-red-100 dark:border-red-900/30">
                        <TouchableOpacity
                            onPress={handleDelete}
                            disabled={isDeleting}
                            className="p-4 flex-row items-center active:bg-red-50 dark:active:bg-red-900/10"
                        >
                            <View className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 items-center justify-center mr-3">
                                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                            </View>
                            <Text className="text-red-600 font-medium">
                                {isDeleting ? "Deleting..." : "Delete Account"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="items-center mt-2 mb-10">
                    <Text className="text-xs text-slate-400">Synk Mobile v1.0.0</Text>
                </View>
            </ScrollView>
        </View>
    );
}
