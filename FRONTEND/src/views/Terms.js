// Terms of Service — Collateral Protocol
// Route: /terms

export function renderTerms() {
    return `
        <style>
            .legal-page {
                background: #F5EDDA;
                min-height: 100vh;
                font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #111;
                padding: 80px 32px 120px;
            }
            .legal-inner {
                max-width: 720px;
                margin: 0 auto;
            }
            .legal-tag {
                font-family: 'JetBrains Mono', monospace;
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: #752122;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .legal-tag::before {
                content: '';
                width: 24px;
                height: 1px;
                background: #752122;
            }
            .legal-title {
                font-size: 32px;
                font-weight: 700;
                letter-spacing: -1.5px;
                margin-bottom: 12px;
                line-height: 1.1;
            }
            .legal-updated {
                font-size: 12px;
                color: #999;
                font-family: 'JetBrains Mono', monospace;
                margin-bottom: 48px;
            }
            .legal-section {
                margin-bottom: 36px;
            }
            .legal-section h2 {
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 12px;
                color: #111;
            }
            .legal-section p, .legal-section li {
                font-size: 14px;
                line-height: 1.8;
                color: #555;
                margin-bottom: 8px;
            }
            .legal-section ul {
                padding-left: 24px;
                margin-bottom: 12px;
            }
            .legal-section ul li {
                list-style: disc;
                margin-bottom: 4px;
            }
            .legal-divider {
                width: 40px;
                height: 1px;
                background: rgba(70,55,35,.22);
                margin: 32px 0;
            }
            @media (max-width: 768px) {
                .legal-page { padding: 40px 20px 80px; }
                .legal-title { font-size: 22px; }
            }
        </style>

        <div class="legal-page">
            <div class="legal-inner">
                <div class="legal-tag">Legal</div>
                <h1 class="legal-title">Terms of Service</h1>
                <p class="legal-updated">Last updated: March 1, 2026</p>

                <div class="legal-section">
                    <h2>1. Agreement to Terms</h2>
                    <p>By accessing or using Collateral.market ("Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
                    <p>The Service is operated by Collateral Protocol ("Company", "we", "us"). You must be at least 18 years old to use the Service.</p>
                </div>

                <div class="legal-divider"></div>

                <div class="legal-section" data-reveal>
                    <h2>2. Service Description</h2>
                    <p>Collateral is a performance contract protocol that enables users to lock capital against measurable business outcomes. The Service includes:</p>
                    <ul>
                        <li>Performance contract creation and execution</li>
                        <li>Capital locking and custodial management</li>
                        <li>Automated verification via platform adapters (Stripe, X, Shopify, Amazon)</li>
                        <li>Settlement and payout processing</li>
                    </ul>
                </div>

                <div class="legal-divider"></div>

                <div class="legal-section" data-reveal>
                    <h2>3. Capital Commitment</h2>
                    <p>When you execute a contract, you commit capital ("stake") which is held in escrow for the contract duration. Key terms:</p>
                    <ul>
                        <li><strong>Lock Period:</strong> Capital is locked from execution until settlement. Locked capital cannot be withdrawn.</li>
                        <li><strong>Settlement:</strong> If you meet the contract conditions, capital is returned plus any earned payout. If you fail, capital is forfeited.</li>
                        <li><strong>Verification:</strong> All outcomes are verified through read-only API integrations with the relevant platform.</li>
                    </ul>
                </div>

                <div class="legal-divider"></div>

                <div class="legal-section" data-reveal>
                    <h2>4. User Accounts</h2>
                    <p>You are responsible for maintaining the security of your account credentials. You agree to immediately notify us of any unauthorized use of your account.</p>
                    <p>Each user may hold a maximum number of active contracts as determined by anti-sybil controls. These limits exist to ensure platform integrity.</p>
                </div>

                <div class="legal-divider"></div>

                <div class="legal-section" data-reveal>
                    <h2>5. Connected Sources</h2>
                    <p>To verify contract outcomes, you grant the Service read-only access to your connected accounts (e.g., Stripe, X/Twitter, Shopify, Amazon). We only access the minimum data required for verification.</p>
                    <p>You may disconnect a source at any time, but doing so may result in inability to verify active contracts, leading to forfeiture.</p>
                </div>

                <div class="legal-divider"></div>

                <div class="legal-section" data-reveal>
                    <h2>6. Fees</h2>
                    <p>The Service charges fees on contract execution as displayed at the time of commitment. Fees are non-refundable and are deducted from the contract value.</p>
                </div>

                <div class="legal-divider"></div>

                <div class="legal-section" data-reveal>
                    <h2>7. Limitation of Liability</h2>
                    <p>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. We are not liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.</p>
                    <p>Our total liability is limited to the amount of capital you have committed through the Service in the preceding 12 months.</p>
                </div>

                <div class="legal-divider"></div>

                <div class="legal-section" data-reveal>
                    <h2>8. Modifications</h2>
                    <p>We reserve the right to modify these Terms at any time. Material changes will be communicated via the Service. Continued use after modification constitutes acceptance.</p>
                </div>

                <div class="legal-divider"></div>

                <div class="legal-section" data-reveal>
                    <h2>9. Contact</h2>
                    <p>Questions about these Terms should be directed to legal@collateral.market.</p>
                </div>
            </div>
        </div>
    `;
}

export function initTerms() {
    // Static page — no initialization needed
}
