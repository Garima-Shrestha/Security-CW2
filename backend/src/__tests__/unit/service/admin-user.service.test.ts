import { UserAdminService } from "../../../services/admin/user.service";
import { UserRepository } from "../../../repositories/user.repository";
import bcryptjs from "bcryptjs";

jest.mock("bcryptjs");
jest.mock("../../../config/logger", () => ({
  logActivity: jest.fn(),
  logSecurityEvent: jest.fn(),
}));
jest.mock("../../../utils/sanitize", () => ({
  sanitizeText: jest.fn((v: string) => v),
  sanitizeRichText: jest.fn((v: string) => v),
}));

describe("UserAdminService Unit Tests", () => {
  let userAdminService: UserAdminService;

  const getUserByEmailSpy = jest.spyOn(UserRepository.prototype, "getUserByEmail");
  const getUserByIdSpy = jest.spyOn(UserRepository.prototype, "getUserById");
  const createUserSpy = jest.spyOn(UserRepository.prototype, "createUser");
  const deleteOneUserSpy = jest.spyOn(UserRepository.prototype, "deleteOneUser");

  beforeEach(() => {
    jest.clearAllMocks();
    userAdminService = new UserAdminService();
  });

  test("createUser - should always force role to 'user' regardless of input", async () => {
    getUserByEmailSpy.mockResolvedValue(null);
    jest.spyOn(UserRepository.prototype, "getUserByUsername").mockResolvedValue(null);
    (bcryptjs.hash as jest.Mock).mockResolvedValue("hashedPassword");
    createUserSpy.mockResolvedValue({ _id: "u1" } as any);

    await userAdminService.createUser("admin1", {
      username: "newuser",
      email: "new@example.com",
      password: "Password123!",
      role: "admin",
    } as any);

    expect(createUserSpy).toHaveBeenCalledWith(
      expect.objectContaining({ role: "user" })
    );
  });

  test("deleteUser - should throw 400 when trying to delete an admin account", async () => {
    getUserByIdSpy.mockResolvedValue({ _id: "u2", role: "admin" } as any);

    await expect(userAdminService.deleteUser("admin1", "u2")).rejects.toThrow(
      "Cannot delete an admin account"
    );

    expect(deleteOneUserSpy).not.toHaveBeenCalled();
  });
});