jest.mock("../../config/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));
jest.mock("../../utils/sanitize", () => ({
  sanitizeText: jest.fn((v: string) => v),
  sanitizeRichText: jest.fn((v: string) => v),
}));

import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";

describe("Auth Integration Tests", () => {
  const testUser = {
    username: "testuser",
    email: "test@example.com",
    phone: "9812345678",
    password: "Password123!",
  };

  const newPassword = "NewPassword123!";

  beforeAll(async () => {
    await UserModel.deleteMany({
      $or: [
        { email: testUser.email },
        { username: testUser.username },
        { phone: testUser.phone },
        { email: "new@email.com" },
        { email: "phone-dup@email.com" },
        { username: "phoneDupUser" },
      ],
    });
  });

  afterAll(async () => {
    await UserModel.deleteMany({
      $or: [
        { email: testUser.email },
        { username: testUser.username },
        { phone: testUser.phone },
        { email: "new@email.com" },
        { email: "phone-dup@email.com" },
        { username: "phoneDupUser" },
      ],
    });
  });

  describe("POST /api/auth/register", () => {
    test("should register a new user", async () => {
      const response = await request(app).post("/api/auth/register").send(testUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).not.toHaveProperty("password");
    });

    test("should not register a new user with duplicate email", async () => {
      const response = await request(app).post("/api/auth/register").send(testUser);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("success", false);
    });

    test("should not register a new user with duplicate username", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...testUser,
          email: "new@email.com",
          phone: "9812345679",
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("success", false);
    });

    test("should not register a new user with duplicate phone", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...testUser,
          email: "phone-dup@email.com",
          username: "phoneDupUser",
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("success", false);
    });

    test("should reject weak passwords", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...testUser,
          email: "weakpass@email.com",
          username: "weakpassuser",
          phone: "9811111111",
          password: "weak",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("POST /api/auth/login", () => {
    test("should login an existing user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: testUser.email, password: testUser.password });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("token");
    });

    test("should not login with incorrect password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: testUser.email, password: "WrongPassword!" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("success", false);
    });

    test("should not login with unregistered email (generic error, no enumeration)", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "notfound@email.com", password: "Password123!" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body.message).toBe("Invalid email or password");
    });
  });

  describe("PUT /api/auth/change-password", () => {
    let token = "";

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({ email: testUser.email, password: testUser.password });

      token = loginResponse.body.token;
    });

    test("should change password successfully", async () => {
      const response = await request(app)
        .put("/api/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ oldPassword: testUser.password, newPassword });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
    });

    test("should not change password with wrong old password", async () => {
      const response = await request(app)
        .put("/api/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ oldPassword: "WrongOld123!", newPassword: "AnotherPass123!" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("success", false);
    });

    test("should login with new password after change", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: testUser.email, password: newPassword });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("token");
    });
  });

  describe("GET /api/auth/whoami", () => {
    let token = "";

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({ email: testUser.email, password: newPassword });

      token = loginResponse.body.token;
    });

    test("should fetch logged in user profile", async () => {
      const response = await request(app)
        .get("/api/auth/whoami")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("email", testUser.email);
    });

    test("should not fetch profile without token", async () => {
      const response = await request(app).get("/api/auth/whoami");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("PUT /api/auth/profile", () => {
    let token = "";

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({ email: testUser.email, password: newPassword });

      token = loginResponse.body.token;
    });

    test("should update profile successfully", async () => {
      const response = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ username: "updatedtestuser" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("username", "updatedtestuser");
    });

    test("should not update profile without token", async () => {
      const response = await request(app)
        .put("/api/auth/profile")
        .send({ username: "noupdate" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("POST /api/auth/request-password-reset", () => {
    test("should return generic success message for registered email", async () => {
      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: testUser.email });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.message).toMatch(/If that email is registered/);
    });

    test("should also return generic success message for unregistered email (no enumeration)", async () => {
      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: "notexist@example.com" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.message).toMatch(/If that email is registered/);
    });

    test("should return 400 if email is missing", async () => {
      const response = await request(app).post("/api/auth/request-password-reset").send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("POST /api/auth/reset-password", () => {
    test("should return 400 for invalid or expired token", async () => {
      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: "invalidtoken123", newPassword: "ResetPass123!" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });

    test("should return 400 when newPassword is missing", async () => {
      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: "invalidtoken123" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });
  });
});