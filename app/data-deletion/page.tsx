'use client';

import MainLayout from '@/components/MainLayout';

export default function DataDeletionPage() {
    return (
        <MainLayout title="Data Deletion" subtitle="HotelFit Brand OS">
            <div className="mx-auto max-w-4xl px-6 py-10 text-slate-300">
                <div className="prose prose-invert max-w-none">
                    <h1>HotelFit Brand OS – Data Deletion Instructions</h1>
                    <p className="text-sm text-slate-400">Last updated: 2025-12-15</p>

                    <p>
                        If you have used HotelFit Brand OS and would like your data to be deleted, please follow the steps below.
                    </p>

                    <h3>1. Disconnect Your Meta Accounts (Optional but Recommended)</h3>
                    <p>You can first revoke our access from your own Meta settings:</p>

                    <h4>Facebook:</h4>
                    <ul>
                        <li>Go to Settings & Privacy → Settings → Business Integrations / Apps and Websites.</li>
                        <li>Find HotelFit Brand OS (or our app name shown by Meta).</li>
                        <li>Click Remove to revoke access.</li>
                    </ul>

                    <h4>Instagram:</h4>
                    <ul>
                        <li>Go to Settings → Security → Apps and Websites.</li>
                        <li>Locate HotelFit Brand OS and remove access.</li>
                    </ul>
                    <p>This stops any future data sharing from Meta to our platform.</p>

                    <h3>2. Request Deletion from HotelFit Brand OS</h3>
                    <p>To remove data stored in our systems, please email:</p>
                    <div className="bg-white/5 p-4 rounded-lg my-4">
                        <p className="font-mono text-sm">Subject: Data Deletion Request – HotelFit Brand OS</p>
                        <p className="font-mono text-sm">To: wellnessbrotherjay@gmail.com</p>
                        <p className="mt-4 mb-2">Include in your message:</p>
                        <ul className="mb-0">
                            <li>Your full name</li>
                            <li>The email address you used with HotelFit Brand OS</li>
                            <li>Any Facebook Page / Instagram account / Ad account IDs connected (if known)</li>
                        </ul>
                    </div>

                    <p>Once we receive your request and verify your identity, we will:</p>
                    <ul>
                        <li>Delete or anonymize your personal data and connected Meta data from our databases; and</li>
                        <li>Confirm completion of the deletion via email.</li>
                    </ul>
                    <p>We aim to process all valid requests within 30 days, unless we are legally required to retain certain data for a longer period (for example, for accounting or legal record-keeping).</p>

                    <h3>3. Questions</h3>
                    <p>If you have any questions about how your data is handled or this deletion process, contact:</p>
                    <p>
                        HotelFit Brand OS – Data Protection<br />
                        Email: wellnessbrotherjay@gmail.com
                    </p>
                </div>
            </div>
        </MainLayout>
    );
}
