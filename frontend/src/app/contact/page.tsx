"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Mail} from "lucide-react";

const contactSchema = z.object({
    subject: z.string().min(3, "Subject is required").max(100),
    message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});
type ContactFormValues = z.infer<typeof contactSchema>;

function ContactContent() {
    const { user } = useAuth();
    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema) });

    async function onSubmit(values: ContactFormValues) {
        setServerError(null);
        setSuccess(null);
        setIsSubmitting(true);
        try {
            const res = await api.post("/api/contact", values);
            setSuccess(res.data.message);
            reset();
        } catch (err: any) {
            setServerError(err?.response?.data?.message || "Failed to send message");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#131313] flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md space-y-6">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold text-white">Contact Support</h1>
                </div>
                <p className="text-sm text-[#a0a3b5]">
                    Have a question about a rental, a damaged item, or your account? Send us a message and we'll get back to you.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                    <div>
                        <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Your Email</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3b5]" />
                            <input
                                value={user?.email || ""}
                                disabled
                                className="w-full bg-[#131313] border border-[#434656] text-[#a0a3b5] rounded-lg pl-9 pr-3 py-2.5 text-sm cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="contact-subject" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Subject</label>
                        <input
                            id="contact-subject"
                            {...register("subject")}
                            maxLength={100}
                            className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition"
                            placeholder="e.g. Damaged equipment on return"
                        />
                        {errors.subject && <p className="text-red-600 text-xs mt-1.5">{errors.subject.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="contact-message" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Message</label>
                        <textarea
                            id="contact-message"
                            {...register("message")}
                            maxLength={2000}
                            rows={5}
                            className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition"
                            placeholder="Describe your issue or question..."
                        />
                        {errors.message && <p className="text-red-600 text-xs mt-1.5">{errors.message.message}</p>}
                    </div>

                    {success && (
                        <div className="bg-[#29c063] text-[#fafafa] text-sm rounded-lg px-4 py-3">
                            {success}
                        </div>
                    )}
                    {serverError && (
                        <div className="bg-[#c42727] text-[#fafafa] text-sm rounded-lg px-4 py-3">
                            {serverError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-50"
                    >
                        {isSubmitting ? "Sending..." : "Send Message"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function ContactPage() {
    return (
        <ProtectedRoute>
            <ContactContent />
        </ProtectedRoute>
    );
}