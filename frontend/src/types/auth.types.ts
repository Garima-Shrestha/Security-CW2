export interface User {
    _id: string;
    username: string;
    email: string;
    phone?: string;
    role: "admin" | "user";
    imageUrl?: string;
    authProvider: "local" | "google";
    isTotpEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LoginResponse {
    success: boolean;
    requiresTotp: boolean;
    token?: string;
    preAuthToken?: string;
    data?: User;
    message?: string;
}

export interface ApiError {
    success: false;
    message: string;
}

export interface AdminUserListItem {
    _id: string;
    username: string;
    email: string;
    phone?: string;
    role: "admin" | "user";
    authProvider: "local" | "google";
    isTotpEnabled: boolean;
    lockoutUntil?: string;
    createdAt: string;
}

export interface PaginatedUsers {
    success: boolean;
    data: AdminUserListItem[];
    pagination: { page: number; size: number; total: number; totalPages: number };
}