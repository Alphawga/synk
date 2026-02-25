import { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

interface AuthContextType {
    token: string | null;
    isLoading: boolean;
    signIn: (token: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for stored token on mount
        SecureStore.getItemAsync("sessionToken")
            .then((storedToken) => {
                if (storedToken) {
                    setToken(storedToken);
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    const signIn = async (newToken: string) => {
        await SecureStore.setItemAsync("sessionToken", newToken);
        setToken(newToken);
    };

    const signOut = async () => {
        await SecureStore.deleteItemAsync("sessionToken");
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
