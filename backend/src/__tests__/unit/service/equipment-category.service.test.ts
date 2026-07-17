import { EquipmentCategoryService } from "../../../services/equipment-category.service";
import { EquipmentCategoryRepository } from "../../../repositories/equipment-category.repository";

jest.mock("../../../config/logger", () => ({
  logActivity: jest.fn(),
  logSecurityEvent: jest.fn(),
}));
jest.mock("../../../utils/sanitize", () => ({
  sanitizeText: jest.fn((v: string) => v),
  sanitizeRichText: jest.fn((v: string) => v),
}));

describe("EquipmentCategoryService Unit Tests", () => {
  let categoryService: EquipmentCategoryService;

  const getCategoryByNameSpy = jest.spyOn(EquipmentCategoryRepository.prototype, "getCategoryByName");
  const createCategorySpy = jest.spyOn(EquipmentCategoryRepository.prototype, "createCategory");

  beforeEach(() => {
    jest.clearAllMocks();
    categoryService = new EquipmentCategoryService();
  });

  test("createCategory - should throw 409 when category name already exists", async () => {
    getCategoryByNameSpy.mockResolvedValue({ _id: "c1", name: "Cameras" } as any);

    await expect(
      categoryService.createCategory({ name: "Cameras" } as any, "admin1")
    ).rejects.toThrow("Category name already exists");

    expect(createCategorySpy).not.toHaveBeenCalled();
  });

  test("createCategory - should create a category successfully", async () => {
    getCategoryByNameSpy.mockResolvedValue(null);
    createCategorySpy.mockResolvedValue({ _id: "c1", name: "Lenses" } as any);

    const result = await categoryService.createCategory({ name: "Lenses" } as any, "admin1");

    expect(result).toEqual({ _id: "c1", name: "Lenses" });
  });
});