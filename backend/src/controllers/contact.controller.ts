import { Request, Response } from "express";
import z from "zod";
import { ContactMessageDto } from "../dtos/contact.dto";
import { sanitizeRichText, sanitizeText } from "../utils/sanitize";
import { sendEmail } from "../config/email";
import { ADMIN_ALERT_EMAIL } from "../config";
import { logActivity } from "../config/logger";

export class ContactController {
    async sendMessage(req: Request, res: Response) {
        try {
            const parsed = ContactMessageDto.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }

            const user = req.user;
            if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

            const cleanSubject = sanitizeText(parsed.data.subject);
            const cleanMessage = sanitizeRichText(parsed.data.message);

            const html = `
                <p><strong>From:</strong> ${user.username} (${user.email})</p>
                <p><strong>User ID:</strong> ${user._id.toString()}</p>
                <p><strong>Subject:</strong> ${cleanSubject}</p>
                <p><strong>Message:</strong></p>
                <p>${cleanMessage}</p>
            `;

            if (ADMIN_ALERT_EMAIL) {
                await sendEmail(ADMIN_ALERT_EMAIL, `[Shutter Support] ${cleanSubject}`, html);
            }

            logActivity("CONTACT_MESSAGE_SENT", { userId: user._id.toString(), subject: cleanSubject });

            return res.status(200).json({ success: true, message: "Your message has been sent. Our team will respond to you by email within 1-2 business days." });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }
}