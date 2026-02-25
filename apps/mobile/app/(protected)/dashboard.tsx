import { View, Text, FlatList, TouchableOpacity, RefreshControl, Linking } from "react-native";
import { api } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import type { RouterOutputs } from "@synk/api-client";

type Session = RouterOutputs["sessions"]["getAll"]["sessions"][number];

export default function Dashboard() {
    const { signOut } = useAuth();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    const { data, refetch, isLoading } = api.sessions.getAll.useQuery({ limit: 10 });

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const renderSession = ({ item }: { item: Session }) => (
        <View className="bg-white rounded-xl p-4 mb-4 border border-slate-100 shadow-sm">
            <View className="flex-row justify-between items-center mb-3">
                <Text className="font-semibold text-lg text-slate-900">
                    {item.name ?? new Date(item.createdAt).toLocaleDateString()}
                </Text>
                <View className="bg-slate-100 px-2 py-1 rounded-full">
                    <Text className="text-slate-600 text-xs">
                        {item._count?.saves ?? 0} items
                    </Text>
                </View>
            </View>

            {item.saves.slice(0, 3).map((save) => (
                <TouchableOpacity
                    key={save.id}
                    onPress={() => Linking.openURL(save.url)}
                    className="flex-row items-center py-2 border-t border-slate-50"
                >
                    <View className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                    <Text className="text-slate-700 flex-1 truncate" numberOfLines={1}>
                        {save.title}
                    </Text>
                </TouchableOpacity>
            ))}

            {item.saves.length > 3 && (
                <Text className="text-xs text-slate-400 mt-2 italic text-center">
                    + {item.saves.length - 3} more
                </Text>
            )}
        </View>
    );

    return (
        <View className="flex-1 bg-slate-50">
            <Stack.Screen
                options={{
                    title: "Your Sessions",
                    headerRight: () => (
                        <TouchableOpacity onPress={() => router.push("/(protected)/settings")}>
                            <Text className="text-blue-600 font-medium">Settings</Text>
                        </TouchableOpacity>
                    )
                }}
            />

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <Text>Loading sessions...</Text>
                </View>
            ) : (
                <FlatList
                    data={data?.sessions}
                    renderItem={renderSession}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View className="items-center py-12">
                            <Text className="text-slate-500">No sessions found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
