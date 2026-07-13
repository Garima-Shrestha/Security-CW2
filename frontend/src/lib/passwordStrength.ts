import zxcvbn from "zxcvbn";

export function getPasswordStrength(password: string) {
    if (!password) return { score: 0, label: "", color: "" };
    const result = zxcvbn(password);
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const colors = ["#c42727", "#e85d5d", "#eab308", "#22c55e", "#16a34a"];
    return {
        score: result.score,
        label: labels[result.score],
        color: colors[result.score],
    };
}