import { RentalRepository } from "../../../repositories/rental.repository";
import { RentalModel } from "../../../models/rental.model";
import { UserModel } from "../../../models/user.model";
import { EquipmentModel } from "../../../models/equipment.model";
import { EquipmentCategoryModel } from "../../../models/equipment-category.model";
import mongoose from "mongoose";


function uid(): string {
  return Date.now().toString(36).slice(-6) + Math.floor(Math.random() * 1000);
}

describe("Rental Repository Unit Tests", () => {
  let rentalRepository: RentalRepository;
  let userId!: string;
  let userId2!: string;
  let equipmentId!: string;

  beforeAll(() => {
    rentalRepository = new RentalRepository();
  });

  beforeEach(async () => {
    const tag = uid();

    const user = await UserModel.create({
      username: `u1${tag}`,
      email: `u1${tag}@example.com`,
      phone: `98${Math.floor(100000000 + Math.random() * 899999999)}`,
      password: "hashedPassword",
      role: "user",
    });
    userId = user._id.toString();

    const user2 = await UserModel.create({
      username: `u2${tag}`,
      email: `u2${tag}@example.com`,
      phone: `98${Math.floor(100000000 + Math.random() * 899999999)}`,
      password: "hashedPassword",
      role: "user",
    });
    userId2 = user2._id.toString();

    const category = await EquipmentCategoryModel.create({
      name: `cat-${tag}`,
      isActive: true,
    });

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
    await RentalModel.deleteMany({});
    await UserModel.deleteMany({});
    await EquipmentModel.deleteMany({});
    await EquipmentCategoryModel.deleteMany({});
  });

  function baseRental(overrides: Record<string, any> = {}) {
    return {
      user: userId,
      equipment: equipmentId,
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-08-05"),
      dailyRate: 1500,
      totalDays: 4,
      rentalAmount: 6000,
      depositAmount: 20000,
      status: "pending",
      isPaid: false,
      ...overrides,
    };
  }


  // createRental
  test("createRental - should create a new rental", async () => {
    const created = await rentalRepository.createRental(baseRental() as any);

    expect(created).toBeDefined();
    expect(created.status).toBe("pending");
    expect(created.rentalAmount).toBe(6000);
  });

  test("createRental - should default deductionAmount to 0", async () => {
    const created = await rentalRepository.createRental(baseRental() as any);
    expect(created.deductionAmount).toBe(0);
  });

  test("createRental - should default depositRefunded to false", async () => {
    const created = await rentalRepository.createRental(baseRental() as any);
    expect(created.depositRefunded).toBe(false);
  });


  // getRentalById
  test("getRentalById - should get rental by id with user and equipment populated", async () => {
    const created = await RentalModel.create(baseRental() as any);

    const found = await rentalRepository.getRentalById(created._id.toString());

    expect(found).toBeDefined();
    expect((found?.user as any)._id.toString()).toBe(userId);
    expect((found?.equipment as any).title).toBe("Canon EOS R5");
  });

  test("getRentalById - should not populate user's password", async () => {
    const created = await RentalModel.create(baseRental() as any);

    const found = await rentalRepository.getRentalById(created._id.toString());

    expect((found?.user as any).password).toBeUndefined();
  });

  test("getRentalById - should return null for a non-existent id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const found = await rentalRepository.getRentalById(fakeId);
    expect(found).toBeNull();
  });


  // updateRental
  test("updateRental - should update rental status", async () => {
    const created = await RentalModel.create(baseRental() as any);

    const updated = await rentalRepository.updateRental(created._id.toString(), {
      status: "confirmed",
      isPaid: true,
    } as any);

    expect(updated?.status).toBe("confirmed");
    expect(updated?.isPaid).toBe(true);
  });

  test("updateRental - should return null when updating a non-existent id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const updated = await rentalRepository.updateRental(fakeId, { status: "confirmed" } as any);
    expect(updated).toBeNull();
  });


  // hasOverlappingRental
  test("hasOverlappingRental - should detect an overlapping active rental", async () => {
    await RentalModel.create(
      baseRental({
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-10"),
        status: "confirmed",
      }) as any
    );

    const overlaps = await rentalRepository.hasOverlappingRental(
      equipmentId,
      new Date("2026-08-05"),
      new Date("2026-08-15")
    );

    expect(overlaps).toBe(true);
  });

  test("hasOverlappingRental - should return false for non-overlapping dates", async () => {
    await RentalModel.create(
      baseRental({
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-05"),
        status: "confirmed",
      }) as any
    );

    const overlaps = await rentalRepository.hasOverlappingRental(
      equipmentId,
      new Date("2026-08-10"),
      new Date("2026-08-15")
    );

    expect(overlaps).toBe(false);
  });

  test("hasOverlappingRental - should ignore cancelled rentals", async () => {
    await RentalModel.create(
      baseRental({
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-10"),
        status: "cancelled",
      }) as any
    );

    const overlaps = await rentalRepository.hasOverlappingRental(
      equipmentId,
      new Date("2026-08-05"),
      new Date("2026-08-08")
    );

    expect(overlaps).toBe(false);
  });

  test("hasOverlappingRental - should ignore completed rentals", async () => {
    await RentalModel.create(
      baseRental({
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-10"),
        status: "completed",
      }) as any
    );

    const overlaps = await rentalRepository.hasOverlappingRental(
      equipmentId,
      new Date("2026-08-05"),
      new Date("2026-08-08")
    );

    expect(overlaps).toBe(false);
  });

  test("hasOverlappingRental - should detect overlap with overdue status", async () => {
    await RentalModel.create(
      baseRental({
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-10"),
        status: "overdue",
      }) as any
    );

    const overlaps = await rentalRepository.hasOverlappingRental(
      equipmentId,
      new Date("2026-08-05"),
      new Date("2026-08-08")
    );

    expect(overlaps).toBe(true);
  });

  test("hasOverlappingRental - should exclude a given rentalId (for update flows)", async () => {
    const existing = await RentalModel.create(
      baseRental({
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-10"),
        status: "confirmed",
      }) as any
    );

    const overlaps = await rentalRepository.hasOverlappingRental(
      equipmentId,
      new Date("2026-08-05"),
      new Date("2026-08-08"),
      existing._id.toString()
    );

    expect(overlaps).toBe(false);
  });

  test("hasOverlappingRental - should not detect overlap for a different equipment", async () => {
    const tag = uid();
    const category = await EquipmentCategoryModel.create({
      name: `cat-other-${tag}`,
      isActive: true,
    });
    const otherEquipment = await EquipmentModel.create({
      title: "Sony A7III",
      description: "Mirrorless camera",
      category: category._id,
      brand: "Sony",
      model: "A7III",
      condition: "good",
      dailyRate: 1000,
      depositAmount: 10000,
      images: ["/uploads/images/cam-2.jpg"],
      isActive: true,
    } as any);

    await RentalModel.create(
      baseRental({
        equipment: otherEquipment._id.toString(),
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-10"),
        status: "confirmed",
      }) as any
    );

    const overlaps = await rentalRepository.hasOverlappingRental(
      equipmentId,
      new Date("2026-08-05"),
      new Date("2026-08-08")
    );

    expect(overlaps).toBe(false);
  });


  // getUserRentalsPaginated
  test("getUserRentalsPaginated - should return only rentals for the given user", async () => {
    await RentalModel.create(baseRental({ user: userId }) as any);
    await RentalModel.create(baseRental({ user: userId2 }) as any);

    const { rentals, total } = await rentalRepository.getUserRentalsPaginated(userId, 1, 10);

    expect(total).toBe(1);
    expect(rentals[0].user.toString()).toBe(userId);
  });

  test("getUserRentalsPaginated - should filter by status", async () => {
    await RentalModel.create(baseRental({ user: userId, status: "pending" }) as any);
    await RentalModel.create(baseRental({ user: userId, status: "completed" }) as any);

    const { rentals, total } = await rentalRepository.getUserRentalsPaginated(
      userId,
      1,
      10,
      "completed"
    );

    expect(total).toBe(1);
    expect(rentals[0].status).toBe("completed");
  });

  test("getUserRentalsPaginated - should paginate correctly", async () => {
    for (let i = 0; i < 12; i++) {
      await RentalModel.create(baseRental({ user: userId }) as any);
    }

    const { rentals, total } = await rentalRepository.getUserRentalsPaginated(userId, 1, 5);

    expect(total).toBe(12);
    expect(rentals.length).toBe(5);
  });

  test("getUserRentalsPaginated - should populate equipment", async () => {
    await RentalModel.create(baseRental({ user: userId }) as any);

    const { rentals } = await rentalRepository.getUserRentalsPaginated(userId, 1, 10);

    expect((rentals[0].equipment as any).title).toBe("Canon EOS R5");
  });


  // getAllRentalsPaginated
  test("getAllRentalsPaginated - should return rentals across all users", async () => {
    await RentalModel.create(baseRental({ user: userId }) as any);
    await RentalModel.create(baseRental({ user: userId2 }) as any);

    const { rentals, total } = await rentalRepository.getAllRentalsPaginated(1, 10);

    expect(total).toBe(2);
    expect(rentals.length).toBe(2);
  });

  test("getAllRentalsPaginated - should filter by status", async () => {
    await RentalModel.create(baseRental({ user: userId, status: "pending" }) as any);
    await RentalModel.create(baseRental({ user: userId2, status: "active" }) as any);

    const { rentals, total } = await rentalRepository.getAllRentalsPaginated(1, 10, "active");

    expect(total).toBe(1);
    expect(rentals[0].status).toBe("active");
  });

  test("getAllRentalsPaginated - should not populate user's totpSecret", async () => {
    await RentalModel.create(baseRental({ user: userId }) as any);

    const { rentals } = await rentalRepository.getAllRentalsPaginated(1, 10);

    expect((rentals[0].user as any).totpSecret).toBeUndefined();
  });

  test("getAllRentalsPaginated - should paginate correctly", async () => {
    for (let i = 0; i < 7; i++) {
      await RentalModel.create(baseRental({ user: userId }) as any);
    }

    const { rentals, total } = await rentalRepository.getAllRentalsPaginated(1, 3);

    expect(total).toBe(7);
    expect(rentals.length).toBe(3);
  });


  // getOverdueRentals
  test("getOverdueRentals - should return active rentals past their endDate", async () => {
    await RentalModel.create(
      baseRental({
        status: "active",
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      }) as any
    );

    const overdue = await rentalRepository.getOverdueRentals();

    expect(overdue.length).toBe(1);
  });

  test("getOverdueRentals - should not return active rentals with a future endDate", async () => {
    await RentalModel.create(
      baseRental({
        status: "active",
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }) as any
    );

    const overdue = await rentalRepository.getOverdueRentals();

    expect(overdue.length).toBe(0);
  });

  test("getOverdueRentals - should not return non-active rentals even if past endDate", async () => {
    await RentalModel.create(
      baseRental({
        status: "completed",
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      }) as any
    );

    const overdue = await rentalRepository.getOverdueRentals();

    expect(overdue.length).toBe(0);
  });


  // getStalePendingRentals
  test("getStalePendingRentals - should return unpaid pending rentals older than the cutoff", async () => {
    const stale = await RentalModel.create(
      baseRental({ status: "pending", isPaid: false }) as any
    );
    await RentalModel.collection.updateOne(
      { _id: stale._id },
      { $set: { createdAt: new Date(Date.now() - 60 * 60 * 1000) } }
    );

    const results = await rentalRepository.getStalePendingRentals(30);

    expect(results.length).toBe(1);
  });

  test("getStalePendingRentals - should not return recently created pending rentals", async () => {
    await RentalModel.create(baseRental({ status: "pending", isPaid: false }) as any);

    const results = await rentalRepository.getStalePendingRentals(30);

    expect(results.length).toBe(0);
  });

  test("getStalePendingRentals - should not return paid rentals even if old", async () => {
    const paid = await RentalModel.create(
      baseRental({ status: "pending", isPaid: true }) as any
    );
    await RentalModel.updateOne(
      { _id: paid._id },
      { $set: { createdAt: new Date(Date.now() - 60 * 60 * 1000) } }
    );

    const results = await rentalRepository.getStalePendingRentals(30);

    expect(results.length).toBe(0);
  });

  test("getStalePendingRentals - should not return non-pending rentals even if old and unpaid", async () => {
    const confirmed = await RentalModel.create(
      baseRental({ status: "confirmed", isPaid: false }) as any
    );
    await RentalModel.updateOne(
      { _id: confirmed._id },
      { $set: { createdAt: new Date(Date.now() - 60 * 60 * 1000) } }
    );

    const results = await rentalRepository.getStalePendingRentals(30);

    expect(results.length).toBe(0);
  });


  // isCurrentlyBooked
  test("isCurrentlyBooked - should return true when a rental covers today's date", async () => {
    await RentalModel.create(
      baseRental({
        status: "confirmed",
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }) as any
    );

    const booked = await rentalRepository.isCurrentlyBooked(equipmentId);

    expect(booked).toBe(true);
  });

  test("isCurrentlyBooked - should return false when no rental covers today's date", async () => {
    await RentalModel.create(
      baseRental({
        status: "confirmed",
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      }) as any
    );

    const booked = await rentalRepository.isCurrentlyBooked(equipmentId);

    expect(booked).toBe(false);
  });

  test("isCurrentlyBooked - should return false when the only covering rental is cancelled", async () => {
    await RentalModel.create(
      baseRental({
        status: "cancelled",
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }) as any
    );

    const booked = await rentalRepository.isCurrentlyBooked(equipmentId);

    expect(booked).toBe(false);
  });
});