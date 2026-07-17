import { KhaltiRepository } from "../../../repositories/khalti.repository";
import { KhaltiPaymentModel } from "../../../models/khalti.model";
import { UserModel } from "../../../models/user.model";
import { EquipmentModel } from "../../../models/equipment.model";
import { EquipmentCategoryModel } from "../../../models/equipment-category.model";
import mongoose from "mongoose";

function uid(): string {
  return Date.now().toString(36).slice(-6) + Math.floor(Math.random() * 1000);
}

describe("Khalti Repository Unit Tests", () => {
  let khaltiRepository: KhaltiRepository;
  let userId!: string;
  let equipmentId!: string;

  beforeAll(() => {
    khaltiRepository = new KhaltiRepository();
  });

  beforeEach(async () => {
    const tag = uid();

    const user = await UserModel.create({
      username: `ku${tag}`,
      email: `ku${tag}@example.com`,
      phone: `98${Math.floor(100000000 + Math.random() * 899999999)}`,
      password: "hashedPassword",
      role: "user",
    });
    userId = user._id.toString();

    const category = await EquipmentCategoryModel.create({ name: `kcat-${tag}`, isActive: true });
    const equipment = await EquipmentModel.create({
      title: "Canon EOS R5",
      description: "Full frame mirrorless camera",
      category: category._id,
      brand: "Canon",
      model: "EOS R5",
      condition: "excellent",
      dailyRate: 1500,
      depositAmount: 20000,
      images: ["/uploads/images/cam-1.jpg"],
      isActive: true,
    } as any);
    equipmentId = equipment._id.toString();
  });

  afterEach(async () => {
    await KhaltiPaymentModel.deleteMany({});
    await UserModel.deleteMany({});
    await EquipmentModel.deleteMany({});
    await EquipmentCategoryModel.deleteMany({});
  });

  function basePayment(overrides: Record<string, any> = {}) {
    return {
      user: userId,
      equipment: equipmentId,
      pidx: `pidx-${uid()}`,
      amount: 150000,
      purchaseOrderId: `order-${uid()}`,
      purchaseOrderName: "Rental payment",
      status: "Initiated",
      isProcessed: false,
      ...overrides,
    };
  }

  // createPayment

  test("createPayment - should create a new payment record", async () => {
    const created = await khaltiRepository.createPayment(basePayment() as any);

    expect(created).toBeDefined();
    expect(created.status).toBe("Initiated");
  });

  // getPaymentByPidx

  test("getPaymentByPidx - should find a payment by pidx", async () => {
    const payment = basePayment();
    await KhaltiPaymentModel.create(payment as any);

    const found = await khaltiRepository.getPaymentByPidx(payment.pidx);

    expect(found).toBeDefined();
    expect(found?.pidx).toBe(payment.pidx);
  });

  test("getPaymentByPidx - should return null when pidx doesn't exist", async () => {
    const found = await khaltiRepository.getPaymentByPidx("nonexistent-pidx");
    expect(found).toBeNull();
  });

  // updatePaymentByPidx

  test("updatePaymentByPidx - should update payment status", async () => {
    const payment = basePayment();
    await KhaltiPaymentModel.create(payment as any);

    const updated = await khaltiRepository.updatePaymentByPidx(payment.pidx, {
      status: "Completed",
      isProcessed: true,
    } as any);

    expect(updated?.status).toBe("Completed");
    expect(updated?.isProcessed).toBe(true);
  });

  // getPaymentById

  test("getPaymentById - should return the payment by its id", async () => {
    const created = await KhaltiPaymentModel.create(basePayment() as any);

    const found = await khaltiRepository.getPaymentById(created._id.toString());

    expect(found?.pidx).toBe(created.pidx);
  });

  test("getPaymentById - should return null for a non-existent id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const found = await khaltiRepository.getPaymentById(fakeId);
    expect(found).toBeNull();
  });

  // getPaymentsByUser

  test("getPaymentsByUser - should return payments for the given user sorted by newest first", async () => {
    const first = await KhaltiPaymentModel.create(basePayment() as any);
    await new Promise((r) => setTimeout(r, 10));
    const second = await KhaltiPaymentModel.create(basePayment() as any);

    const results = await khaltiRepository.getPaymentsByUser(userId);

    expect(results.length).toBe(2);
    expect(results[0]._id.toString()).toBe(second._id.toString());
    expect(results[1]._id.toString()).toBe(first._id.toString());
  });

  // getPaymentByPurchaseOrderId

  test("getPaymentByPurchaseOrderId - should only return a Completed payment", async () => {
    const orderId = `order-${uid()}`;
    await KhaltiPaymentModel.create(basePayment({ purchaseOrderId: orderId, status: "Initiated" }) as any);

    const found = await khaltiRepository.getPaymentByPurchaseOrderId(orderId);

    expect(found).toBeNull();
  });

  test("getPaymentByPurchaseOrderId - should return the completed payment when it exists", async () => {
    const orderId = `order-${uid()}`;
    await KhaltiPaymentModel.create(basePayment({ purchaseOrderId: orderId, status: "Completed" }) as any);

    const found = await khaltiRepository.getPaymentByPurchaseOrderId(orderId);

    expect(found).toBeDefined();
    expect(found?.status).toBe("Completed");
  });
});