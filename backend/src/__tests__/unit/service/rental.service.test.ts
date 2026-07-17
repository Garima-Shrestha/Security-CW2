import { RentalService } from "../../../services/rental.service";
import { RentalRepository } from "../../../repositories/rental.repository";
import { EquipmentRepository } from "../../../repositories/equipment.repository";

jest.mock("../../../config/logger", () => ({
  logActivity: jest.fn(),
  logSecurityEvent: jest.fn(),
}));
jest.mock("../../../utils/sanitize", () => ({
  sanitizeText: jest.fn((v: string) => v),
  sanitizeRichText: jest.fn((v: string) => v),
}));

describe("RentalService Unit Tests", () => {
  let rentalService: RentalService;

  const getEquipmentByIdSpy = jest.spyOn(EquipmentRepository.prototype, "getEquipmentById");
  const hasOverlappingRentalSpy = jest.spyOn(RentalRepository.prototype, "hasOverlappingRental");
  const createRentalSpy = jest.spyOn(RentalRepository.prototype, "createRental");
  const getRentalByIdSpy = jest.spyOn(RentalRepository.prototype, "getRentalById");
  const updateRentalSpy = jest.spyOn(RentalRepository.prototype, "updateRental");
  const getUserRentalsPaginatedSpy = jest.spyOn(RentalRepository.prototype, "getUserRentalsPaginated");

  beforeEach(() => {
    jest.clearAllMocks();
    rentalService = new RentalService();
  });

  
  // createRentalRequest
  test("createRentalRequest - should throw 404 when equipment not found", async () => {
    getEquipmentByIdSpy.mockResolvedValue(null);

    await expect(
      rentalService.createRentalRequest("u1", {
        equipmentId: "e1",
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-05"),
      } as any)
    ).rejects.toThrow("Equipment not found or unavailable");
  });

  test("createRentalRequest - should throw 404 when equipment is inactive", async () => {
    getEquipmentByIdSpy.mockResolvedValue({ isActive: false } as any);

    await expect(
      rentalService.createRentalRequest("u1", {
        equipmentId: "e1",
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-05"),
      } as any)
    ).rejects.toThrow("Equipment not found or unavailable");
  });

  test("createRentalRequest - should throw 409 when dates overlap an existing rental", async () => {
    getEquipmentByIdSpy.mockResolvedValue({ isActive: true, dailyRate: 100, depositAmount: 50 } as any);
    hasOverlappingRentalSpy.mockResolvedValue(true);

    await expect(
      rentalService.createRentalRequest("u1", {
        equipmentId: "e1",
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-05"),
      } as any)
    ).rejects.toThrow("Equipment is already booked for the selected dates");

    expect(createRentalSpy).not.toHaveBeenCalled();
  });

  test("createRentalRequest - should compute rentalAmount from server-side dailyRate and create rental", async () => {
    getEquipmentByIdSpy.mockResolvedValue({ isActive: true, dailyRate: 100, depositAmount: 50 } as any);
    hasOverlappingRentalSpy.mockResolvedValue(false);
    createRentalSpy.mockResolvedValue({ _id: "r1" } as any);

    const result = await rentalService.createRentalRequest("u1", {
      equipmentId: "e1",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-08-05"),
    } as any);

    expect(createRentalSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        totalDays: 4,
        rentalAmount: 400,
        depositAmount: 50,
        status: "pending",
        isPaid: false,
      })
    );
    expect(result).toEqual({ _id: "r1" });
  });

  
  // getOwnedRental
  test("getOwnedRental - should throw 404 when rental does not exist", async () => {
    getRentalByIdSpy.mockResolvedValue(null);

    await expect(rentalService.getOwnedRental("u1", "r1")).rejects.toThrow("Rental not found");
  });

  test("getOwnedRental - should throw 404 (IDOR-safe) when rental belongs to another user", async () => {
    getRentalByIdSpy.mockResolvedValue({
      _id: "r1",
      user: { _id: { toString: () => "u2" } },
    } as any);

    await expect(rentalService.getOwnedRental("u1", "r1")).rejects.toThrow("Rental not found");
  });

  test("getOwnedRental - should return the rental when owned by the user", async () => {
    const rental = { _id: "r1", user: { _id: { toString: () => "u1" } } };
    getRentalByIdSpy.mockResolvedValue(rental as any);

    const result = await rentalService.getOwnedRental("u1", "r1");

    expect(result).toEqual(rental);
  });

  
  // getUserRentals
  test("getUserRentals - should return paginated rentals with defaults", async () => {
    getUserRentalsPaginatedSpy.mockResolvedValue({ rentals: [{ _id: "r1" }] as any, total: 1 });

    const result = await rentalService.getUserRentals("u1");

    expect(getUserRentalsPaginatedSpy).toHaveBeenCalledWith("u1", 1, 10, undefined);
    expect(result.pagination).toEqual({ page: 1, size: 10, total: 1, totalPages: 1 });
  });

  test("getUserRentals - should respect page, size and status params", async () => {
    getUserRentalsPaginatedSpy.mockResolvedValue({ rentals: [], total: 0 });

    await rentalService.getUserRentals("u1", "2", "5", "completed");

    expect(getUserRentalsPaginatedSpy).toHaveBeenCalledWith("u1", 2, 5, "completed");
  });

  
  // cancelRental
  test("cancelRental - should throw 400 when rental status cannot be cancelled", async () => {
    getRentalByIdSpy.mockResolvedValue({
      _id: "r1",
      user: { _id: { toString: () => "u1" } },
      status: "active",
    } as any);

    await expect(rentalService.cancelRental("u1", "r1")).rejects.toThrow(
      "Cannot cancel a rental in status 'active'"
    );

    expect(updateRentalSpy).not.toHaveBeenCalled();
  });

  test("cancelRental - should cancel a pending rental and store the reason", async () => {
    getRentalByIdSpy.mockResolvedValue({
      _id: "r1",
      user: { _id: { toString: () => "u1" } },
      status: "pending",
    } as any);
    updateRentalSpy.mockResolvedValue({ _id: "r1", status: "cancelled" } as any);

    const result = await rentalService.cancelRental("u1", "r1", "Change of plans");

    expect(updateRentalSpy).toHaveBeenCalledWith("r1", {
      status: "cancelled",
      cancellationReason: "Change of plans",
    });
    expect(result?.status).toBe("cancelled");
  });

  test("cancelRental - should throw 404 (IDOR-safe) when cancelling someone else's rental", async () => {
    getRentalByIdSpy.mockResolvedValue({
      _id: "r1",
      user: { _id: { toString: () => "someone-else" } },
      status: "pending",
    } as any);

    await expect(rentalService.cancelRental("u1", "r1")).rejects.toThrow("Rental not found");

    expect(updateRentalSpy).not.toHaveBeenCalled();
  });
});