export interface User {
    _id: string;
    username: string;
    email: string;
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