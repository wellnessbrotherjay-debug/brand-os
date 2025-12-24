'use client';

import MainLayout from '@/components/MainLayout';

export default function TermsPage() {
    return (
        <MainLayout title="Terms of Service" subtitle="HotelFit Brand OS">
            <div className="mx-auto max-w-4xl px-6 py-10 text-slate-300">
                <div className="prose prose-invert max-w-none">
                    <h1>HotelFit Brand OS – Terms of Service</h1>
                    <p className="text-sm text-slate-400">Last updated: 2025-12-15</p>

                    <p>
                        These Terms of Service (“Terms”) govern your use of HotelFit Brand OS (“Service”), operated by solutions.xyz (“we”, “us”, “our”). By accessing or using the Service, you agree to be bound by these Terms.
                        If you do not agree with these Terms, do not use the Service.
                    </p>

                    <h3>1. Use of the Service</h3>
                    <ul>
                        <li>You must be at least 18 years old to use the Service.</li>
                        <li>You are responsible for the content, campaigns, and settings you create using the Service.</li>
                        <li>You must comply with all applicable laws, as well as Meta’s advertising policies, when running campaigns via our platform.</li>
                    </ul>

                    <h3>2. Meta & Third-Party Platforms</h3>
                    <p>Our Service connects to third-party platforms such as Facebook and Instagram via their APIs.</p>
                    <ul>
                        <li>You remain bound by those platforms’ own terms, policies, and community standards.</li>
                        <li>We are not responsible for decisions made by Meta or other platforms (ad rejections, account bans, etc.).</li>
                        <li>You authorize us to act on your behalf only to the extent needed to create and manage campaigns or analytics within the Service.</li>
                    </ul>

                    <h3>3. Accounts & Security</h3>
                    <ul>
                        <li>You are responsible for maintaining the confidentiality of any login credentials to HotelFit Brand OS.</li>
                        <li>You must notify us immediately if you suspect unauthorized access to your account.</li>
                        <li>We may suspend or terminate access if we detect abuse, security issues, or violation of these Terms.</li>
                    </ul>

                    <h3>4. Fees & Payments</h3>
                    <p>If we offer paid plans:</p>
                    <ul>
                        <li>Pricing, billing cycles, and payment methods will be described within the Service or in a separate agreement.</li>
                        <li>Unless stated otherwise, fees are non-refundable once services are delivered for the billing period.</li>
                    </ul>

                    <h3>5. Intellectual Property</h3>
                    <ul>
                        <li>All software, features, and content within HotelFit Brand OS remain our property or the property of our licensors.</li>
                        <li>You retain ownership of your brand assets, creatives, and campaign content you upload.</li>
                        <li>You grant us a limited license to use those assets only to provide the Service (e.g. store them, send them to Meta for ads, show them in your dashboard).</li>
                    </ul>

                    <h3>6. Disclaimer of Warranties</h3>
                    <p>The Service is provided on an “as is” and “as available” basis. We do not guarantee:</p>
                    <ul>
                        <li>specific results or performance from advertising campaigns;</li>
                        <li>uninterrupted or error-free operation of the Service;</li>
                        <li>compatibility with every browser, device, or third-party platform.</li>
                    </ul>

                    <h3>7. Limitation of Liability</h3>
                    <p>To the maximum extent permitted by law:</p>
                    <ul>
                        <li>We are not liable for any indirect, incidental, or consequential damages, including loss of profits or data, arising from your use of the Service.</li>
                        <li>Our total liability for any claim relating to the Service will not exceed the amount paid by you to us in the previous three (3) months, if any.</li>
                    </ul>

                    <h3>8. Termination</h3>
                    <p>You may stop using the Service at any time. We may suspend or terminate your access if:</p>
                    <ul>
                        <li>you violate these Terms;</li>
                        <li>you misuse Meta APIs or other connected platforms;</li>
                        <li>your use creates risk or legal exposure for us.</li>
                    </ul>
                    <p>Upon termination, your right to access the Service will cease, and we will handle your data as described in our Privacy Policy.</p>

                    <h3>9. Changes to These Terms</h3>
                    <p>We may update these Terms from time to time. When we do, we will update the “Last updated” date. Continued use of the Service after changes become effective means you agree to the revised Terms.</p>

                    <h3>10. Contact</h3>
                    <p>For questions about these Terms, contact:</p>
                    <p>
                        HotelFit Brand OS – Legal / Terms<br />
                        Email: wellnessbrotherjay@gmail.com
                    </p>
                </div>
            </div>
        </MainLayout>
    );
}
