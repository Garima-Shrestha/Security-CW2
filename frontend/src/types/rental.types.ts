export type RentalStatusType =
    | "pending"
    | "confirmed"
    | "active"
    | "returned"
    | "completed"
    | "cancelled"
    | "overdue";

export interface RentalEquipment {
    _id: string;
    title: string;
    images: string[];
    dailyRate: number;
}

export interface Rental {
    _id: string;
    user: string;
    equipment: RentalEquipment;
    startDate: string;
    endDate: string;
    dailyRate: number;
    totalDays: number;
    rentalAmount: number;
    depositAmount: number;
    status: RentalStatusType;
    deductionAmount: number;
    deductionReason?: string;
    depositRefunded: boolean;
    cancellationReason?: string;
    pickupConfirmedAt?: string;
    returnedAt?: string;
    isPaid: boolean;
    createdAt: string;
}

export interface PaginatedRentals {
    success: boolean;
    data: Rental[];
    pagination: { page: number; size: number; total: number; totalPages: number };
}