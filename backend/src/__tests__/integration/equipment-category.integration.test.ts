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
import { EquipmentCategoryModel } from "../../models/equipment-category.model";
import bcryptjs from "bcryptjs";

describe("Equipment Category Integration Tests", () => {
  const adminUser = {
    username: "categoryadmin",
    email: "categoryadmin@example.com",
    phone: "9800000010",
    password: "AdminPass123!",
  };
  const normalUser = {
    username: "categoryuser",
    email: "categoryuser@example.com",
    phone: "9800000011",
    password: "UserPass123!",
  };

  let adminToken = "";
  let userToken = "";
  let createdCategoryId = "";

  beforeAll(async () => {
    await UserModel.deleteMany({ email: { $in: [adminUser.email, normalUser.email] } });
    await EquipmentCategoryModel.deleteMany({
      name: { $in: ["Integration Lenses", "Integration Lenses Updated"] },
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
    await EquipmentCategoryModel.deleteMany({
      name: { $in: ["Integration Lenses", "Integration Lenses Updated"] },
    });
    await UserModel.deleteMany({ email: { $in: [adminUser.email, normalUser.email] } });
  });

  describe("POST /api/equipment-categories", () => {
    test("should reject creation without authentication", async () => {
      const response = await request(app)
        .post("/api/equipment-categories")
        .send({ name: "Integration Lenses" });

      expect(response.status).toBe(401);
    });

    test("should reject creation by non-admin user", async () => {
      const response = await request(app)
        .post("/api/equipment-categories")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Integration Lenses" });

      expect(response.status).toBe(403);
    });

    test("should create a category successfully as admin", async () => {
      const response = await request(app)
        .post("/api/equipment-categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Integration Lenses", description: "Test lens category" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("name", "Integration Lenses");

      createdCategoryId = response.body.data._id;
    });

    test("should reject duplicate category name", async () => {
      const response = await request(app)
        .post("/api/equipment-categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Integration Lenses" });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("success", false);
    });

    test("should reject category name that is too short", async () => {
      const response = await request(app)
        .post("/api/equipment-categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("GET /api/equipment-categories", () => {
    test("should list categories without authentication (public read)", async () => {
      const response = await request(app).get("/api/equipment-categories");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test("should only show active categories to non-admins", async () => {
      const response = await request(app)
        .get("/api/equipment-categories")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      const inactiveFound = response.body.data.some((c: any) => c.isActive === false);
      expect(inactiveFound).toBe(false);
    });
  });

  describe("GET /api/equipment-categories/:id", () => {
    test("should fetch a category by id", async () => {
      const response = await request(app).get(`/api/equipment-categories/${createdCategoryId}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("_id", createdCategoryId);
    });

    test("should return 404 for a non-existent category id", async () => {
      const response = await request(app).get(
        "/api/equipment-categories/64b64b64b64b64b64b64b64b"
      );

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/equipment-categories/:id", () => {
    test("should reject update by non-admin user", async () => {
      const response = await request(app)
        .put(`/api/equipment-categories/${createdCategoryId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Integration Lenses Updated" });

      expect(response.status).toBe(403);
    });

    test("should update category successfully as admin", async () => {
      const response = await request(app)
        .put(`/api/equipment-categories/${createdCategoryId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Integration Lenses Updated" });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("name", "Integration Lenses Updated");
    });

    test("should deactivate category successfully as admin", async () => {
      const response = await request(app)
        .put(`/api/equipment-categories/${createdCategoryId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("isActive", false);
    });
  });

  describe("DELETE /api/equipment-categories/:id", () => {
    test("should reject delete by non-admin user", async () => {
      const response = await request(app)
        .delete(`/api/equipment-categories/${createdCategoryId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    test("should delete category successfully as admin", async () => {
      const response = await request(app)
        .delete(`/api/equipment-categories/${createdCategoryId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
    });
  });
});