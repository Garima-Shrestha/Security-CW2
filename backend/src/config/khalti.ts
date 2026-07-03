import dotenv from "dotenv";
dotenv.config();

export const KHALTI_BASE_URL: string =
  process.env.KHALTI_BASE_URL || "https://dev.khalti.com/api/v2";

export const KHALTI_SECRET_KEY: string =
  process.env.KHALTI_SECRET_KEY || "";

export const KHALTI_RETURN_URL: string =
  process.env.KHALTI_RETURN_URL || "";

export const KHALTI_WEBSITE_URL: string =
  process.env.KHALTI_WEBSITE_URL || "";