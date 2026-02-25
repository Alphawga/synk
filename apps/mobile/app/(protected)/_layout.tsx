import { Stack } from "expo-router";

export default function ProtectedLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#fff',
                },
                headerShadowVisible: false,
                headerTitleStyle: {
                    fontWeight: '600',
                },
            }}
        />
    );
}
