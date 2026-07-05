import axios from "axios";
import { getCsrfToken } from "./csrf";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// in-memory token, set by AuthContext on login
let authToken: string | null = null;
export function setAuthToken(token: string | null) {
    authToken = token;
}

const MUTATING_METHODS = ["post", "put", "patch", "delete"];

api.interceptors.request.use(async (config) => {
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }

    // Google OAuth requests require the CSRF cookie because only this route is CSRF-protected.
    if (config.url?.includes("/api/auth/google") && MUTATING_METHODS.includes(config.method || "")) {
        const csrfToken = await getCsrfToken();
        config.headers["X-CSRF-Token"] = csrfToken;
    }

    return config;
});

export default api;