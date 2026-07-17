import { EquipmentRepository } from "../../../repositories/equipment.repository";
import { EquipmentModel } from "../../../models/equipment.model";
import { EquipmentCategoryModel } from "../../../models/equipment-category.model";
import mongoose from "mongoose";

describe("Equipment Repository Unit Tests", () => {
  let equipmentRepository: EquipmentRepository;
  let categoryId!: string;
  let categoryId2!: string;

  beforeAll(() => {
    equipmentRepository = new EquipmentRepository();
  });

  beforeEach(async () => {
    const category = await EquipmentCategoryModel.create({
      name: `Category-${Date.now()}-${Math.random()}`,
      isActive: true,
    });
    categoryId = category._id.toString();

    const category2 = await EquipmentCategoryModel.create({
      name: `Category2-${Date.now()}-${Math.random()}`,
      isActive: true,
    });
    categoryId2 = category2._id.toString();
  });

  afterEach(async () => {
    await EquipmentModel.deleteMany({});
    await EquipmentCategoryModel.deleteMany({});
  });

  function baseEquipment(overrides: Record<string, any> = {}) {
    return {
      title: "Canon EOS R5",
      description: "Full frame mirrorless camera",
      category: categoryId,
      brand: "Canon",
      model: "EOS R5",
      condition: "excellent",
      dailyRate: 1500,
      depositAmount: 20000,
      images: ["/uploads/images/cam-1.jpg"],
      isActive: true,
      ...overrides,
    };
  }

  
  // createEquipment
  test("createEquipment - should create a new equipment item", async () => {
    const created = await equipmentRepository.createEquipment(baseEquipment() as any);

    expect(created).toBeDefined();
    expect(created.title).toBe("Canon EOS R5");
    expect(created.brand).toBe("Canon");
    expect(created.isActive).toBe(true);
  });

  test("createEquipment - should default isActive to true when not provided", async () => {
    const created = await equipmentRepository.createEquipment(
      baseEquipment({ isActive: undefined }) as any
    );

    expect(created.isActive).toBe(true);
  });

  test("createEquipment - should default condition to 'good' when not provided", async () => {
    const created = await equipmentRepository.createEquipment(
      baseEquipment({ condition: undefined }) as any
    );

    expect(created.condition).toBe("good");
  });

  test("createEquipment - should store specs as a map", async () => {
    const created = await equipmentRepository.createEquipment(
      baseEquipment({ specs: { sensor: "Full Frame", mount: "EF" } }) as any
    );

    expect((created.specs as any)?.get("sensor")).toBe("Full Frame");
    expect((created.specs as any)?.get("mount")).toBe("EF");
  });

  
  // getEquipmentById
  test("getEquipmentById - should get equipment by id with category populated", async () => {
    const created = await EquipmentModel.create(baseEquipment() as any);

    const found = await equipmentRepository.getEquipmentById(created._id.toString());

    expect(found).toBeDefined();
    expect(found?.title).toBe("Canon EOS R5");
    expect((found?.category as any)._id.toString()).toBe(categoryId);
  });

  test("getEquipmentById - should return null for a non-existent id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const found = await equipmentRepository.getEquipmentById(fakeId);
    expect(found).toBeNull();
  });

  
  // updateOneEquipment
  test("updateOneEquipment - should update equipment fields", async () => {
    const created = await EquipmentModel.create(baseEquipment() as any);

    const updated = await equipmentRepository.updateOneEquipment(created._id.toString(), {
      dailyRate: 2000,
    } as any);

    expect(updated?.dailyRate).toBe(2000);
  });

  test("updateOneEquipment - should return null when updating a non-existent id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const updated = await equipmentRepository.updateOneEquipment(fakeId, { dailyRate: 500 } as any);
    expect(updated).toBeNull();
  });

  test("updateOneEquipment - should allow deactivating equipment", async () => {
    const created = await EquipmentModel.create(baseEquipment() as any);

    const updated = await equipmentRepository.updateOneEquipment(created._id.toString(), {
      isActive: false,
    } as any);

    expect(updated?.isActive).toBe(false);
  });

  
  // deleteOneEquipment
  test("deleteOneEquipment - should delete equipment", async () => {
    const created = await EquipmentModel.create(baseEquipment() as any);

    const result = await equipmentRepository.deleteOneEquipment(created._id.toString());

    expect(result).toBe(true);

    const found = await equipmentRepository.getEquipmentById(created._id.toString());
    expect(found).toBeNull();
  });

  test("deleteOneEquipment - should return null when deleting a non-existent id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const result = await equipmentRepository.deleteOneEquipment(fakeId);
    expect(result).toBeNull();
  });

  
  // getAllEquipmentPaginated
  test("getAllEquipmentPaginated - should return only active equipment by default", async () => {
    await EquipmentModel.create(baseEquipment({ title: "Active Item", isActive: true }) as any);
    await EquipmentModel.create(baseEquipment({ title: "Inactive Item", isActive: false }) as any);

    const { equipment, total } = await equipmentRepository.getAllEquipmentPaginated(1, 10);

    expect(total).toBe(1);
    expect(equipment[0].title).toBe("Active Item");
  });

  test("getAllEquipmentPaginated - should include inactive equipment when includeInactive=true", async () => {
    await EquipmentModel.create(baseEquipment({ title: "Active Item", isActive: true }) as any);
    await EquipmentModel.create(baseEquipment({ title: "Inactive Item", isActive: false }) as any);

    const { equipment, total } = await equipmentRepository.getAllEquipmentPaginated(
      1,
      10,
      undefined,
      undefined,
      true
    );

    expect(total).toBe(2);
    expect(equipment.map((e) => e.title).sort()).toEqual(["Active Item", "Inactive Item"]);
  });

  test("getAllEquipmentPaginated - should paginate results correctly", async () => {
    for (let i = 0; i < 12; i++) {
      await EquipmentModel.create(baseEquipment({ title: `Item ${i}` }) as any);
    }

    const { equipment, total } = await equipmentRepository.getAllEquipmentPaginated(1, 5);

    expect(total).toBe(12);
    expect(equipment.length).toBe(5);
  });

  test("getAllEquipmentPaginated - should filter by categoryId", async () => {
    await EquipmentModel.create(baseEquipment({ title: "Cat1 Item", category: categoryId }) as any);
    await EquipmentModel.create(baseEquipment({ title: "Cat2 Item", category: categoryId2 }) as any);

    const { equipment, total } = await equipmentRepository.getAllEquipmentPaginated(
      1,
      10,
      undefined,
      categoryId2
    );

    expect(total).toBe(1);
    expect(equipment[0].title).toBe("Cat2 Item");
  });

  test("getAllEquipmentPaginated - should filter by searchTerm matching title", async () => {
    await EquipmentModel.create(baseEquipment({ title: "Sony A7III" }) as any);
    await EquipmentModel.create(baseEquipment({ title: "Canon EOS R5" }) as any);

    const { equipment, total } = await equipmentRepository.getAllEquipmentPaginated(
      1,
      10,
      "Sony"
    );

    expect(total).toBe(1);
    expect(equipment[0].title).toBe("Sony A7III");
  });

  test("getAllEquipmentPaginated - should filter by searchTerm matching brand", async () => {
    await EquipmentModel.create(baseEquipment({ title: "Camera A", brand: "Nikon" }) as any);
    await EquipmentModel.create(baseEquipment({ title: "Camera B", brand: "Canon" }) as any);

    const { equipment, total } = await equipmentRepository.getAllEquipmentPaginated(
      1,
      10,
      "Nikon"
    );

    expect(total).toBe(1);
    expect(equipment[0].brand).toBe("Nikon");
  });

  test("getAllEquipmentPaginated - should filter by searchTerm matching model", async () => {
    await EquipmentModel.create(baseEquipment({ title: "Camera A", model: "A7III" }) as any);
    await EquipmentModel.create(baseEquipment({ title: "Camera B", model: "EOS R5" }) as any);

    const { equipment, total } = await equipmentRepository.getAllEquipmentPaginated(
      1,
      10,
      "A7III"
    );

    expect(total).toBe(1);
    expect(equipment[0].model).toBe("A7III");
  });

  test("getAllEquipmentPaginated - should return empty results when no match", async () => {
    await EquipmentModel.create(baseEquipment() as any);

    const { equipment, total } = await equipmentRepository.getAllEquipmentPaginated(
      1,
      10,
      "NoSuchThing"
    );

    expect(total).toBe(0);
    expect(equipment).toEqual([]);
  });

  
  // getAllActiveForFuzzySearch
  test("getAllActiveForFuzzySearch - should return only active equipment", async () => {
    await EquipmentModel.create(baseEquipment({ title: "Active Item", isActive: true }) as any);
    await EquipmentModel.create(baseEquipment({ title: "Inactive Item", isActive: false }) as any);

    const results = await equipmentRepository.getAllActiveForFuzzySearch();

    expect(results.length).toBe(1);
    expect(results[0].title).toBe("Active Item");
  });

  test("getAllActiveForFuzzySearch - should filter by categoryId when provided", async () => {
    await EquipmentModel.create(baseEquipment({ title: "Cat1 Item", category: categoryId }) as any);
    await EquipmentModel.create(baseEquipment({ title: "Cat2 Item", category: categoryId2 }) as any);

    const results = await equipmentRepository.getAllActiveForFuzzySearch(categoryId);

    expect(results.length).toBe(1);
    expect(results[0].title).toBe("Cat1 Item");
  });

  test("getAllActiveForFuzzySearch - should return populated category on results", async () => {
    await EquipmentModel.create(baseEquipment() as any);

    const results = await equipmentRepository.getAllActiveForFuzzySearch();

    expect((results[0].category as any).name).toBeDefined();
  });
});