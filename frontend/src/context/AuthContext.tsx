"use client";

import { createContext, useState, ReactNode, useEffect } from "react";
import api, { setAuthToken } from "@/lib/axios";
import { User } from "@/types/auth.types";

interface AuthContextValue {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isInitializing: boolean;
    loginStepOne: (email: string, password: string, captchaToken?: string) => Promise<{ requiresTotp: boolean; preAuthToken?: string; user?: User }>;
    loginStepTwo: (preAuthToken: string, code: string) => Promise<User>;
    logout: () => Promise<void>;
    setUserAndToken: (user: User, token: string) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitializing, setIsInitializing] = useState(true);

    // Rehydrate session on page load/refresh from sessionStorage
    useEffect(() => {
        const storedToken = localStorage.getItem("auth_token");
        const storedUser = localStorage.getItem("auth_user");
        if (storedToken && storedUser) {
            setAuthToken(storedToken);
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
        setIsInitializing(false);
    }, []);

    function setUserAndToken(u: User, t: string) {
        setAuthToken(t);
        setToken(t);
        setUser(u);
        localStorage.setItem("auth_token", t);
        localStorage.setItem("auth_user", JSON.stringify(u));
    }

    async function loginStepOne(email: string, password: string, captchaToken?: string) {
        setIsLoading(true);
        try {
            const res = await api.post("/api/auth/login", { email, password, captchaToken });
            const { requiresTotp, token: accessToken, data, preAuthToken } = res.data;

            if (!requiresTotp && accessToken && data) {
                setUserAndToken(data, accessToken);
            }

            return { requiresTotp, preAuthToken, user: data as User | undefined };
        } finally {
            setIsLoading(false);
        }
    }

    async function loginStepTwo(preAuthToken: string, code: string) {
        setIsLoading(true);
        try {
            const res = await api.post("/api/auth/verify-totp", { preAuthToken, code });
            setUserAndToken(res.data.data, res.data.token);
            return res.data.data as User;
        } finally {
            setIsLoading(false);
        }
    }

    async function logout() {
        try {
            await api.post("/api/auth/logout");
        } catch {
            // even if the server call fails, still clear client-side state
        }
        setAuthToken(null);
        setToken(null);
        setUser(null);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
    }

    return (
        <AuthContext.Provider
            value={{ user, token, isLoading, isInitializing, loginStepOne, loginStepTwo, logout, setUserAndToken }}
        >
            {children}
        </AuthContext.Provider>
    );
}