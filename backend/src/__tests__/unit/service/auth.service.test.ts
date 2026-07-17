import { AuthService } from "../../../services/auth.service";
import { UserRepository } from "../../../repositories/user.repository";
import { TotpService } from "../../../services/totp.service";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyCaptcha } from "../../../services/captcha.service";

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("../../../config/logger", () => ({
  logActivity: jest.fn(),
  logSecurityEvent: jest.fn(),
}));
jest.mock("../../../config/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));
jest.mock("../../../services/captcha.service", () => ({
  verifyCaptcha: jest.fn(),
}));
jest.mock("../../../utils/encryption", () => ({
  encrypt: jest.fn((v: string) => `encrypted-${v}`),
  decrypt: jest.fn((v: string) => String(v).replace("encrypted-", "")),
}));
jest.mock("../../../utils/sanitize", () => ({
  sanitizeText: jest.fn((v: string) => v),
  sanitizeRichText: jest.fn((v: string) => v),
}));

describe("AuthService Unit Tests", () => {
  let authService: AuthService;

  const getUserByEmailSpy = jest.spyOn(UserRepository.prototype, "getUserByEmail");
  const getUserByUsernameSpy = jest.spyOn(UserRepository.prototype, "getUserByUsername");
  const getUserByPhoneSpy = jest.spyOn(UserRepository.prototype, "getUserByPhone");
  const getUserByIdSpy = jest.spyOn(UserRepository.prototype, "getUserById");
  const createUserSpy = jest.spyOn(UserRepository.prototype, "createUser");
  const updateOneUserSpy = jest.spyOn(UserRepository.prototype, "updateOneUser");
  const incrementFailedAttemptsSpy = jest.spyOn(UserRepository.prototype, "incrementFailedAttempts");
  const resetFailedAttemptsSpy = jest.spyOn(UserRepository.prototype, "resetFailedAttempts");
  const setLockoutSpy = jest.spyOn(UserRepository.prototype, "setLockout");

  const generateSecretSpy = jest.spyOn(TotpService.prototype, "generateSecret");
  const generateQrCodeSpy = jest.spyOn(TotpService.prototype, "generateQrCodeDataUrl");
  const verifyCodeSpy = jest.spyOn(TotpService.prototype, "verifyCode");

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  
  // registerUser
  test("registerUser - should register a new user successfully", async () => {
    getUserByEmailSpy.mockResolvedValue(null);
    getUserByUsernameSpy.mockResolvedValue(null);
    getUserByPhoneSpy.mockResolvedValue(null);
    (bcryptjs.hash as jest.Mock).mockResolvedValue("hashedPassword");

    const mockUser = {
      _id: "u1",
      username: "testuser",
      email: "test@example.com",
      toObject: function () {
        return { _id: this._id, username: this.username, email: this.email };
      },
    };
    createUserSpy.mockResolvedValue(mockUser as any);

    const result = await authService.registerUser({
      username: "testuser",
      email: "test@example.com",
      phone: "98123456780",
      password: "Password123!",
    } as any);

    expect(result).toEqual({ _id: "u1", username: "testuser", email: "test@example.com" });
    expect(createUserSpy).toHaveBeenCalledTimes(1);
  });

  test("registerUser - should throw 409 if email already exists", async () => {
    getUserByEmailSpy.mockResolvedValue({ email: "test@example.com" } as any);

    await expect(
      authService.registerUser({
        username: "testuser",
        email: "test@example.com",
        phone: "98123456780",
        password: "Password123!",
      } as any)
    ).rejects.toThrow("Email already in use");

    expect(createUserSpy).not.toHaveBeenCalled();
  });

  test("registerUser - should throw 409 if username already exists", async () => {
    getUserByEmailSpy.mockResolvedValue(null);
    getUserByUsernameSpy.mockResolvedValue({ username: "testuser" } as any);

    await expect(
      authService.registerUser({
        username: "testuser",
        email: "test@example.com",
        phone: "98123456780",
        password: "Password123!",
      } as any)
    ).rejects.toThrow("Username already in use");

    expect(createUserSpy).not.toHaveBeenCalled();
  });

  test("registerUser - should throw 409 if phone already exists", async () => {
    getUserByEmailSpy.mockResolvedValue(null);
    getUserByUsernameSpy.mockResolvedValue(null);
    getUserByPhoneSpy.mockResolvedValue({ phone: "98123456780" } as any);

    await expect(
      authService.registerUser({
        username: "testuser",
        email: "test@example.com",
        phone: "98123456780",
        password: "Password123!",
      } as any)
    ).rejects.toThrow("Phone number already in use");

    expect(createUserSpy).not.toHaveBeenCalled();
  });

  
  // loginStepOne
  test("loginStepOne - should throw 401 when email is not found", async () => {
    getUserByEmailSpy.mockResolvedValue(null);

    await expect(
      authService.loginStepOne({ email: "nobody@example.com", password: "Password123!" } as any)
    ).rejects.toThrow("Invalid email or password");
  });

  test("loginStepOne - should throw 401 when user has no password (oauth-only account)", async () => {
    getUserByEmailSpy.mockResolvedValue({ _id: "u1", email: "test@example.com" } as any);

    await expect(
      authService.loginStepOne({ email: "test@example.com", password: "Password123!" } as any)
    ).rejects.toThrow("Invalid email or password");
  });

  test("loginStepOne - should throw 429 when account is locked out", async () => {
    getUserByEmailSpy.mockResolvedValue({
      _id: "u1",
      email: "test@example.com",
      password: "hashedPassword",
      lockoutUntil: new Date(Date.now() + 60_000),
      failedLoginAttempts: 0,
    } as any);

    await expect(
      authService.loginStepOne({ email: "test@example.com", password: "Password123!" } as any)
    ).rejects.toThrow(/temporarily locked/);
  });

  test("loginStepOne - should require captcha after 3 failed attempts and reject invalid token", async () => {
    getUserByEmailSpy.mockResolvedValue({
      _id: "u1",
      email: "test@example.com",
      password: "hashedPassword",
      failedLoginAttempts: 3,
    } as any);
    (verifyCaptcha as jest.Mock).mockResolvedValue(false);

    await expect(
      authService.loginStepOne({
        email: "test@example.com",
        password: "Password123!",
        captchaToken: "bad-token",
      } as any)
    ).rejects.toThrow("CAPTCHA verification required");
  });

  test("loginStepOne - should increment failed attempts on wrong password", async () => {
    getUserByEmailSpy.mockResolvedValue({
      _id: "u1",
      email: "test@example.com",
      password: "hashedPassword",
      failedLoginAttempts: 1,
    } as any);
    (bcryptjs.compare as jest.Mock).mockResolvedValue(false);
    incrementFailedAttemptsSpy.mockResolvedValue({ failedLoginAttempts: 2 } as any);

    await expect(
      authService.loginStepOne({ email: "test@example.com", password: "WrongPass!" } as any)
    ).rejects.toThrow("Invalid email or password");

    expect(incrementFailedAttemptsSpy).toHaveBeenCalledTimes(1);
  });

  test("loginStepOne - should lock the account when max failed attempts is reached", async () => {
    getUserByEmailSpy.mockResolvedValue({
      _id: "u1",
      email: "test@example.com",
      password: "hashedPassword",
      failedLoginAttempts: 9,
    } as any);
    (verifyCaptcha as jest.Mock).mockResolvedValue(true);
    (bcryptjs.compare as jest.Mock).mockResolvedValue(false);
    incrementFailedAttemptsSpy.mockResolvedValue({ failedLoginAttempts: 10 } as any);
    setLockoutSpy.mockResolvedValue({} as any);

    await expect(
      authService.loginStepOne({ email: "test@example.com", password: "WrongPass!" } as any)
    ).rejects.toThrow(/Too many failed attempts/);

    expect(setLockoutSpy).toHaveBeenCalledTimes(1);
  });

  test("loginStepOne - should return a token when TOTP is not enabled", async () => {
    getUserByEmailSpy.mockResolvedValue({
      _id: "u1",
      email: "test@example.com",
      password: "hashedPassword",
      role: "user",
      failedLoginAttempts: 0,
      isTotpEnabled: false,
      passwordChangedAt: new Date(),
    } as any);
    (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
    resetFailedAttemptsSpy.mockResolvedValue({} as any);
    (jwt.sign as jest.Mock).mockReturnValue("mocked.jwt.token");

    const result = await authService.loginStepOne({
      email: "test@example.com",
      password: "Password123!",
    } as any);

    expect(result.requiresTotp).toBe(false);
    expect((result as any).token).toBe("mocked.jwt.token");
  });

  test("loginStepOne - should throw 403 when password has expired", async () => {
    getUserByEmailSpy.mockResolvedValue({
      _id: "u1",
      email: "test@example.com",
      password: "hashedPassword",
      failedLoginAttempts: 0,
      passwordChangedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
    } as any);
    (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
    resetFailedAttemptsSpy.mockResolvedValue({} as any);

    await expect(
      authService.loginStepOne({ email: "test@example.com", password: "Password123!" } as any)
    ).rejects.toThrow("Your password has expired. Please reset it to continue.");
  });

  test("loginStepOne - should return a preAuthToken when TOTP is enabled", async () => {
    getUserByEmailSpy.mockResolvedValue({
      _id: "u1",
      email: "test@example.com",
      password: "hashedPassword",
      failedLoginAttempts: 0,
      isTotpEnabled: true,
      passwordChangedAt: new Date(),
    } as any);
    (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
    resetFailedAttemptsSpy.mockResolvedValue({} as any);
    (jwt.sign as jest.Mock).mockReturnValue("mocked.preauth.token");

    const result = await authService.loginStepOne({
      email: "test@example.com",
      password: "Password123!",
    } as any);

    expect(result.requiresTotp).toBe(true);
    expect((result as any).preAuthToken).toBe("mocked.preauth.token");
  });

  
  // loginStepTwo
  test("loginStepTwo - should throw 401 when pre-auth token is invalid", async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("bad token");
    });

    await expect(authService.loginStepTwo("bad.token", "123456")).rejects.toThrow(
      "Pre-auth session expired, please log in again"
    );
  });

  test("loginStepTwo - should throw 401 when token stage is not pre-auth", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: "u1", stage: "full" });

    await expect(authService.loginStepTwo("token", "123456")).rejects.toThrow(
      "Invalid authentication stage"
    );
  });

  test("loginStepTwo - should throw 401 when MFA is not configured", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: "u1", stage: "pre-auth" });
    getUserByIdSpy.mockResolvedValue({ _id: "u1" } as any);

    await expect(authService.loginStepTwo("token", "123456")).rejects.toThrow(
      "MFA not configured for this account"
    );
  });

  test("loginStepTwo - should throw 401 on invalid TOTP code", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: "u1", stage: "pre-auth" });
    getUserByIdSpy.mockResolvedValue({ _id: "u1", totpSecret: "encrypted-secret" } as any);
    verifyCodeSpy.mockReturnValue(false);

    await expect(authService.loginStepTwo("token", "000000")).rejects.toThrow(
      "Invalid authentication code"
    );
  });

  test("loginStepTwo - should return a token on valid TOTP code", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: "u1", stage: "pre-auth" });
    getUserByIdSpy.mockResolvedValue({
      _id: "u1",
      email: "test@example.com",
      role: "user",
      totpSecret: "encrypted-secret",
    } as any);
    verifyCodeSpy.mockReturnValue(true);
    (jwt.sign as jest.Mock).mockReturnValue("mocked.jwt.token");

    const result = await authService.loginStepTwo("token", "123456");

    expect(result.token).toBe("mocked.jwt.token");
  });

  
  // setupTotp
  test("setupTotp - should throw 404 when user not found", async () => {
    getUserByIdSpy.mockResolvedValue(null);

    await expect(authService.setupTotp("u1")).rejects.toThrow("User not found");
  });

  test("setupTotp - should throw 400 when MFA already enabled", async () => {
    getUserByIdSpy.mockResolvedValue({ _id: "u1", isTotpEnabled: true } as any);

    await expect(authService.setupTotp("u1")).rejects.toThrow("MFA is already enabled");
  });

  test("setupTotp - should generate a secret and QR code", async () => {
    getUserByIdSpy.mockResolvedValue({ _id: "u1", email: "test@example.com", isTotpEnabled: false } as any);
    generateSecretSpy.mockReturnValue({ base32: "BASE32SECRET", otpauthUrl: "otpauth://test" } as any);
    generateQrCodeSpy.mockResolvedValue("data:image/png;base64,xyz");
    updateOneUserSpy.mockResolvedValue({} as any);

    const result = await authService.setupTotp("u1");

    expect(result.secret).toBe("BASE32SECRET");
    expect(result.qrCode).toBe("data:image/png;base64,xyz");
    expect(updateOneUserSpy).toHaveBeenCalledTimes(1);
  });


  // enableTotp
  test("enableTotp - should throw 400 when setup was not initiated", async () => {
    getUserByIdSpy.mockResolvedValue({ _id: "u1", totpSecret: undefined } as any);

    await expect(authService.enableTotp("u1", "123456")).rejects.toThrow(
      "TOTP setup not initiated"
    );
  });

  test("enableTotp - should throw 401 on invalid code", async () => {
    getUserByIdSpy.mockResolvedValue({ _id: "u1", totpSecret: "encrypted-secret" } as any);
    verifyCodeSpy.mockReturnValue(false);

    await expect(authService.enableTotp("u1", "000000")).rejects.toThrow(
      "Invalid code, MFA not enabled"
    );
  });

  test("enableTotp - should enable MFA on valid code", async () => {
    getUserByIdSpy.mockResolvedValue({ _id: "u1", totpSecret: "encrypted-secret" } as any);
    verifyCodeSpy.mockReturnValue(true);
    updateOneUserSpy.mockResolvedValue({} as any);

    const result = await authService.enableTotp("u1", "123456");

    expect(result.message).toBe("MFA enabled successfully");
    expect(updateOneUserSpy).toHaveBeenCalledWith("u1", { isTotpEnabled: true });
  });


  // updateProfile
  test("updateProfile - should throw 404 when user not found", async () => {
    getUserByIdSpy.mockResolvedValue(null);

    await expect(authService.updateProfile("u1", { username: "newname" })).rejects.toThrow(
      "User not found"
    );
  });

  test("updateProfile - should throw 409 when new username is taken by another user", async () => {
    getUserByIdSpy.mockResolvedValue({ _id: "u1" } as any);
    getUserByUsernameSpy.mockResolvedValue({ _id: "u2" } as any);

    await expect(authService.updateProfile("u1", { username: "taken" })).rejects.toThrow(
      "Username already in use"
    );
  });

  test("updateProfile - should update successfully", async () => {
    getUserByIdSpy.mockResolvedValue({ _id: "u1" } as any);
    getUserByUsernameSpy.mockResolvedValue(null);
    updateOneUserSpy.mockResolvedValue({ _id: "u1", username: "newname" } as any);

    const result = await authService.updateProfile("u1", { username: "newname" });

    expect(result?.username).toBe("newname");
  });


  // changePassword
  test("changePassword - should throw 401 when old password is wrong", async () => {
    getUserByIdSpy.mockResolvedValue({ _id: "u1", password: "hashedOld" } as any);
    (bcryptjs.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      authService.changePassword("u1", { oldPassword: "WrongOld!", newPassword: "NewPass123!" } as any)
    ).rejects.toThrow("Old password is incorrect");

    expect(updateOneUserSpy).not.toHaveBeenCalled();
  });

  test("changePassword - should throw 400 when new password matches a previous password", async () => {
    getUserByIdSpy.mockResolvedValue({
      _id: "u1",
      password: "hashedOld",
      previousPasswordHashes: ["oldHash1"],
    } as any);
    (bcryptjs.compare as jest.Mock)
      .mockResolvedValueOnce(true) // old password matches
      .mockResolvedValueOnce(true); // new password matches a previous hash

    await expect(
      authService.changePassword("u1", { oldPassword: "OldPass123!", newPassword: "ReusedPass123!" } as any)
    ).rejects.toThrow(/cannot match any of your last/);

    expect(updateOneUserSpy).not.toHaveBeenCalled();
  });

  test("changePassword - should change password successfully", async () => {
    getUserByIdSpy.mockResolvedValue({
      _id: "u1",
      password: "hashedOld",
      previousPasswordHashes: [],
    } as any);
    (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
    (bcryptjs.hash as jest.Mock).mockResolvedValue("newHashed");
    updateOneUserSpy.mockResolvedValue({} as any);

    const result = await authService.changePassword("u1", {
      oldPassword: "OldPass123!",
      newPassword: "NewPass123!",
    } as any);

    expect(result.message).toBe("Password changed successfully");
    expect(updateOneUserSpy).toHaveBeenCalledTimes(1);
  });


  // requestPasswordReset
  test("requestPasswordReset - should return a generic message when email is not registered", async () => {
    getUserByEmailSpy.mockResolvedValue(null);

    const result = await authService.requestPasswordReset("nobody@example.com");

    expect(result.message).toMatch(/If that email is registered/);
  });

  test("requestPasswordReset - should send a reset email for a registered user", async () => {
    getUserByEmailSpy.mockResolvedValue({ _id: "u1", email: "test@example.com" } as any);
    (jwt.sign as jest.Mock).mockReturnValue("reset.jwt.token");

    const result = await authService.requestPasswordReset("test@example.com");

    expect(result.message).toMatch(/If that email is registered/);
    expect(jwt.sign).toHaveBeenCalledTimes(1);
  });


  // resetPassword
  test("resetPassword - should throw 400 for an invalid or expired token", async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("expired");
    });

    await expect(authService.resetPassword("badtoken", "NewPass123!")).rejects.toThrow(
      "Invalid or expired reset token"
    );
  });

  test("resetPassword - should throw 400 when token stage is not password-reset", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: "u1", stage: "full" });

    await expect(authService.resetPassword("token", "NewPass123!")).rejects.toThrow(
      "Invalid reset token"
    );
  });

  test("resetPassword - should throw 404 when user not found", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: "u1", stage: "password-reset" });
    getUserByIdSpy.mockResolvedValue(null);

    await expect(authService.resetPassword("token", "NewPass123!")).rejects.toThrow(
      "User not found"
    );
  });

  test("resetPassword - should reset the password successfully", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: "u1", stage: "password-reset" });
    getUserByIdSpy.mockResolvedValue({
      _id: "u1",
      password: "hashedOld",
      previousPasswordHashes: [],
    } as any);
    (bcryptjs.hash as jest.Mock).mockResolvedValue("newHashed");
    updateOneUserSpy.mockResolvedValue({} as any);

    const result = await authService.resetPassword("token", "NewPass123!");

    expect(result.message).toBe("Password has been reset successfully");
  });
});