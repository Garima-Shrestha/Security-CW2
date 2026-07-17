import { OAuthService } from "../../../services/oauth.service";
import { UserRepository } from "../../../repositories/user.repository";

describe("OAuthService Unit Tests", () => {
  let oauthService: OAuthService;

  const getUserByGoogleIdSpy = jest.spyOn(UserRepository.prototype, "getUserByGoogleId");
  const getUserByEmailSpy = jest.spyOn(UserRepository.prototype, "getUserByEmail");
  const createUserSpy = jest.spyOn(UserRepository.prototype, "createUser");

  beforeEach(() => {
    jest.clearAllMocks();
    oauthService = new OAuthService();
  });

  test("findOrCreateGoogleUser - should link an existing local account with the same email", async () => {
    getUserByGoogleIdSpy.mockResolvedValue(null);
    getUserByEmailSpy.mockResolvedValue({ _id: "u1", email: "existing@example.com" } as any);
    jest.spyOn(UserRepository.prototype, "updateOneUser").mockResolvedValue({
      _id: "u1",
      googleId: "g123",
    } as any);

    const result = await oauthService.findOrCreateGoogleUser({
      id: "g123",
      emails: [{ value: "existing@example.com" }],
    } as any);

    expect(result?.googleId).toBe("g123");
    expect(createUserSpy).not.toHaveBeenCalled();
  });

  test("findOrCreateGoogleUser - should throw when Google profile has no email", async () => {
    await expect(
      oauthService.findOrCreateGoogleUser({ id: "g123", emails: [] } as any)
    ).rejects.toThrow("Google account has no email");
  });
});