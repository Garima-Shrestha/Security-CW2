import { HttpError } from "../errors/http-error";
import { KHALTI_BASE_URL } from "../config/khalti";

const ALLOWED_HOST = new URL(KHALTI_BASE_URL).hostname;

export async function safeFetch(url: string, options: RequestInit): Promise<Response> {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new HttpError(400, "Invalid outbound URL");
    }

    if (parsed.protocol !== "https:") {
        throw new HttpError(400, "Only HTTPS outbound requests are allowed");
    }

    if (parsed.hostname !== ALLOWED_HOST) {
        throw new HttpError(400, "Outbound request blocked: host not allowlisted");
    }

    return fetch(url, options);
}