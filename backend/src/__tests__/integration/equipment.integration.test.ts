jest.mock("../../config/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));
jest.mock("../../utils/sanitize", () => ({
  sanitizeText: jest.fn((v: string) => v),
  sanitizeRichText: jest.fn((v: string) => v),
}));

import request from "supertest";
import fs from "fs";
import os from "os";
import path from "path";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { EquipmentCategoryModel } from "../../models/equipment-category.model";
import { EquipmentModel } from "../../models/equipment.model";
import bcryptjs from "bcryptjs";

describe("Equipment Integration Tests", () => {
  const adminUser = {
    username: "equipadmin",
    email: "equipadmin@example.com",
    phone: "9800000001",
    password: "AdminPass123!",
  };
  const normalUser = {
    username: "equipuser",
    email: "equipuser@example.com",
    phone: "9800000002",
    password: "UserPass123!",
  };

  let adminToken = "";
  let userToken = "";
  let categoryId = "";
  let createdEquipmentId = "";
  let uploadedImagePaths: string[] = [];


  const testImagePath = path.join(os.tmpdir(), "shutter-test-image.jpg");
  const MINIMAL_JPEG_BASE64 =
    "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

  beforeAll(async () => {
    fs.writeFileSync(testImagePath, Buffer.from(MINIMAL_JPEG_BASE64, "base64"));

    await UserModel.deleteMany({ email: { $in: [adminUser.email, normalUser.email] } });
    await EquipmentCategoryModel.deleteMany({ name: "Integration Test Cameras" });

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

    const category = await EquipmentCategoryModel.create({
      name: "Integration Test Cameras",
      description: "Category for equipment integration tests",
      isActive: true,
    });
    categoryId = category._id.toString();
  });

  afterAll(async () => {
    await EquipmentModel.deleteMany({ category: categoryId });
    await EquipmentCategoryModel.deleteMany({ _id: categoryId });
    await UserModel.deleteMany({ email: { $in: [adminUser.email, normalUser.email] } });

    if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);

    for (const imgPath of uploadedImagePaths) {
        const fullPath = path.join(__dirname, "../../../", imgPath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
    });

  describe("POST /api/equipment", () => {
    test("should reject creation without authentication", async () => {
      const response = await request(app)
        .post("/api/equipment")
        .field("title", "Canon EOS R5")
        .field("description", "Full frame mirrorless camera")
        .field("category", categoryId)
        .field("brand", "Canon")
        .field("model", "EOS R5")
        .field("dailyRate", "1500")
        .field("depositAmount", "5000");

      expect(response.status).toBe(401);
    });

    test("should reject creation by non-admin user", async () => {
      const response = await request(app)
        .post("/api/equipment")
        .set("Authorization", `Bearer ${userToken}`)
        .field("title", "Canon EOS R5")
        .field("description", "Full frame mirrorless camera")
        .field("category", categoryId)
        .field("brand", "Canon")
        .field("model", "EOS R5")
        .field("dailyRate", "1500")
        .field("depositAmount", "5000")
        .attach("images", testImagePath);

      expect(response.status).toBe(403);
    });

    test("should reject creation without any image", async () => {
      const response = await request(app)
        .post("/api/equipment")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("title", "Canon EOS R5")
        .field("description", "Full frame mirrorless camera")
        .field("category", categoryId)
        .field("brand", "Canon")
        .field("model", "EOS R5")
        .field("dailyRate", "1500")
        .field("depositAmount", "5000");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });

    test("should create equipment successfully with an image", async () => {
      const response = await request(app)
        .post("/api/equipment")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("title", "Canon EOS R5")
        .field("description", "Full frame mirrorless camera")
        .field("category", categoryId)
        .field("brand", "Canon")
        .field("model", "EOS R5")
        .field("dailyRate", "1500")
        .field("depositAmount", "5000")
        .attach("images", testImagePath);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("title", "Canon EOS R5");
      expect(response.body.data.images.length).toBeGreaterThan(0);

      createdEquipmentId = response.body.data._id;
      uploadedImagePaths.push(...response.body.data.images);
    });
  });

  describe("GET /api/equipment", () => {
    test("should list equipment for an authenticated user", async () => {
      const response = await request(app)
        .get("/api/equipment")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test("should reject listing without authentication", async () => {
      const response = await request(app).get("/api/equipment");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/equipment/:id", () => {
    test("should fetch equipment by id", async () => {
      const response = await request(app)
        .get(`/api/equipment/${createdEquipmentId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("_id", createdEquipmentId);
      expect(response.body.data).toHaveProperty("isBooked", false);
    });

    test("should return 404 for a non-existent equipment id", async () => {
      const response = await request(app)
        .get("/api/equipment/64b64b64b64b64b64b64b64b")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/equipment/:id", () => {
    test("should reject update by non-admin user", async () => {
      const response = await request(app)
        .put(`/api/equipment/${createdEquipmentId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .field("dailyRate", "2000");

      expect(response.status).toBe(403);
    });

    test("should update equipment successfully as admin", async () => {
      const response = await request(app)
        .put(`/api/equipment/${createdEquipmentId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .field("title", "Canon EOS R5")
        .field("description", "Full frame mirrorless camera")
        .field("category", categoryId)
        .field("brand", "Canon")
        .field("model", "EOS R5")
        .field("dailyRate", "1800")
        .field("depositAmount", "5000")
        .field("existingImages", JSON.stringify([]))
        .attach("images", testImagePath);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("dailyRate", 1800);

      uploadedImagePaths.push(...response.body.data.images);
    });
  });

  describe("DELETE /api/equipment/:id", () => {
    test("should reject delete by non-admin user", async () => {
      const response = await request(app)
        .delete(`/api/equipment/${createdEquipmentId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    test("should delete equipment successfully as admin", async () => {
      const response = await request(app)
        .delete(`/api/equipment/${createdEquipmentId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
    });
  });
});