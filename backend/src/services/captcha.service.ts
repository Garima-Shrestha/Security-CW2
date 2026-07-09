import { HCAPTCHA_SECRET } from "../config";

export async function verifyCaptcha(token: string): Promise<boolean> {
    if (!HCAPTCHA_SECRET) return false; // fail closed if misconfigured
    if (!token) return false;

    const res = await fetch("https://api.hcaptcha.com/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret: HCAPTCHA_SECRET, response: token }),
    });
    const data = await res.json();
    return data.success === true;
}