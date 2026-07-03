import mongoose from "mongoose";
import { MONGODB_URI } from "../config";

export const connectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log(`MongoDB connected: ${MONGODB_URI}`);
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};

// Use a separate database for Jest tests.
export const connectDatabaseTest = async (): Promise<void> => {
    const testUri = process.env.MONGODB_URI_TEST || "mongodb://127.0.0.1:27017/lensrental_test";
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(testUri);
    }
};