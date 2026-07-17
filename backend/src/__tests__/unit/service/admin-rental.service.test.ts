import { RentalAdminService } from "../../../services/admin/rental.service";
import { RentalRepository } from "../../../repositories/rental.repository";
import { KhaltiRentalService } from "../../../services/khalti-rental.service";

jest.mock("../../../config/logger", () => ({
  logActivity: jest.fn(),
  logSecurityEvent: jest.fn(),
}));
jest.mock("../../../utils/sanitize", () => ({
  sanitizeText: jest.fn((v: string) => v),
  sanitizeRichText: jest.fn((v: string) => v),
}));

describe("RentalAdminService Unit Tests", () => {
  let rentalAdminService: RentalAdminService;

  const getRentalByIdSpy = jest.spyOn(RentalRepository.prototype, "getRentalById");
  const updateRentalSpy = jest.spyOn(RentalRepository.prototype, "updateRental");
  const refundDepositSpy = jest.spyOn(KhaltiRentalService.prototype, "refundDeposit");

  beforeEach(() => {
    jest.clearAllMocks();
    rentalAdminService = new RentalAdminService();
  });

  test("confirmPickup - should throw 400 when rental is not confirmed yet", async () => {
    getRentalByIdSpy.mockResolvedValue({ _id: "r1", status: "pending" } as any);

    await expect(rentalAdminService.confirmPickup("admin1", "r1")).rejects.toThrow(
      "Rental must be paid/confirmed before pickup"
    );
  });

  test("processReturn - should throw 400 when deduction exceeds deposit amount", async () => {
    getRentalByIdSpy.mockResolvedValue({
      _id: "r1",
      status: "active",
      depositAmount: 50,
    } as any);

    await expect(
      rentalAdminService.processReturn("admin1", "r1", {
        deductionAmount: 100,
        deductionReason: "Damage",
      } as any)
    ).rejects.toThrow("Deduction cannot exceed deposit amount");

    expect(updateRentalSpy).not.toHaveBeenCalled();
  });
});