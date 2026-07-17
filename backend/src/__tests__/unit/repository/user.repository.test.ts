import { UserRepository } from "../../../repositories/user.repository";
import { UserModel } from "../../../models/user.model";
import mongoose from "mongoose";

describe("User Repository Unit Tests", () => {
  let userRepository: UserRepository;

  beforeAll(() => {
    userRepository = new UserRepository();
  });

  afterEach(async () => {
    await UserModel.deleteMany({});
  });

  // createUser

  test("createUser - should create a new user", async () => {
    const userData = {
      username: "testuser",
      email: "test@example.com",
      phone: "98123456780",
      password: "hashedPassword",
      role: "user" as const,
    };

    const newUser = await userRepository.createUser(userData);

    expect(newUser).toBeDefined();
    expect(newUser.username).toBe(userData.username);
    expect(newUser.email).toBe(userData.email);
    expect(newUser.phone).toBe(userData.phone);
  });

  test("createUser - should default role to 'user' when not provided", async () => {
    const newUser = await userRepository.createUser({
      username: "defaultroleuser",
      email: "defaultrole@example.com",
      phone: "98123456781",
      password: "hashedPassword",
    });

    expect(newUser.role).toBe("user");
  });

  test("createUser - should default isTotpEnabled to false", async () => {
    const newUser = await userRepository.createUser({
      username: "totpdefaultuser",
      email: "totpdefault@example.com",
      phone: "98123456782",
      password: "hashedPassword",
    });

    expect(newUser.isTotpEnabled).toBe(false);
  });

  test("createUser - should default failedLoginAttempts to 0", async () => {
    const newUser = await userRepository.createUser({
      username: "failedattemptsuser",
      email: "failedattempts@example.com",
      phone: "98123456783",
      password: "hashedPassword",
    });

    expect(newUser.failedLoginAttempts).toBe(0);
  });

  test("createUser - should reject duplicate email at the DB level", async () => {
    await userRepository.createUser({
      username: "uniqueemail1",
      email: "dupe@example.com",
      phone: "98123456784",
      password: "hashedPassword",
    });

    await expect(
      userRepository.createUser({
        username: "uniqueemail2",
        email: "dupe@example.com",
        phone: "98123456785",
        password: "hashedPassword",
      })
    ).rejects.toThrow();
  });

  test("createUser - should reject duplicate username at the DB level", async () => {
    await userRepository.createUser({
      username: "dupeusername",
      email: "first@example.com",
      phone: "98123456786",
      password: "hashedPassword",
    });

    await expect(
      userRepository.createUser({
        username: "dupeusername",
        email: "second@example.com",
        phone: "98123456787",
        password: "hashedPassword",
      })
    ).rejects.toThrow();
  });

  test("createUser - should allow multiple users with no phone (sparse unique index)", async () => {
    const userA = await userRepository.createUser({
      username: "nophoneuser1",
      email: "nophone1@example.com",
      googleId: "google-id-1",
      authProvider: "google",
    });

    const userB = await userRepository.createUser({
      username: "nophoneuser2",
      email: "nophone2@example.com",
      googleId: "google-id-2",
      authProvider: "google",
    });

    expect(userA.phone).toBeUndefined();
    expect(userB.phone).toBeUndefined();
  });

  // getUserByEmail

  test("getUserByEmail - should get user by email case-insensitively", async () => {
    await UserModel.create({
      username: "caseuser",
      email: "Case@Test.com",
      phone: "98123456788",
      password: "hashedPassword",
      role: "user",
    });

    const found = await userRepository.getUserByEmail("case@test.com");

    expect(found).toBeDefined();
    expect(found?.email).toBe("Case@Test.com");
    expect(found?.username).toBe("caseuser");
  });

  test("getUserByEmail - should return null for non-existent email", async () => {
    const found = await userRepository.getUserByEmail("nobody@nowhere.com");
    expect(found).toBeNull();
  });

  test("getUserByEmail - should not return password by default", async () => {
    await UserModel.create({
      username: "nosecretuser",
      email: "nosecret@example.com",
      phone: "98123456789",
      password: "hashedPassword",
      role: "user",
    });

    const found = await userRepository.getUserByEmail("nosecret@example.com");

    expect(found?.password).toBeUndefined();
  });

  test("getUserByEmail - should return password when withSecrets=true", async () => {
    await UserModel.create({
      username: "secretuser",
      email: "secret@example.com",
      phone: "98123456790",
      password: "hashedPassword",
      role: "user",
    });

    const found = await userRepository.getUserByEmail("secret@example.com", true);

    expect(found?.password).toBe("hashedPassword");
  });

  test("getUserByEmail - should not return totpSecret by default", async () => {
    await UserModel.create({
      username: "totpsecretuser",
      email: "totpsecret@example.com",
      phone: "98123456791",
      password: "hashedPassword",
      totpSecret: "encryptedSecret",
      role: "user",
    });

    const found = await userRepository.getUserByEmail("totpsecret@example.com");

    expect(found?.totpSecret).toBeUndefined();
  });

  test("getUserByEmail - should treat regex special characters in email literally", async () => {
    await UserModel.create({
      username: "regexuser",
      email: "weird+tag@example.com",
      phone: "98123456792",
      password: "hashedPassword",
      role: "user",
    });

    const found = await userRepository.getUserByEmail("weird+tag@example.com");

    expect(found).toBeDefined();
    expect(found?.username).toBe("regexuser");
  });

  // getUserByUsername

  test("getUserByUsername - should get user by username case-insensitively", async () => {
    await UserModel.create({
      username: "UniqueCaseName",
      email: "uniquecase@example.com",
      phone: "98123456793",
      password: "hashedPassword",
      role: "user",
    });

    const found = await userRepository.getUserByUsername("uniquecasename");

    expect(found).toBeDefined();
    expect(found?.username).toBe("UniqueCaseName");
  });

  test("getUserByUsername - should return null for non-existent username", async () => {
    const found = await userRepository.getUserByUsername("ghostuser");
    expect(found).toBeNull();
  });

  // getUserByGoogleId

  test("getUserByGoogleId - should find user by googleId", async () => {
    await UserModel.create({
      username: "googleuser",
      email: "googleuser@example.com",
      googleId: "google-abc-123",
      authProvider: "google",
    });

    const found = await userRepository.getUserByGoogleId("google-abc-123");

    expect(found).toBeDefined();
    expect(found?.username).toBe("googleuser");
  });

  test("getUserByGoogleId - should return null when googleId doesn't match", async () => {
    const found = await userRepository.getUserByGoogleId("nonexistent-google-id");
    expect(found).toBeNull();
  });

  // getUserByPhone

  test("getUserByPhone - should find user by phone", async () => {
    await UserModel.create({
      username: "phoneuser",
      email: "phoneuser@example.com",
      phone: "98123456794",
      password: "hashedPassword",
      role: "user",
    });

    const found = await userRepository.getUserByPhone("98123456794");

    expect(found).toBeDefined();
    expect(found?.username).toBe("phoneuser");
  });

  test("getUserByPhone - should return null when phone doesn't match", async () => {
    const found = await userRepository.getUserByPhone("00000000000");
    expect(found).toBeNull();
  });

  // getUserById

  test("getUserById - should get user by id", async () => {
    const created = await UserModel.create({
      username: "idtestuser",
      email: "idtest@example.com",
      phone: "98123456795",
      password: "hashedPassword",
      role: "user",
    });

    const found = await userRepository.getUserById(created._id.toString());

    expect(found).toBeDefined();
    expect(found?._id.toString()).toBe(created._id.toString());
  });

  test("getUserById - should return null for a non-existent id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const found = await userRepository.getUserById(fakeId);
    expect(found).toBeNull();
  });

  test("getUserById - should not return previousPasswordHashes by default", async () => {
    const created = await UserModel.create({
      username: "prevhashuser",
      email: "prevhash@example.com",
      phone: "98123456796",
      password: "hashedPassword",
      previousPasswordHashes: ["hash1", "hash2"],
      role: "user",
    });

    const found = await userRepository.getUserById(created._id.toString());

    expect(found?.previousPasswordHashes).toBeUndefined();
  });

  test("getUserById - should return previousPasswordHashes when withSecrets=true", async () => {
    const created = await UserModel.create({
      username: "prevhashuser2",
      email: "prevhash2@example.com",
      phone: "98123456797",
      password: "hashedPassword",
      previousPasswordHashes: ["hash1", "hash2"],
      role: "user",
    });

    const found = await userRepository.getUserById(created._id.toString(), true);

    expect(found?.previousPasswordHashes).toEqual(["hash1", "hash2"]);
  });

  // updateOneUser

  test("updateOneUser - should update a user's username", async () => {
    const created = await UserModel.create({
      username: "updatetestuser",
      email: "updatetest@example.com",
      phone: "98123456798",
      password: "hashedPassword",
      role: "user",
    });

    const updated = await userRepository.updateOneUser(created._id.toString(), {
      username: "updatedusername",
    });

    expect(updated).toBeDefined();
    expect(updated?.username).toBe("updatedusername");
  });

  test("updateOneUser - should return null when updating a non-existent id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const updated = await userRepository.updateOneUser(fakeId, { username: "ghost" });
    expect(updated).toBeNull();
  });

  test("updateOneUser - should persist isTotpEnabled flag change", async () => {
    const created = await UserModel.create({
      username: "totptoggleuser",
      email: "totptoggle@example.com",
      phone: "98123456799",
      password: "hashedPassword",
      role: "user",
    });

    const updated = await userRepository.updateOneUser(created._id.toString(), {
      isTotpEnabled: true,
    });

    expect(updated?.isTotpEnabled).toBe(true);
  });

  // deleteOneUser

  test("deleteOneUser - should delete a user", async () => {
    const created = await UserModel.create({
      username: "deletetestuser",
      email: "deletetest@example.com",
      phone: "98123456700",
      password: "hashedPassword",
      role: "user",
    });

    const result = await userRepository.deleteOneUser(created._id.toString());

    expect(result).toBe(true);

    const found = await userRepository.getUserById(created._id.toString());
    expect(found).toBeNull();
  });

  test("deleteOneUser - should return null when deleting a non-existent id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const result = await userRepository.deleteOneUser(fakeId);
    expect(result).toBeNull();
  });

  // incrementFailedAttempts

  test("incrementFailedAttempts - should increment failedLoginAttempts by 1", async () => {
    const created = await UserModel.create({
      username: "failuser",
      email: "fail@example.com",
      phone: "98123456701",
      password: "hashedPassword",
      role: "user",
      failedLoginAttempts: 2,
    });

    const updated = await userRepository.incrementFailedAttempts(created._id.toString());

    expect(updated?.failedLoginAttempts).toBe(3);
  });

  test("incrementFailedAttempts - should start from 0 and go to 1", async () => {
    const created = await UserModel.create({
      username: "failuserzero",
      email: "failzero@example.com",
      phone: "98123456702",
      password: "hashedPassword",
      role: "user",
    });

    const updated = await userRepository.incrementFailedAttempts(created._id.toString());

    expect(updated?.failedLoginAttempts).toBe(1);
  });

  // resetFailedAttempts

  test("resetFailedAttempts - should reset failedLoginAttempts to 0", async () => {
    const created = await UserModel.create({
      username: "resetuser",
      email: "reset@example.com",
      phone: "98123456703",
      password: "hashedPassword",
      role: "user",
      failedLoginAttempts: 8,
    });

    const updated = await userRepository.resetFailedAttempts(created._id.toString());

    expect(updated?.failedLoginAttempts).toBe(0);
  });

  test("resetFailedAttempts - should clear lockoutUntil", async () => {
    const created = await UserModel.create({
      username: "resetlockoutuser",
      email: "resetlockout@example.com",
      phone: "98123456704",
      password: "hashedPassword",
      role: "user",
      failedLoginAttempts: 10,
      lockoutUntil: new Date(Date.now() + 60_000),
    });

    const updated = await userRepository.resetFailedAttempts(created._id.toString());

    expect(updated?.lockoutUntil).toBeUndefined();
  });

  // setLockout

  test("setLockout - should set lockoutUntil to the given date", async () => {
    const created = await UserModel.create({
      username: "lockoutuser",
      email: "lockout@example.com",
      phone: "98123456705",
      password: "hashedPassword",
      role: "user",
    });

    const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    const updated = await userRepository.setLockout(created._id.toString(), lockUntil);

    expect(updated?.lockoutUntil?.getTime()).toBe(lockUntil.getTime());
  });

  // getAllUsersPaginated

  test("getAllUsersPaginated - should return paginated results with correct total", async () => {
    for (let i = 0; i < 15; i++) {
      await UserModel.create({
        username: `pageuser${i}`,
        email: `pageuser${i}@example.com`,
        phone: `981234568${String(i).padStart(2, "0")}`,
        password: "hashedPassword",
        role: "user",
      });
    }

    const { users, total } = await userRepository.getAllUsersPaginated(1, 10);

    expect(total).toBe(15);
    expect(users.length).toBe(10);
  });

  test("getAllUsersPaginated - should return the second page correctly", async () => {
    for (let i = 0; i < 15; i++) {
      await UserModel.create({
        username: `pageuser2_${i}`,
        email: `pageuser2_${i}@example.com`,
        phone: `981234569${String(i).padStart(2, "0")}`,
        password: "hashedPassword",
        role: "user",
      });
    }

    const { users, total } = await userRepository.getAllUsersPaginated(2, 10);

    expect(total).toBe(15);
    expect(users.length).toBe(5);
  });

  test("getAllUsersPaginated - should filter by searchTerm matching username", async () => {
    await UserModel.create({
      username: "findablename",
      email: "findable@example.com",
      phone: "98123456706",
      password: "hashedPassword",
      role: "user",
    });
    await UserModel.create({
      username: "othername",
      email: "other@example.com",
      phone: "98123456707",
      password: "hashedPassword",
      role: "user",
    });

    const { users, total } = await userRepository.getAllUsersPaginated(1, 10, "findable");

    expect(total).toBe(1);
    expect(users[0].username).toBe("findablename");
  });

  test("getAllUsersPaginated - should filter by searchTerm matching email", async () => {
    await UserModel.create({
      username: "emailmatchuser",
      email: "specialmatch@example.com",
      phone: "98123456708",
      password: "hashedPassword",
      role: "user",
    });

    const { users, total } = await userRepository.getAllUsersPaginated(1, 10, "specialmatch");

    expect(total).toBe(1);
    expect(users[0].email).toBe("specialmatch@example.com");
  });

  test("getAllUsersPaginated - should return empty array when no users match searchTerm", async () => {
    const { users, total } = await userRepository.getAllUsersPaginated(1, 10, "nomatchatall");

    expect(total).toBe(0);
    expect(users).toEqual([]);
  });

  test("getAllUsersPaginated - should sort by createdAt descending", async () => {
    const first = await UserModel.create({
      username: "olderuser",
      email: "older@example.com",
      phone: "98123456709",
      password: "hashedPassword",
      role: "user",
    });
    await new Promise((r) => setTimeout(r, 10));
    const second = await UserModel.create({
      username: "neweruser",
      email: "newer@example.com",
      phone: "98123456710",
      password: "hashedPassword",
      role: "user",
    });

    const { users } = await userRepository.getAllUsersPaginated(1, 10);

    const firstIndex = users.findIndex((u) => u._id.toString() === first._id.toString());
    const secondIndex = users.findIndex((u) => u._id.toString() === second._id.toString());

    expect(secondIndex).toBeLessThan(firstIndex);
  });
});