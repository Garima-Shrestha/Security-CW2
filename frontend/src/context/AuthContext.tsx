"use client";

import { createContext, useState, ReactNode, useEffect } from "react";
import api, { setAuthToken } from "@/lib/axios";
import { User } from "@/types/auth.types";

interface AuthContextValue {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    loginStepOne: (email: string, password: string) => Promise<{ requiresTotp: boolean; preAuthToken?: string }>;
    loginStepTwo: (preAuthToken: string, code: string) => Promise<void>;
    logout: () => void;
    setUserAndToken: (user: User, token: string) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Rehydrate session on page load/refresh from sessionStorage
    useEffect(() => {
        const storedToken = sessionStorage.getItem("auth_token");
        const storedUser = sessionStorage.getItem("auth_user");
        if (storedToken && storedUser) {
            setAuthToken(storedToken);
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    function setUserAndToken(u: User, t: string) {
        setAuthToken(t);
        setToken(t);
        setUser(u);
        sessionStorage.setItem("auth_token", t);
        sessionStorage.setItem("auth_user", JSON.stringify(u));
    }

    async function loginStepOne(email: string, password: string) {
        setIsLoading(true);
        try {
            const res = await api.post("/api/auth/login", { email, password });
            const { requiresTotp, token: accessToken, data, preAuthToken } = res.data;

            if (!requiresTotp && accessToken && data) {
                setUserAndToken(data, accessToken);
            }

            return { requiresTotp, preAuthToken };
        } finally {
            setIsLoading(false);
        }
    }

    async function loginStepTwo(preAuthToken: string, code: string) {
        setIsLoading(true);
        try {
            const res = await api.post("/api/auth/verify-totp", { preAuthToken, code });
            setUserAndToken(res.data.data, res.data.token);
        } finally {
            setIsLoading(false);
        }
    }

    function logout() {
        setAuthToken(null);
        setToken(null);
        setUser(null);
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("auth_user");
    }

    return (
        <AuthContext.Provider
            value={{ user, token, isLoading, loginStepOne, loginStepTwo, logout, setUserAndToken }}
        >
            {children}
        </AuthContext.Provider>
    );
}