import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 5050;
export const NODE_ENV: string = process.env.NODE_ENV || 'development';

export const MONGODB_URI: string = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lensrental';

// If JWT is missing, throw an error instead of falling back.
export const JWT_SECRET: string = NODE_ENV === 'production'
    ? required('JWT_SECRET')
    : (process.env.JWT_SECRET || 'dev_only_default_secret_change_me');

// Access tokens expire after 15 days.
export const JWT_EXPIRY: string = process.env.JWT_EXPIRY || '15d';

// Issue a temporary token until TOTP is verified.
export const PRE_AUTH_TOKEN_EXPIRY: string = process.env.PRE_AUTH_TOKEN_EXPIRY || '5m';

export const CLIENT_URL: string = process.env.CLIENT_URL || 'http://localhost:3000';

export const RESET_TOKEN_EXPIRY: string = process.env.RESET_TOKEN_EXPIRY || '15m';

// Block login after repeated failed attempts. Brute-force lockout policy after 10-15 attempts
export const MAX_FAILED_ATTEMPTS: number = process.env.MAX_FAILED_ATTEMPTS
    ? parseInt(process.env.MAX_FAILED_ATTEMPTS)
    : 10;
export const LOCKOUT_DURATION_MINUTES: number = process.env.LOCKOUT_DURATION_MINUTES
    ? parseInt(process.env.LOCKOUT_DURATION_MINUTES)
    : 15;

// Google OAuth
export const GOOGLE_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET: string = process.env.GOOGLE_CLIENT_SECRET || '';
export const GOOGLE_CALLBACK_URL: string = process.env.GOOGLE_CALLBACK_URL
    || 'http://localhost:5050/api/auth/google/callback';

// Session secret used for the OAuth flow.
export const SESSION_SECRET: string = NODE_ENV === 'production'
    ? required('SESSION_SECRET')
    : (process.env.SESSION_SECRET || 'dev_only_session_secret_change_me');

export const AES_SECRET_KEY: string = NODE_ENV === 'production'
    ? required('AES_SECRET_KEY')
    : (process.env.AES_SECRET_KEY || 'dev_only_aes_key_change_me');

// TOTP
export const TOTP_ISSUER: string = process.env.TOTP_ISSUER || 'LensRental';

// Password policy
export const PASSWORD_EXPIRY_DAYS: number = 90;
export const PASSWORD_HISTORY_LIMIT: number = 5;