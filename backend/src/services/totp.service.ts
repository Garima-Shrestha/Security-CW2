import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { TOTP_ISSUER } from "../config";

export class TotpService {
    // Generate a TOTP secret for MFA setup.
    // Save it only after the user verifies the code.
    generateSecret(userEmail: string) {
        const secret = speakeasy.generateSecret({
            name: `${TOTP_ISSUER} (${userEmail})`,
            issuer: TOTP_ISSUER,
            length: 20,
        });
        return {
            base32: secret.base32,       // store this (encrypted) once confirmed
            otpauthUrl: secret.otpauth_url, // used to generate the QR code
        };
    }

    async generateQrCodeDataUrl(otpauthUrl: string): Promise<string> {
        return await qrcode.toDataURL(otpauthUrl);
    }

    // window: 1 allows the code from the previous/next 30s step, to tolerate minor clock drift
    verifyCode(secretBase32: string, code: string): boolean {
        return speakeasy.totp.verify({
            secret: secretBase32,
            encoding: "base32",
            token: code,
            window: 1,
        });
    }
}