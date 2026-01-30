"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { toast } from "sonner";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error: unknown) {
            const err = error as { code?: string; message: string };
            console.error("Login failed", err);
            if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
                toast.error("Lỗi Cấu hình Firebase: Vui lòng bật 'Google Sign-in' trong Firebase Console.", {
                    duration: 10000,
                    action: {
                        label: "Đã hiểu",
                        onClick: () => console.log("User acknowledged config error")
                    }
                });
            } else {
                toast.error("Đăng nhập thất bại: " + err.message);
            }
        }
    };

    const logout = async () => {
        // Clear local store dynamically
        const { usePortfolioStore } = await import("@/store/portfolioStore");
        const { clearData } = usePortfolioStore.getState();
        clearData();

        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
