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
import bcryptjs from "bcryptjs";

describe("Admin User Management Integration Tests", () => {
  const adminUser = {
    username: "useradmin",
    email: "useradmin@example.com",
    phone: "9800000030",
    password: "AdminPass123!",
  };
  const normalUser = {
    username: "manageduser",
    email: "manageduser@example.com",
    phone: "9800000031",
    password: "UserPass123!",
  };

  let adminToken = "";
  let userToken = "";
  let createdUserId = "";

  beforeAll(async () => {
    await UserModel.deleteMany({
      email: { $in: [adminUser.email, normalUser.email, "newlyadded@example.com"] },
    });

    const hashedPassword = await bcryptjs.hash(adminUser.password, 12);
    await UserModel.create({
      username: adminUser.username,
      email: adminUser.email,
      phone: adminUser.phone,
      password: hashedPassword,
      role: "admin",
      authProvider: "local",
      passwordChangedAt: new Date(),
      previousPasswordHashes: [hashedPassword],
    });

    await request(app).post("/api/auth/register").send(normalUser);

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: adminUser.email, password: adminUser.password });
    adminToken = adminLogin.body.token;

    const userLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: normalUser.email, password: normalUser.password });
    userToken = userLogin.body.token;
  });

  afterAll(async () => {
    await UserModel.deleteMany({
      email: { $in: [adminUser.email, normalUser.email, "newlyadded@example.com"] },
    });
  });

  describe("GET /api/admin/users", () => {
    test("should reject listing without authentication", async () => {
      const response = await request(app).get("/api/admin/users");

      expect(response.status).toBe(401);
    });

    test("should reject listing by non-admin user", async () => {
      const response = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    test("should list users successfully as admin", async () => {
      const response = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("POST /api/admin/users", () => {
    test("should reject creation by non-admin user", async () => {
      const response = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          username: "shouldnotwork",
          email: "shouldnotwork@example.com",
          password: "Password123!",
        });

      expect(response.status).toBe(403);
    });

    test("should create a new user as admin, forcing role to 'user'", async () => {
      const response = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          username: "newlyadded",
          email: "newlyadded@example.com",
          phone: "9800000032",
          password: "Password123!",
          role: "admin",
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty("role", "user");

      createdUserId = response.body.data._id;
    });
  });

  describe("PUT /api/admin/users/:id", () => {
    test("should update a user's details as admin", async () => {
      const response = await request(app)
        .put(`/api/admin/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ username: "newlyaddedupdated" });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("username", "newlyaddedupdated");
    });
  });

  describe("DELETE /api/admin/users/:id", () => {
    test("should reject deleting an admin account", async () => {
      const selfResponse = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);
      const adminRecord = selfResponse.body.data.find((u: any) => u.email === adminUser.email);

      const response = await request(app)
        .delete(`/api/admin/users/${adminRecord._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });

    test("should delete a regular user successfully as admin", async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
    });
  });
});