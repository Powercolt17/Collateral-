// Privacy Policy — Collateral Protocol
// Route: /privacy

export function renderPrivacy() {
    return `
        <style>
            .legal-page {
                background: #F5EDDA;
                min-height: 100vh;
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #111;
                padding: 80px 32px 120px;
            }
            .legal-inner {
                max-width: 720px;
                margin: 0 auto;
            }
            .legal-tag {
                font-family: var(--font-data);
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
                font-family: var(--font-data);
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
                <h1 class="legal-title">Privacy Policy</h1>
                <p class="legal-updated">Last updated: March 1, 2026</p>

                <div class="legal-section" data-reveal>
                    <h2>1. Information We Collect</h2>
                    <p>We collect information necessary to operate the performance collateral protocol:</p>
                    <ul>
                        <li><strong>Account Information:</strong> Email address, username, and authentication credentials.</li>
                        <li><strong>Connected Source Data:</strong> Read-only metrics from connected platforms (Stripe revenue, X followers, Shopify orders, Amazon sales) — accessed only for contract verification.</li>
                        <li><strong>Contract Data:</strong> Stake amounts, contract terms, verification results, and settlement outcomes. All contract data is stored in an immutable append-only ledger.</li>
                        <li><strong>Payment Information:</strong> Payment methods are processed by Stripe. We do not store full card numbers.</li>
                    </ul>
                </div>

                <div class="legal-divider"></div>

                <div class="legal-section" data-reveal>
                    <h2>2. How We Use Information</h2>
                    <p>We use your information to:</p>
                    <ul>
                        <li>Execute and verify performance contracts</li>
                        <li>Process capital locks, settlements, and payouts</li>
                        <li>Maintain an immutable record of all contract events</li>
                        <li>Enforce anti-sybil and anti-gaming protections</li>
                        <li>Communicate contract-related events (execution, settlement, forfeiture)</li>
                    </ul>
                </div>

                <div class="legal-divider"></div>

                <div class="legal-section" data-reveal>
                    <h2>3. Connected Source Access</h2>
                    <p>When you connect a platform (Stripe, X, Shopify, Amazon), we request only read-only access to the specific metrics needed for verification:</p>
                    <ul>
                        <li><strong>Stripe:</strong> Revenue, charges, and balance data</li>
                        <li><strong>X/Twitter:</strong> Follower count and engagement metrics</li>
                        <li><strong>Shopify:</strong> Order volume and net sales</li>
                        <li><strong>Amazon:</strong> Revenue and units sold</li>
                    </ul>
                    <p>We never modify your connected accounts. We only read data at contract verification time.</p>
                </div>

                <div class="legal-divider"></div>

                <div class="legal-section" data-reveal>
                    <h2>4. Data Retention</h2>
                    <p>Contract events are stored permanently in an append-only ledger as the canonical source of truth. Account data is retained for the duration of your account plus any legal retention requirements.</p>
                    <p>Connected source tokens are stored encrypted and can be revoked by disconnecting the source.</p>
                </div>

                <div class="legal-divider"></div>

                <div class="legal-section" data-reveal>
                    <h2>5. Data Security</h2>
                    <p>We implement industry-standard security measures including:</p>
                    <ul>
                        <li>TLS encryption for all data in transit</li>
                        <li>Encrypted storage for sensitive credentials</li>
                        <li>Hash-chained ledger for tamper-evident record keeping</li>
                        <li>Rate limiting and anti-abuse protections</li>
                    </ul>
                </div>

                <div class="legal-divider"></div>

                <div class="legal-section" data-reveal>
                    <h2>6. Third-Party Services</h2>
                    <p>We use the following third-party services:</p>
                    <ul>
                        <li><strong>Stripe:</strong> Payment processing and payouts</li>
                        <li><strong>Clerk:</strong> Authentication and session management</li>
                        <li><strong>Railway:</strong> Application hosting</li>
                    </ul>
                    <p>Each service has its own privacy policy governing data they process.</p>
                </div>

                <div class="legal-divider"></div>

                <div class="legal-section" data-reveal>
                    <h2>7. Your Rights</h2>
                    <p>You may:</p>
                    <ul>
                        <li>Access your contract history and ledger events at any time</li>
                        <li>Disconnect platform sources</li>
                        <li>Export your contract data via CSV</li>
                        <li>Request account deletion (subject to active contract settlement)</li>
                    </ul>
                </div>

                <div class="legal-divider"></div>

                <div class="legal-section" data-reveal>
                    <h2>8. Contact</h2>
                    <p>For privacy-related inquiries, contact privacy@collateral.market.</p>
                </div>
            </div>
        </div>
    `;
}

export function initPrivacy() {
    // Static page — no initialization needed
}
