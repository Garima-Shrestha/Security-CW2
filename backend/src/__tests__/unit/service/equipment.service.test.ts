import { EquipmentService } from "../../../services/equipment.service";
import { EquipmentRepository } from "../../../repositories/equipment.repository";
import { RentalRepository } from "../../../repositories/rental.repository";

jest.mock("../../../config/logger", () => ({
  logActivity: jest.fn(),
  logSecurityEvent: jest.fn(),
}));
jest.mock("../../../utils/sanitize", () => ({
  sanitizeText: jest.fn((v: string) => v),
  sanitizeRichText: jest.fn((v: string) => v),
}));

describe("EquipmentService Unit Tests", () => {
  let equipmentService: EquipmentService;

  const getEquipmentByIdSpy = jest.spyOn(EquipmentRepository.prototype, "getEquipmentById");
  const isCurrentlyBookedSpy = jest.spyOn(RentalRepository.prototype, "isCurrentlyBooked");
  const getAllEquipmentPaginatedSpy = jest.spyOn(EquipmentRepository.prototype, "getAllEquipmentPaginated");
  const getAllActiveForFuzzySearchSpy = jest.spyOn(EquipmentRepository.prototype, "getAllActiveForFuzzySearch");

  beforeEach(() => {
    jest.clearAllMocks();
    equipmentService = new EquipmentService();
  });

  test("getEquipmentById - should throw 404 when equipment is inactive and includeInactive is false", async () => {
    getEquipmentByIdSpy.mockResolvedValue({ isActive: false, toObject: () => ({}) } as any);

    await expect(equipmentService.getEquipmentById("e1", false)).rejects.toThrow(
      "Equipment not found"
    );
  });

  test("getEquipmentById - should return equipment with isBooked flag when active", async () => {
    getEquipmentByIdSpy.mockResolvedValue({
      isActive: true,
      toObject: () => ({ _id: "e1", title: "Camera" }),
    } as any);
    isCurrentlyBookedSpy.mockResolvedValue(true);

    const result = await equipmentService.getEquipmentById("e1");

    expect(result).toEqual({ _id: "e1", title: "Camera", isBooked: true });
  });

  test("getAllEquipmentPaginated - should fall back to fuzzy search when exact match finds nothing", async () => {
    getAllEquipmentPaginatedSpy.mockResolvedValue({ equipment: [], total: 0 });
    getAllActiveForFuzzySearchSpy.mockResolvedValue([
      { title: "Canon EOS R5", brand: "Canon", model: "R5" },
    ] as any);

    const result = await equipmentService.getAllEquipmentPaginated("1", "10", "cannon");

    expect(getAllActiveForFuzzySearchSpy).toHaveBeenCalled();
    expect(result.pagination.total).toBe(1);
    expect(result.equipment).toHaveLength(1);
  });
});