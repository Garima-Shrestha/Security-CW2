import { getPasswordStrength } from "@/lib/passwordStrength";

describe("getPasswordStrength", () => {
  test("returns empty state for an empty password", () => {
    const result = getPasswordStrength("");

    expect(result).toEqual({ score: 0, label: "", color: "" });
  });

  test("returns a low score for a very weak password", () => {
    const result = getPasswordStrength("123456");

    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.label).toMatch(/Very Weak|Weak/);
  });

  test("returns a high score for a strong password", () => {
    const result = getPasswordStrength("Xk9#mQ2$vLp7@nR4");

    expect(result.score).toBeGreaterThanOrEqual(3);
    expect(result.label).toMatch(/Good|Strong/);
  });

  test("returns a label matching one of the defined strength labels", () => {
    const result = getPasswordStrength("SomePassword1!");
    const validLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

    expect(validLabels).toContain(result.label);
  });

  test("returns a color value for any non-empty password", () => {
    const result = getPasswordStrength("anything123");

    expect(result.color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test("score stays within the valid 0-4 range", () => {
    const result = getPasswordStrength("test");

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(4);
  });
});