import { EquipmentCategoryRepository } from "../../../repositories/equipment-category.repository";
import { EquipmentCategoryModel } from "../../../models/equipment-category.model";
import mongoose from "mongoose";

function uid(): string {
  return Date.now().toString(36).slice(-6) + Math.floor(Math.random() * 1000);
}

describe("Equipment Category Repository Unit Tests", () => {
  let categoryRepository: EquipmentCategoryRepository;

  beforeAll(() => {
    categoryRepository = new EquipmentCategoryRepository();
  });

  afterEach(async () => {
    await EquipmentCategoryModel.deleteMany({});
  });

  
  // createCategory
  test("createCategory - should create a new category", async () => {
    const created = await categoryRepository.createCategory({
      name: `Cameras-${uid()}`,
      description: "Camera bodies and kits",
    });

    expect(created).toBeDefined();
    expect(created.description).toBe("Camera bodies and kits");
  });

  test("createCategory - should default isActive to true", async () => {
    const created = await categoryRepository.createCategory({ name: `Lenses-${uid()}` });
    expect(created.isActive).toBe(true);
  });

  test("createCategory - should reject a duplicate name at the DB level", async () => {
    const name = `Lighting-${uid()}`;
    await categoryRepository.createCategory({ name });

    await expect(categoryRepository.createCategory({ name })).rejects.toThrow();
  });


  // getCategoryByName
  test("getCategoryByName - should find a category case-insensitively", async () => {
    await EquipmentCategoryModel.create({ name: "TriPods", isActive: true });

    const found = await categoryRepository.getCategoryByName("tripods");

    expect(found).toBeDefined();
    expect(found?.name).toBe("TriPods");
  });

  test("getCategoryByName - should return null when not found", async () => {
    const found = await categoryRepository.getCategoryByName("NoSuchCategory");
    expect(found).toBeNull();
  });


  // getCategoryById
  test("getCategoryById - should return the category by id", async () => {
    const created = await EquipmentCategoryModel.create({ name: `Drones-${uid()}`, isActive: true });

    const found = await categoryRepository.getCategoryById(created._id.toString());

    expect(found?.name).toBe(created.name);
  });

  test("getCategoryById - should return null for a non-existent id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const found = await categoryRepository.getCategoryById(fakeId);
    expect(found).toBeNull();
  });


  // getAllCategories
  test("getAllCategories - should return categories sorted by name ascending", async () => {
    await EquipmentCategoryModel.create({ name: "Zebra", isActive: true });
    await EquipmentCategoryModel.create({ name: "Alpha", isActive: true });

    const results = await categoryRepository.getAllCategories();

    expect(results[0].name).toBe("Alpha");
    expect(results[1].name).toBe("Zebra");
  });


  // updateOneCategory
  test("updateOneCategory - should update the category description", async () => {
    const created = await EquipmentCategoryModel.create({ name: `Audio-${uid()}`, isActive: true });

    const updated = await categoryRepository.updateOneCategory(created._id.toString(), {
      description: "Mics and recorders",
    });

    expect(updated?.description).toBe("Mics and recorders");
  });

  // deleteOneCategory
  test("deleteOneCategory - should delete the category and return true", async () => {
    const created = await EquipmentCategoryModel.create({ name: `Grip-${uid()}`, isActive: true });

    const result = await categoryRepository.deleteOneCategory(created._id.toString());

    expect(result).toBe(true);
    const found = await categoryRepository.getCategoryById(created._id.toString());
    expect(found).toBeNull();
  });
});