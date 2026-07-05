"use client";

import { createContext, useState, ReactNode } from "react";
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
    const [isLoading, setIsLoading] = useState(false);

    function setUserAndToken(u: User, t: string) {
        setAuthToken(t);
        setToken(t);
        setUser(u);
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
    }

    return (
        <AuthContext.Provider
            value={{ user, token, isLoading, loginStepOne, loginStepTwo, logout, setUserAndToken }}
        >
            {children}
        </AuthContext.Provider>
    );
}