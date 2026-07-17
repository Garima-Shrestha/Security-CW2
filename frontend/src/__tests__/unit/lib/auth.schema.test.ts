import {
  registerSchema,
  loginSchema,
  totpSchema,
} from "@/lib/validation/auth.schema";

describe("Register Schema", () => {
  const validData = {
    username: "John Doe",
    email: "john@example.com",
    phone: "9812345678",
    password: "Password@123",
    confirmPassword: "Password@123",
    acceptTerms: true,
  };

  test("accepts valid registration data", () => {
    expect(registerSchema.safeParse(validData).success).toBe(true);
  });

  test("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      ...validData,
      email: "john",
    });

    expect(result.success).toBe(false);
  });

  test("rejects short username", () => {
    const result = registerSchema.safeParse({
      ...validData,
      username: "J",
    });

    expect(result.success).toBe(false);
  });

  test("rejects invalid phone number", () => {
    const result = registerSchema.safeParse({
      ...validData,
      phone: "123",
    });

    expect(result.success).toBe(false);
  });

  test("rejects password shorter than 12 characters", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "Pass1@",
      confirmPassword: "Pass1@",
    });

    expect(result.success).toBe(false);
  });

  test("rejects password without uppercase letter", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "password@123",
      confirmPassword: "password@123",
    });

    expect(result.success).toBe(false);
  });

  test("rejects password without lowercase letter", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "PASSWORD@123",
      confirmPassword: "PASSWORD@123",
    });

    expect(result.success).toBe(false);
  });

  test("rejects password without number", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "Password@@@@",
      confirmPassword: "Password@@@@",
    });

    expect(result.success).toBe(false);
  });

  test("rejects password without special character", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "Password1234",
      confirmPassword: "Password1234",
    });

    expect(result.success).toBe(false);
  });

  test("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirmPassword: "Password@124",
    });

    expect(result.success).toBe(false);
  });
});

describe("Login Schema", () => {
  test("accepts valid login credentials", () => {
    expect(
      loginSchema.safeParse({
        email: "john@example.com",
        password: "Password@123",
      }).success
    ).toBe(true);
  });

  test("rejects invalid email", () => {
    expect(
      loginSchema.safeParse({
        email: "john",
        password: "Password@123",
      }).success
    ).toBe(false);
  });

  test("rejects empty password", () => {
    expect(
      loginSchema.safeParse({
        email: "john@example.com",
        password: "",
      }).success
    ).toBe(false);
  });
});

describe("TOTP Schema", () => {
  test("accepts valid 6-digit code", () => {
    expect(
      totpSchema.safeParse({
        code: "123456",
      }).success
    ).toBe(true);
  });

  test("rejects code shorter than 6 digits", () => {
    expect(
      totpSchema.safeParse({
        code: "12345",
      }).success
    ).toBe(false);
  });

  test("rejects non-numeric code", () => {
    expect(
      totpSchema.safeParse({
        code: "12AB56",
      }).success
    ).toBe(false);
  });
});