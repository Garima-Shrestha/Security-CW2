export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#131313] px-6 py-16">
            <div className="max-w-3xl mx-auto space-y-8 text-[#c3c5d9]">
                <header className="space-y-2">
                    <h1 className="text-3xl font-semibold text-white">Terms & Conditions</h1>
                    <p className="text-sm text-[#a0a3b5]">Last updated: July 12, 2026</p>
                </header>

                <main className="space-y-8">
                    <section className="space-y-3">
                        <h2 className="text-xl font-medium text-[#e5e2e1]">1. Acceptance of Terms</h2>
                        <p className="leading-relaxed">By creating an account on Shutter, you agree to be bound by these Terms & Conditions. If you do not agree, please do not register or use this service.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-medium text-[#e5e2e1]">2. Rental Agreement</h2>
                        <p className="leading-relaxed">All equipment rented through Shutter remains the property of Shutter. Renters are responsible for the equipment during the rental period, including safe transport, storage, and timely return.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-medium text-[#e5e2e1]">3. Deposits and Deductions</h2>
                        <p className="leading-relaxed">A refundable deposit is collected at the time of booking. Deductions may be made from the deposit for damage, loss, or late return, as determined by Shutter staff during equipment inspection upon return.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-medium text-[#e5e2e1]">4. Cancellations</h2>
                        <p className="leading-relaxed">Rentals may be cancelled prior to payment confirmation. Once a rental is confirmed and paid, cancellation is subject to Shutter's discretion and may not be eligible for a full refund.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-medium text-[#e5e2e1]">5. Account Responsibility</h2>
                        <p className="leading-relaxed">You are responsible for maintaining the confidentiality of your account credentials, including your password and any multi-factor authentication methods. Notify us immediately of any unauthorized use of your account.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-medium text-[#e5e2e1]">6. Limitation of Liability</h2>
                        <p className="leading-relaxed">Shutter is not liable for indirect, incidental, or consequential damages arising from the use or inability to use rented equipment.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-medium text-[#e5e2e1]">7. Changes to Terms</h2>
                        <p className="leading-relaxed">Shutter reserves the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the revised terms.</p>
                    </section>
                </main>
            </div>
        </div>
    );
}