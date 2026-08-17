// Docs.js — Developer Documentation — APIs, Smart Contracts, Verification, SDK
// Clean. Direct. Institutional. Developer-first.

export function renderDocs() {
    return `
        <style>
            /* ============================================================
               DOCUMENTATION — DEVELOPER SUITE
               ============================================================ */
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600;700;800&display=swap');

            .doc {
                background: #FAF4E6;
                min-height: calc(100vh - 72px);
                font-family: 'Inter', sans-serif;
                color: #111111;
            }

            .doc-container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 0 48px;
            }

            /* ── Hero Header ── */
            .doc-top {
                background: linear-gradient(135deg, #3B0001 0%, #4A0000 40%, #2A0001 100%);
                position: relative;
                overflow: hidden;
            }
            .doc-top::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -20%;
                width: 500px;
                height: 500px;
                background: radial-gradient(circle, rgba(255, 255, 255, 0.04) 0%, transparent 70%);
                pointer-events: none;
            }
            .doc-page-hdr {
                padding: 48px 0 40px;
                position: relative;
                z-index: 1;
            }
            .doc-page-title {
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -1px;
                color: #FFFFFF;
                margin: 0;
                line-height: 1.1;
            }
            .doc-page-sub {
                font-size: 11px;
                color: rgba(255, 255, 255, 0.7);
                margin: 12px 0 0;
                font-family: 'JetBrains Mono', monospace;
                font-weight: 500;
                letter-spacing: 2px;
                text-transform: uppercase;
            }

            /* ── Layout ── */
            .doc-layout {
                display: grid;
                grid-template-columns: 240px 1fr;
                gap: 56px;
                padding: 40px 0 80px;
            }

            /* ── Sidebar ── */
            .doc-sidebar {
                position: sticky;
                top: 88px;
                align-self: start;
                max-height: calc(100vh - 100px);
                overflow-y: auto;
            }
            .doc-sidebar::-webkit-scrollbar { width: 3px; }
            .doc-sidebar::-webkit-scrollbar-track { background: transparent; }
            .doc-sidebar::-webkit-scrollbar-thumb { background: rgba(70,55,35,.22); border-radius: 3px; }

            .doc-nav-group {
                margin-bottom: 28px;
            }
            .doc-nav-label {
                font-family: 'JetBrains Mono', monospace;
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: #5C1414;
                margin: 0 0 10px;
            }
            .doc-nav-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .doc-nav-link {
                display: block;
                font-size: 13px;
                color: #666666;
                text-decoration: none;
                padding: 6px 0 6px 14px;
                border-left: 2px solid rgba(70,55,35,.22);
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                font-weight: 500;
            }
            .doc-nav-link:hover {
                color: #111;
                border-left-color: rgba(92, 20, 20, 0.4);
                background: rgba(92, 20, 20, 0.02);
            }
            .doc-nav-link.active {
                color: #5C1414;
                font-weight: 600;
                border-left-color: #5C1414;
                background: rgba(92, 20, 20, 0.04);
            }

            /* ── Content ── */
            .doc-content {
                min-width: 0;
            }

            .doc-section {
                margin-bottom: 48px;
                padding-bottom: 48px;
                border-bottom: 1px solid rgba(70,55,35,.22);
            }
            .doc-section:last-child {
                border-bottom: none;
                margin-bottom: 0;
            }

            .doc-section-title {
                font-size: 22px;
                font-weight: 800;
                color: #111111;
                margin: 0 0 20px;
                letter-spacing: -0.5px;
                line-height: 1.2;
                position: relative;
                padding-left: 18px;
            }
            .doc-section-title::before {
                content: '';
                position: absolute;
                left: 0;
                top: 4px;
                bottom: 4px;
                width: 4px;
                background: #5C1414;
                border-radius: 2px;
            }

            .doc-section-title-sm {
                font-size: 14px;
                font-weight: 700;
                color: #111111;
                margin: 24px 0 10px;
                letter-spacing: -0.3px;
            }

            .doc-p {
                font-size: 14px;
                color: #444444;
                line-height: 1.7;
                margin: 0 0 16px;
            }

            .doc-list {
                list-style: none;
                padding: 0;
                margin: 0 0 16px;
            }
            .doc-list li {
                font-size: 14px;
                color: #444444;
                line-height: 1.8;
                padding-left: 20px;
                position: relative;
            }
            .doc-list li::before {
                content: '';
                position: absolute;
                left: 4px;
                top: 10px;
                width: 4px;
                height: 4px;
                background: #5C1414;
                border-radius: 50%;
            }

            .doc-code-block {
                background: #F5EDDA;
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                font-family: 'JetBrains Mono', monospace;
                font-size: 12px;
                padding: 16px 20px;
                margin: 18px 0;
                overflow-x: auto;
                color: #333;
                border-left: 3px solid #5C1414;
            }

            .doc-table {
                width: 100%;
                border-collapse: collapse;
                margin: 18px 0;
                font-size: 13px;
            }
            .doc-table th {
                background: #FAF4E6;
                text-align: left;
                padding: 10px 12px;
                font-family: 'JetBrains Mono', monospace;
                font-weight: 700;
                font-size: 10px;
                letter-spacing: 0.5px;
                border-bottom: 2px solid rgba(70,55,35,.22);
                color: #666;
            }
            .doc-table td {
                padding: 12px;
                border-bottom: 1px solid rgba(70,55,35,.22);
                color: #333;
            }

            /* ── Responsive ── */
            @media (max-width: 900px) {
                .doc-container { padding: 0 24px; }
                .doc-layout {
                    grid-template-columns: 1fr;
                    gap: 0;
                }
                .doc-sidebar {
                    position: relative;
                    top: 0;
                    border-bottom: 1px solid rgba(70,55,35,.22);
                    padding-bottom: 20px;
                    margin-bottom: 32px;
                    max-height: none;
                }
                .doc-page-hdr { padding: 32px 0 28px; }
            }
        </style>

        <div class="doc">
            <div class="doc-top">
                <div class="doc-page-hdr">
                    <div class="doc-container">
                        <h1 class="doc-page-title">Developer Hub</h1>
                        <p class="doc-page-sub">API references. Deployed contracts. Integration guides.</p>
                    </div>
                </div>
            </div>

            <div class="doc-container">
                <div class="doc-layout">
                    <!-- Sidebar -->
                    <nav class="doc-sidebar" id="doc-sidebar">
                        <div class="doc-nav-group">
                            <div class="doc-nav-label">APIs</div>
                            <ul class="doc-nav-list">
                                <li class="doc-nav-item"><a href="#api-endpoints" class="doc-nav-link active" data-section="api-endpoints">REST Endpoints</a></li>
                                <li class="doc-nav-item"><a href="#api-auth" class="doc-nav-link" data-section="api-auth">Authentication</a></li>
                            </ul>
                        </div>
                        <div class="doc-nav-group">
                            <div class="doc-nav-label">Smart Contracts</div>
                            <ul class="doc-nav-list">
                                <li class="doc-nav-item"><a href="#contract-addresses" class="doc-nav-link" data-section="contract-addresses">Contract Directory</a></li>
                                <li class="doc-nav-item"><a href="#contract-network" class="doc-nav-link" data-section="contract-network">Chain Config</a></li>
                            </ul>
                        </div>
                        <div class="doc-nav-group">
                            <div class="doc-nav-label">Verification</div>
                            <ul class="doc-nav-list">
                                <li class="doc-nav-item"><a href="#verification-system" class="doc-nav-link" data-section="verification-system">Verification Engine</a></li>
                                <li class="doc-nav-item"><a href="#verification-antigaming" class="doc-nav-link" data-section="verification-antigaming">Anti-Gaming Checks</a></li>
                            </ul>
                        </div>
                        <div class="doc-nav-group">
                            <div class="doc-nav-label">SDK</div>
                            <ul class="doc-nav-list">
                                <li class="doc-nav-item"><a href="#sdk-setup" class="doc-nav-link" data-section="sdk-setup">SDK Setup</a></li>
                                <li class="doc-nav-item"><a href="#sdk-usage" class="doc-nav-link" data-section="sdk-usage">Client Verification</a></li>
                            </ul>
                        </div>
                    </nav>

                    <!-- Content -->
                    <div class="doc-content">

                        <!-- REST Endpoints -->
                        <section class="doc-section" data-reveal id="api-endpoints">
                            <h2 class="doc-section-title">REST Endpoints</h2>
                            <p class="doc-p">Collateral exposes REST endpoints to manage and monitor commitments programmatically.</p>
                            
                            <h3 class="doc-section-title-sm">Create New Commitment</h3>
                            <p class="doc-p">Initializes a new proof of execution escrow agreement.</p>
                            <div class="doc-code-block">
POST /v1/contracts
Content-Type: application/json
Authorization: Bearer &lt;auth_token&gt;

{
  "targetMetric": 1500,
  "deadline": "2026-08-31T23:59:59Z",
  "provider": "github",
  "moneyAtRisk": "1000.00"
}
                            </div>
                            
                            <h3 class="doc-section-title-sm">Get Commitment Details</h3>
                            <p class="doc-p">Fetches the current status, locked balances, and verification metadata of a commitment.</p>
                            <div class="doc-code-block">
GET /v1/contracts/:id
Authorization: Bearer &lt;auth_token&gt;
                            </div>
                        </section>

                        <!-- Authentication -->
                        <section class="doc-section" data-reveal id="api-auth">
                            <h2 class="doc-section-title">Authentication</h2>
                            <p class="doc-p">All client API endpoints require Bearer Token authorization. Secure your developer keys inside your environment variables. Never expose them to public client-side applications.</p>
                            <div class="doc-code-block">
Authorization: Bearer col_live_79a2bd8f8d9b1c72...
                            </div>
                        </section>

                        <!-- Deployed Contracts -->
                        <section class="doc-section" data-reveal id="contract-addresses">
                            <h2 class="doc-section-title">Contract Directory</h2>
                            <p class="doc-p">The active smart contract system deployed to the Robinhood Chain mainnet.</p>
                            
                            <table class="doc-table">
                                <thead>
                                    <tr>
                                        <th>Contract Name</th>
                                        <th>Mainnet Address</th>
                                        <th>Registry ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>CLTR Token</td>
                                        <td><code>0x7b69C7E57d7004EB2374E5Aabb9db5334aE73B9f</code></td>
                                        <td>cltr.core.token</td>
                                    </tr>
                                    <tr>
                                        <td>Commitment Staking</td>
                                        <td><code>0x6A95484e05dD7139C7A4De192dd2f26A2a91F69e</code></td>
                                        <td>cltr.core.staking</td>
                                    </tr>
                                    <tr>
                                        <td>Founder Vesting</td>
                                        <td><code>0xc416547c5a9dE39A5E489d04a3dfa1C043E8f026</code></td>
                                        <td>cltr.vesting.founder</td>
                                    </tr>
                                    <tr>
                                        <td>Team Vesting</td>
                                        <td><code>10 Multi-sig contracts</code></td>
                                        <td>cltr.vesting.team</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        <!-- Chain Config -->
                        <section class="doc-section" data-reveal id="contract-network">
                            <h2 class="doc-section-title">Chain Config</h2>
                            <p class="doc-p">Add these mainnet configuration parameters to your RPC provider or wallet interface:</p>
                            <div class="doc-code-block">
Chain Name: Robinhood Chain
Chain ID: 4663
RPC URL: https://rpc.mainnet.chain.robinhood.com
Symbol: ETH
Explorer: https://explorer.mainnet.chain.robinhood.com
                            </div>
                        </section>

                        <!-- Verification Engine -->
                        <section class="doc-section" data-reveal id="verification-system">
                            <h2 class="doc-section-title">Verification Engine</h2>
                            <p class="doc-p">The protocol performs deterministic checking via official provider REST and Webhook gateways. The following platforms are integrated natively:</p>
                            <ul class="doc-list">
                                <li><strong>GitHub</strong>: Watches commits, branches, pull requests, and releases.</li>
                                <li><strong>Stripe</strong>: Tracks transaction volumes, subscriber counts, and invoice completions.</li>
                                <li><strong>Shopify</strong>: Monitors order counts, delivery timestamps, and SKU fulfillment.</li>
                                <li><strong>YouTube</strong>: Counts public video uploads and follower deltas.</li>
                            </ul>
                        </section>

                        <!-- Anti-Gaming Rules -->
                        <section class="doc-section" data-reveal id="verification-antigaming">
                            <h2 class="doc-section-title">Anti-Gaming Checks</h2>
                            <p class="doc-p">To guarantee reputation integrity, all verification adapters run the following checks before validating outcomes:</p>
                            <ul class="doc-list">
                                <li><strong>Immutable Baselines</strong>: Captures metric states at lock time, ignoring historical manipulation.</li>
                                <li><strong>Fulfillment Filters</strong>: Automatically filters self-minting, bot loops, or simulated API payloads.</li>
                                <li><strong>Outage Retries</strong>: Indeterminate states undergo 5 automated retries before routing to the Dispute Jury.</li>
                            </ul>
                        </section>

                        <!-- SDK Setup -->
                        <section class="doc-section" data-reveal id="sdk-setup">
                            <h2 class="doc-section-title">SDK Setup</h2>
                            <p class="doc-p">Install the Collateral Node.js client to verify user milestones directly inside your server-side processes.</p>
                            <div class="doc-code-block">
npm install @collateral/sdk
                            </div>
                        </section>

                        <!-- SDK Client Verification -->
                        <section class="doc-section" data-reveal id="sdk-usage">
                            <h2 class="doc-section-title">Client Verification</h2>
                            <p class="doc-p">Initialize the SDK client and fetch verified Execution Credit status of any linked identity:</p>
                            <div class="doc-code-block">
import { CollateralClient } from '@collateral/sdk';

const client = new CollateralClient({
  apiKey: process.env.COLLATERAL_API_KEY
});

// Fetch Execution Credit
const profile = await client.getProfile('0x4A8...9B2');
console.log('Execution Credit Score:', profile.executionCredit);
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    `;
}

export function initDocs() {
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Sidebar scroll-spy
    const sidebar = document.getElementById('doc-sidebar');
    if (!sidebar) return;

    const links = sidebar.querySelectorAll('.doc-nav-link');
    const sections = [];

    links.forEach(link => {
        const sectionId = link.getAttribute('data-section');
        const section = document.getElementById(sectionId);
        if (section) sections.push({ link, section });
    });

    // Click handler — smooth scroll + active state
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            const target = document.getElementById(sectionId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                links.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // Scroll spy
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                links.forEach(l => {
                    l.classList.toggle('active', l.getAttribute('data-section') === id);
                });
            }
        });
    }, {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
    });

    sections.forEach(({ section }) => observer.observe(section));
}
