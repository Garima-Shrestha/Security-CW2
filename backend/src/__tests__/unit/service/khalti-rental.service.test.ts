import { KhaltiRentalService } from "../../../services/khalti-rental.service";
import { RentalRepository } from "../../../repositories/rental.repository";
import { KhaltiRepository } from "../../../repositories/khalti.repository";

jest.mock("../../../config/logger", () => ({
  logActivity: jest.fn(),
  logSecurityEvent: jest.fn(),
}));

describe("KhaltiRentalService Unit Tests", () => {
  let khaltiRentalService: KhaltiRentalService;

  const getRentalByIdSpy = jest.spyOn(RentalRepository.prototype, "getRentalById");
  const getPaymentByPidxSpy = jest.spyOn(KhaltiRepository.prototype, "getPaymentByPidx");

  beforeEach(() => {
    jest.clearAllMocks();
    khaltiRentalService = new KhaltiRentalService();
  });

  test("initiatePayment - should throw 404 (IDOR-safe) when rental belongs to another user", async () => {
    getRentalByIdSpy.mockResolvedValue({
      _id: "r1",
      user: { _id: { toString: () => "someone-else" } },
      status: "pending",
    } as any);

    await expect(khaltiRentalService.initiatePayment("u1", "r1")).rejects.toThrow(
      "Rental not found"
    );
  });

  test("verifyPayment - should throw 403 when payment belongs to another user", async () => {
    getPaymentByPidxSpy.mockResolvedValue({
      user: { toString: () => "someone-else" },
    } as any);

    await expect(khaltiRentalService.verifyPayment("u1", "pidx123")).rejects.toThrow(
      "Forbidden"
    );
  });
});