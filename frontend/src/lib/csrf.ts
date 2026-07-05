import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

let cachedToken: string | null = null;

export async function getCsrfToken(): Promise<string> {
    if (cachedToken) return cachedToken;
    const res = await axios.get(`${API_URL}/api/csrf-token`, { withCredentials: true });
    cachedToken = res.data.csrfToken;
    return cachedToken as string;
}

export function clearCsrfToken() {
    cachedToken = null;
}