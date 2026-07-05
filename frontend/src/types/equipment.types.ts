export interface EquipmentCategory {
    _id: string;
    name: string;
    description?: string;
}

export interface Equipment {
    _id: string;
    title: string;
    description: string;
    category: EquipmentCategory;
    brand: string;
    model: string;
    condition: "new" | "excellent" | "good" | "fair";
    dailyRate: number;
    depositAmount: number;
    specs?: Record<string, string>;
    images: string[];
    isActive: boolean;
}

export interface PaginatedEquipment {
    success: boolean;
    data: Equipment[];
    pagination: { page: number; size: number; total: number; totalPages: number };
}