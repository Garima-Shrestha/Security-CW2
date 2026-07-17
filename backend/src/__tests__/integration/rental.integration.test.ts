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
import { RentalModel } from "../../models/rental.model";
import bcryptjs from "bcryptjs";

describe("Rental Integration Tests", () => {
  const userA = {
    username: "rentaluserA",
    email: "rentaluserA@example.com",
    phone: "9800000020",
    password: "UserPass123!",
  };
  const userB = {
    username: "rentaluserB",
    email: "rentaluserB@example.com",
    phone: "9800000021",
    password: "UserPass123!",
  };

  let userAToken = "";
  let userBToken = "";
  let categoryId = "";
  let equipmentId = "";
  let createdRentalId = "";

  const testImagePath = path.join(os.tmpdir(), "shutter-rental-test-image.jpg");
  const MINIMAL_JPEG_BASE64 =
    "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

  beforeAll(async () => {
    fs.writeFileSync(testImagePath, Buffer.from(MINIMAL_JPEG_BASE64, "base64"));

    await UserModel.deleteMany({ email: { $in: [userA.email, userB.email] } });
    await EquipmentCategoryModel.deleteMany({ name: "Rental Integration Category" });

    await request(app).post("/api/auth/register").send(userA);
    await request(app).post("/api/auth/register").send(userB);

    const loginA = await request(app)
      .post("/api/auth/login")
      .send({ email: userA.email, password: userA.password });
    userAToken = loginA.body.token;

    const loginB = await request(app)
      .post("/api/auth/login")
      .send({ email: userB.email, password: userB.password });
    userBToken = loginB.body.token;

    // promote userA to admin so we can create equipment via the API
    const adminifiedUser = await UserModel.findOneAndUpdate(
      { email: userA.email },
      { role: "admin" },
      { new: true }
    );

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: userA.email, password: userA.password });
    const adminToken = adminLogin.body.token;

    const category = await EquipmentCategoryModel.create({
      name: "Rental Integration Category",
      isActive: true,
    });
    categoryId = category._id.toString();

    const equipmentResponse = await request(app)
      .post("/api/equipment")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("title", "Rental Test Camera")
      .field("description", "Camera for rental integration tests")
      .field("category", categoryId)
      .field("brand", "TestBrand")
      .field("model", "TestModel")
      .field("dailyRate", "500")
      .field("depositAmount", "1000")
      .attach("images", testImagePath);

    equipmentId = equipmentResponse.body.data._id;

    // demote userA back to a regular user so the rental IDOR tests are meaningful
    await UserModel.findOneAndUpdate({ email: userA.email }, { role: "user" });

    const relogA = await request(app)
      .post("/api/auth/login")
      .send({ email: userA.email, password: userA.password });
    userAToken = relogA.body.token;
  });

  afterAll(async () => {
    await RentalModel.deleteMany({ equipment: equipmentId });
    await EquipmentModel.deleteMany({ _id: equipmentId });
    await EquipmentCategoryModel.deleteMany({ _id: categoryId });
    await UserModel.deleteMany({ email: { $in: [userA.email, userB.email] } });

    if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);
  });

  describe("POST /api/rentals", () => {
    test("should reject rental creation without authentication", async () => {
      const response = await request(app).post("/api/rentals").send({
        equipmentId,
        startDate: "2026-08-01",
        endDate: "2026-08-05",
      });

      expect(response.status).toBe(401);
    });

    test("should reject a startDate in the past", async () => {
      const response = await request(app)
        .post("/api/rentals")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ equipmentId, startDate: "2020-01-01", endDate: "2020-01-05" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });

    test("should reject endDate before startDate", async () => {
      const response = await request(app)
        .post("/api/rentals")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ equipmentId, startDate: "2026-08-05", endDate: "2026-08-01" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });

    test("should create a rental request successfully", async () => {
      const response = await request(app)
        .post("/api/rentals")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ equipmentId, startDate: "2026-09-01", endDate: "2026-09-05" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("status", "pending");
      expect(response.body.data).toHaveProperty("rentalAmount", 2000);

      createdRentalId = response.body.data._id;
    });

    test("should reject overlapping rental for the same dates", async () => {
      const response = await request(app)
        .post("/api/rentals")
        .set("Authorization", `Bearer ${userBToken}`)
        .send({ equipmentId, startDate: "2026-09-02", endDate: "2026-09-06" });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("GET /api/rentals", () => {
    test("should list only the authenticated user's own rentals", async () => {
      const response = await request(app)
        .get("/api/rentals")
        .set("Authorization", `Bearer ${userAToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every((r: any) => r._id)).toBe(true);
    });

    test("should return an empty list for a user with no rentals", async () => {
      const response = await request(app)
        .get("/api/rentals")
        .set("Authorization", `Bearer ${userBToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe("GET /api/rentals/:id", () => {
    test("should fetch own rental successfully", async () => {
      const response = await request(app)
        .get(`/api/rentals/${createdRentalId}`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("_id", createdRentalId);
    });

    test("should return 404 (IDOR-safe) when fetching another user's rental", async () => {
      const response = await request(app)
        .get(`/api/rentals/${createdRentalId}`)
        .set("Authorization", `Bearer ${userBToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/rentals/:id", () => {
    test("should return 404 (IDOR-safe) when cancelling another user's rental", async () => {
      const response = await request(app)
        .delete(`/api/rentals/${createdRentalId}`)
        .set("Authorization", `Bearer ${userBToken}`);

      expect(response.status).toBe(404);
    });

    test("should cancel own pending rental successfully", async () => {
      const response = await request(app)
        .delete(`/api/rentals/${createdRentalId}`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("status", "cancelled");
    });

    test("should reject cancelling an already-cancelled rental", async () => {
      const response = await request(app)
        .delete(`/api/rentals/${createdRentalId}`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });
  });
});