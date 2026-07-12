export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#131313] px-6 py-16">
            <div className="max-w-3xl mx-auto space-y-8 text-[#c3c5d9]">
                <header className="space-y-2">
                    <h1 className="text-3xl font-semibold text-white">Privacy Policy</h1>
                    <p className="text-sm text-[#a0a3b5]">Last updated: July 12, 2026</p>
                </header>

                <main className="space-y-8">
                    <section className="space-y-3">
                        <h2 className="text-xl font-medium text-[#e5e2e1]">1. Information We Collect</h2>
                        <p className="leading-relaxed">We collect your username, email address, phone number, and rental history when you register and use Shutter. If you enable multi-factor authentication, we store an encrypted TOTP secret used only to verify login codes.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-medium text-[#e5e2e1]">2. How We Protect Your Data</h2>
                        <p className="leading-relaxed">Passwords are hashed using bcrypt and are never stored or transmitted in plain text. Sensitive fields such as TOTP secrets are encrypted at rest using AES-256-GCM. All traffic between your browser and our servers is encrypted via HTTPS.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-medium text-[#e5e2e1]">3. How We Use Your Data</h2>
                        <p className="leading-relaxed">Your data is used solely to operate your account, process rentals and payments, send security and rental-related notifications, and respond to support requests you submit through our contact form.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-medium text-[#e5e2e1]">4. Data Sharing</h2>
                        <p className="leading-relaxed">We do not sell or share your personal data with third parties, except as required to process payments (via Khalti) or where required by law.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-medium text-[#e5e2e1]">5. Your Rights</h2>
                        <p className="leading-relaxed">You may export a copy of your profile and rental history at any time from your Profile Settings page. You may also request account deletion by contacting our support team.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-medium text-[#e5e2e1]">6. Activity Logging</h2>
                        <p className="leading-relaxed">For security purposes, we log meaningful account activity such as login attempts, password changes, and MFA changes. These logs do not contain your password or other sensitive credentials.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-medium text-[#e5e2e1]">7. Contact</h2>
                        <p className="leading-relaxed">For any privacy-related questions or requests, please reach out via our Contact page.</p>
                    </section>
                </main>
            </div>
        </div>
    );
}