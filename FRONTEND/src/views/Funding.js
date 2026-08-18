// CAPITAL — Institutional Capital Control Terminal
// Redesigned from "Funding & Payouts" to match homepage contract grid aesthetic

export function renderFunding() {
    return `
        <style>
            /* ===================================================
               CAPITAL — PREMIUM INSTITUTIONAL TERMINAL
               Brand Red #5C1414 · Clean white · Sharp borders
               =================================================== */

            @keyframes capReveal {
                from { opacity: 0; transform: translateY(18px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .cap {
                background: #FAF4E6;
                min-height: calc(100vh - 72px);
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #111;
            }

            .cap-inner {
                max-width: 900px;
                margin: 0 auto;
                padding: 48px 28px 100px;
            }

            /* ── Page Header ── */
            .cap-hdr {
                margin-bottom: 40px;
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                gap: 16px;
                animation: capReveal 0.6s ease both;
            }
            .cap-hdr-title {
                font-size: 24px;
                font-weight: 800;
                letter-spacing: -1px;
                color: #111111;
                margin: 0 0 6px;
                position: relative;
                display: inline-block;
            }
            .cap-hdr-title::after {
                content: '';
                position: absolute;
                bottom: -2px;
                left: 0;
                width: 48px;
                height: 3px;
                background: #5C1414;
            }
            .cap-hdr-sub {
                font-size: 13px;
                color: #666;
                margin: 8px 0 0;
                font-family: var(--font-data);
                letter-spacing: 0.2px;
            }
            .cap-deposit-btn {
                padding: 12px 24px;
                background: #5C1414;
                color: #fff;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                border: none;
                cursor: pointer;
                transition: all 0.2s ease;
                font-family: var(--font-data);
                white-space: nowrap;
                flex-shrink: 0;
                position: relative;
                overflow: hidden;
            }
            .cap-deposit-btn:hover {
                background: #4A1010;
                transform: translateY(-1px);
                box-shadow: 0 4px 16px rgba(92, 20, 20, 0.25);
            }
            .cap-deposit-btn::after {
                content: '';
                position: absolute;
                top: -50%; left: -75%;
                width: 50%; height: 200%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
                transform: skewX(-25deg);
                transition: left 0.5s ease;
            }
            .cap-deposit-btn:hover::after { left: 125%; }

            /* ── Restriction Banner ── */
            .cap-alert {
                display: none;
                background: rgba(92, 20, 20, 0.04);
                border: 1px solid rgba(92, 20, 20, 0.2);
                border-left: 3px solid #5C1414;
                padding: 14px 18px;
                margin-bottom: 24px;
                font-family: var(--font-data);
                font-size: 11px;
                color: #5C1414;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border-radius: 4px;
            }
            .cap-alert.visible { display: block; }

            /* ── Unconfigured Payout Warning ── */
            .cap-warning-banner {
                display: none;
                align-items: center;
                justify-content: space-between;
                background: rgba(92, 20, 20, 0.03);
                border: 1px solid rgba(92, 20, 20, 0.15);
                padding: 12px 20px;
                margin-bottom: 24px;
                gap: 16px;
                flex-wrap: wrap;
            }
            .cap-warning-banner.visible {
                display: flex;
            }
            .cap-warning-link {
                font-family: var(--font-data);
                font-size: 11px;
                font-weight: 700;
                color: #5C1414;
                background: none;
                border: none;
                cursor: pointer;
                text-decoration: underline;
                padding: 4px 0;
            }
            .cap-warning-link:hover {
                color: #4A1010;
            }
            .cap-warning-close {
                background: none;
                border: none;
                cursor: pointer;
                color: #999;
                font-size: 14px;
                padding: 4px;
                transition: color 0.15s;
            }
            .cap-warning-close:hover {
                color: #5C1414;
            }

            /* ── Overview Strip ── */
            .cap-overview {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                border: 1px solid rgba(70,55,35,.22);
                background: #F5EDDA;
                margin-bottom: 28px;
                border-radius: 4px;
                overflow: hidden;
                animation: capReveal 0.6s ease 0.1s both;
            }
            .cap-stat {
                padding: 28px 24px;
                border-right: 1px solid rgba(70,55,35,.22);
                display: flex;
                flex-direction: column;
                gap: 8px;
                position: relative;
                transition: background 0.2s ease;
            }
            .cap-stat:last-child { border-right: none; }
            .cap-stat:hover { background: #FAF4E6; }
            .cap-stat::before {
                content: '';
                position: absolute;
                top: 0; left: 0;
                width: 0; height: 3px;
                background: #5C1414;
                transition: width 0.35s ease;
            }
            .cap-stat:hover::before { width: 100%; }
            .cap-stat-lbl {
                font-family: var(--font-data);
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: #5C1414;
                transition: color 0.2s ease;
            }
            .cap-stat-val {
                font-family: var(--font-content), sans-serif;
                font-size: 22px;
                font-weight: 800;
                color: #111111;
                letter-spacing: -1px;
                line-height: 1;
                transition: color 0.2s ease;
            }
            .cap-stat:hover .cap-stat-val { color: #5C1414; }
            .cap-stat-sub {
                font-size: 12px;
                color: #888;
                line-height: 1.4;
                transition: color 0.2s ease;
            }

            /* ── De-emphasized zero stat cards ── */
            .cap-stat.zero .cap-stat-lbl {
                color: #8a8984;
            }
            .cap-stat.zero .cap-stat-val {
                color: #8a8984;
            }
            .cap-stat.zero .cap-stat-sub {
                color: #b3b2ad;
            }
            .cap-stat.zero:hover .cap-stat-val {
                color: #8a8984;
            }

            /* ── Section Container ── */
            .cap-section {
                background: #F5EDDA;
                border: 1px solid rgba(70,55,35,.22);
                border-left: 3px solid #5C1414; /* Accent bar spans full merged card */
                margin-bottom: 20px;
                border-radius: 0; /* Set border-radius to 0 */
                overflow: hidden;
                transition: border-color 0.2s, box-shadow 0.2s;
                animation: capReveal 0.6s ease 0.2s both;
            }
            .cap-section:hover {
                border-color: rgba(92, 20, 20, 0.2);
                box-shadow: 0 4px 16px rgba(92, 20, 20, 0.04);
            }
            .cap-section-hdr {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 22px;
                border-bottom: 1px solid #f0f0f0;
            }
            .cap-section-title {
                font-family: var(--font-data);
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: #5C1414;
            }
            .cap-add-btn {
                font-family: var(--font-data);
                font-size: 10px;
                font-weight: 700;
                color: #888;
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px 8px;
                transition: color 0.15s;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .cap-add-btn:hover {
                color: #5C1414;
            }

            /* ── Source/Destination Row ── */
            .cap-row {
                display: flex;
                align-items: center;
                gap: 16px;
                height: 52px;
                padding: 0 22px;
                border-bottom: 1px solid #f4f4f4;
                transition: background 0.15s;
            }
            .cap-row:last-child { border-bottom: none; }
            .cap-row:hover {
                background: rgba(92, 20, 20, 0.015);
            }
            .cap-row-icon {
                width: 18px;
                height: 18px;
                color: #888;
                flex-shrink: 0;
            }
            .cap-row-text-group {
                display: flex;
                align-items: center;
                gap: 16px;
                flex: 1;
            }
            .cap-row-identifier {
                font-family: var(--font-data);
                font-size: 13px;
                color: #111;
                font-weight: 500;
            }
            .cap-row-detail {
                font-family: var(--font-data);
                font-size: 12px;
                color: #888;
            }
            .cap-row-badge-wrap {
                display: inline-flex;
            }
            .cap-action-btn {
                font-family: var(--font-data);
                font-size: 11px;
                font-weight: 700;
                color: #888;
                background: none;
                border: none;
                cursor: pointer;
                padding: 6px 0;
                transition: color 0.15s;
                margin-left: auto;
                text-decoration: none;
            }
            .cap-action-btn:hover {
                color: #5C1414;
            }

            /* ── Status Badges ── */
            .cap-badge {
                display: inline-flex;
                align-items: center;
                padding: 3px 8px;
                font-family: var(--font-data);
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border-radius: 3px;
            }
            .cap-badge.verified {
                background: rgba(92, 20, 20, 0.06);
                color: #5C1414;
                border: 1px solid rgba(92, 20, 20, 0.2);
            }
            .cap-badge.required {
                background: rgba(92, 20, 20, 0.04);
                color: #5C1414;
                border: 1px solid rgba(92, 20, 20, 0.15);
            }
            .cap-badge.pending-badge {
                background: rgba(92, 20, 20, 0.04);
                color: #5C1414;
                border: 1px solid rgba(92, 20, 20, 0.15);
            }

            /* ── Caption Text ── */
            .cap-caption-text {
                font-family: var(--font-data);
                font-size: 10px;
                color: #888;
                margin-top: 8px;
                padding-left: 4px;
            }

            /* ── Footer (Bloomberg-style) ── */
            .cap-footer {
                margin-top: 48px;
                padding-top: 24px;
                border-top: 1px solid #e8e8e8;
                display: flex;
                gap: 40px;
                animation: capReveal 0.6s ease 0.3s both;
            }
            .cap-footer-item {
                display: flex;
                flex-direction: column;
                gap: 3px;
            }
            .cap-footer-lbl {
                font-family: var(--font-data);
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: #bbb;
            }
            .cap-footer-val {
                font-family: var(--font-data);
                font-size: 10px;
                color: #666;
            }
            .cap-footer-dot {
                display: inline-block;
                width: 6px;
                height: 6px;
                background: #5C1414;
                border-radius: 50%;
                margin-right: 5px;
                vertical-align: middle;
                animation: dotPulseCap 2s ease-in-out infinite;
            }
            @keyframes dotPulseCap {
                0%, 100% { box-shadow: 0 0 0 0 rgba(92, 20, 20, 0.4); }
                50% { box-shadow: 0 0 0 4px rgba(92, 20, 20, 0); }
            }

            @media (max-width: 640px) {
                .cap-overview { grid-template-columns: 1fr; }
                .cap-stat { border-right: none; border-bottom: 1px solid rgba(70,55,35,.22); }
                .cap-stat:last-child { border-bottom: none; }
                .cap-hdr { flex-direction: column; align-items: flex-start; }
                .cap-footer { flex-wrap: wrap; gap: 20px; }
                .cap-hdr-title { font-size: 26px; }
                .cap-deposit-btn { width: 100%; text-align: center; }
                
                .cap-row {
                    height: auto;
                    padding: 14px 22px;
                    align-items: flex-start;
                }
                .cap-row-icon {
                    margin-top: 2px;
                }
                .cap-row-text-group {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 4px;
                }
                .cap-action-btn {
                    margin-top: -2px;
                }
            }
            @media (max-width: 480px) {
                .cap-inner { padding: 24px 16px 80px; }
                .cap-stat { padding: 20px 16px; }
                .cap-stat-val { font-size: 22px; }
                .cap-hdr-title { font-size: 22px; }
                .cap-row { padding: 16px; }
                .cap-section-hdr { padding: 14px 16px; }
                .cap-footer { gap: 16px; }
            }

            /* ===================================================
               MODAL SYSTEM — Premium dialogs
               =================================================== */
            .cap-modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.45);
                backdrop-filter: blur(4px);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 9000;
            }
            .cap-modal-overlay.open {
                display: flex;
            }
            .cap-modal {
                background: #F5EDDA;
                width: 100%;
                max-width: 440px;
                margin: 0 16px;
                border: 1px solid rgba(70,55,35,.22);
                box-shadow: 0 20px 60px rgba(0,0,0,0.15);
                border-radius: 4px;
                overflow: hidden;
            }
            .cap-modal-hdr {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 18px 22px;
                border-bottom: 1px solid #f0f0f0;
                background: #FAF4E6;
            }
            .cap-modal-title {
                font-family: var(--font-data);
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #5C1414;
            }
            .cap-modal-close {
                background: none;
                border: none;
                cursor: pointer;
                color: #999;
                padding: 4px;
                display: flex;
                align-items: center;
                transition: color 0.15s;
            }
            .cap-modal-close:hover { color: #5C1414; }
            .cap-modal-body {
                padding: 24px 22px;
            }
            .cap-modal-sub {
                font-size: 12px;
                color: #666;
                margin-bottom: 20px;
                font-family: var(--font-data);
            }
            .cap-modal-footer {
                padding: 14px 22px;
                border-top: 1px solid #f0f0f0;
                background: #FAF4E6;
                font-family: var(--font-data);
                font-size: 10px;
                color: #999;
                text-align: center;
            }

            /* Card element */
            .cap-card-el {
                border: 1px solid rgba(70,55,35,.22);
                padding: 14px;
                margin-bottom: 16px;
                background: #FAF4E6;
                border-radius: 4px;
                transition: border-color 0.15s, background 0.15s;
            }
            .cap-card-el:focus-within {
                border-color: #5C1414;
                background: #F5EDDA;
                box-shadow: 0 0 0 3px rgba(92, 20, 20, 0.08);
            }

            /* Error  */
            .cap-error {
                font-size: 11px;
                color: #5C1414;
                font-family: var(--font-data);
                margin-bottom: 12px;
                display: none;
            }
            .cap-error.visible { display: block; }

            /* Modal Buttons */
            .cap-btn-primary {
                width: 100%;
                padding: 14px;
                background: #5C1414;
                color: #fff;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                border: none;
                cursor: pointer;
                transition: all 0.2s;
                font-family: var(--font-data);
                border-radius: 3px;
            }
            .cap-btn-primary:hover {
                background: #4A1010;
                box-shadow: 0 4px 12px rgba(92, 20, 20, 0.2);
            }
            .cap-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

            .cap-btn-danger {
                width: 100%;
                padding: 14px;
                background: #5C1414;
                color: #fff;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                border: none;
                cursor: pointer;
                transition: all 0.2s;
                font-family: var(--font-data);
                margin-top: 8px;
                border-radius: 3px;
            }
            .cap-btn-danger:hover {
                background: #4A1010;
                box-shadow: 0 4px 12px rgba(92, 20, 20, 0.2);
            }
            .cap-btn-ghost {
                width: 100%;
                padding: 14px;
                background: transparent;
                color: #666;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                border: 1px solid rgba(70,55,35,.22);
                cursor: pointer;
                transition: all 0.15s;
                font-family: var(--font-data);
                border-radius: 3px;
            }
            .cap-btn-ghost:hover { border-color: #5C1414; color: #5C1414; }

            /* Add funds input */
            .cap-input-wrap {
                margin-bottom: 16px;
            }
            .cap-input-lbl {
                display: block;
                font-family: var(--font-data);
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #5C1414;
                margin-bottom: 8px;
            }
            .cap-input-amt {
                position: relative;
            }
            .cap-input-prefix {
                position: absolute;
                left: 14px;
                top: 50%;
                transform: translateY(-50%);
                color: #5C1414;
                font-family: var(--font-data);
                font-size: 18px;
                font-weight: 700;
            }
            .cap-input-amt input {
                width: 100%;
                padding: 14px 14px 14px 32px;
                border: 1px solid rgba(70,55,35,.22);
                font-size: 24px;
                font-family: var(--font-data);
                color: #111;
                background: #FAF4E6;
                box-sizing: border-box;
                outline: none;
                border-radius: 4px;
                transition: border-color 0.15s, background 0.15s;
            }
            .cap-input-amt input:focus {
                border-color: #5C1414;
                background: #F5EDDA;
                box-shadow: 0 0 0 3px rgba(92, 20, 20, 0.08);
            }

            /* Success modal */
            .cap-success-body {
                text-align: center;
                padding: 36px 24px;
            }
            .cap-success-icon {
                width: 52px;
                height: 52px;
                background: rgba(92, 20, 20, 0.06);
                border: 2px solid rgba(92, 20, 20, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 16px;
                color: #5C1414;
                font-size: 22px;
                font-weight: 700;
            }
            .cap-success-title {
                font-size: 18px;
                font-weight: 800;
                color: #111;
                margin: 0 0 8px;
            }
            .cap-success-amt {
                font-family: var(--font-data);
                font-size: 28px;
                font-weight: 700;
                color: #5C1414;
                margin: 12px 0 4px;
            }
            .cap-success-sub {
                font-size: 12px;
                color: #888;
                font-family: var(--font-data);
                margin-bottom: 24px;
            }
        </style>

        <div class="cap">
            <div class="cap-inner">

                <!-- Restriction Alert -->
                <div class="cap-alert" id="restriction-banner">
                    ⚠ ACCOUNT RESTRICTED — Payouts and new contracts are currently disabled.
                </div>

                <!-- Page Header -->
                <div class="cap-hdr" data-reveal>
                    <div class="cap-hdr-left">
                        <h1 class="cap-hdr-title">CAPITAL</h1>
                        <p class="cap-hdr-sub">Manage capital custody, allocation, and settlement.</p>
                    </div>
                    <button class="cap-deposit-btn" id="add-funds-btn">DEPOSIT CAPITAL</button>
                </div>

                <!-- Capital Overview Strip -->
                <div class="cap-overview" data-reveal>
                    <div class="cap-stat" id="stat-avail-card">
                        <div class="cap-stat-lbl">Available Capital</div>
                        <div class="cap-stat-val" id="available-balance">—</div>
                        <div class="cap-stat-sub" id="available-sub">Loading...</div>
                    </div>
                    <div class="cap-stat" id="stat-locked-card">
                        <div class="cap-stat-lbl">Locked in Contracts</div>
                        <div class="cap-stat-val" id="locked-balance">—</div>
                        <div class="cap-stat-sub" id="locked-sub">Loading...</div>
                    </div>
                    <div class="cap-stat" id="stat-pending-card">
                        <div class="cap-stat-lbl">Pending Settlement</div>
                        <div class="cap-stat-val" id="pending-payout">—</div>
                        <div class="cap-stat-sub" id="pending-sub">Loading...</div>
                    </div>
                </div>

                <!-- Unconfigured Payout Warning -->
                <div class="cap-warning-banner" id="payout-warning-banner">
                    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                        <i data-lucide="alert-triangle" style="width: 14px; height: 14px; color: #5C1414; flex-shrink: 0;"></i>
                        <span style="font-family: var(--font-data); font-size: 11px; color: #5C1414;">
                            No settlement destination configured. You can deposit capital, but payouts can't be issued until a bank account is added.
                        </span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <button class="cap-warning-link" id="warning-add-bank-btn">Add bank account</button>
                        <button class="cap-warning-close" id="warning-close-btn" aria-label="Dismiss warning">✕</button>
                    </div>
                </div>

                <!-- Funding Sources -->
                <div class="cap-section" data-reveal>
                    <div class="cap-section-hdr">
                        <span class="cap-section-title">Funding Sources</span>
                        <button class="cap-add-btn" id="add-source-header-btn">+ Add source</button>
                    </div>

                    <!-- Card Source -->
                    <div class="cap-row" id="source-card">
                        <i data-lucide="credit-card" class="cap-row-icon"></i>
                        <div class="cap-row-text-group">
                            <span class="cap-row-identifier" id="card-identifier">Card</span>
                            <span class="cap-row-detail" id="card-detail">Loading...</span>
                            <span class="cap-row-badge-wrap" id="card-badge"></span>
                        </div>
                        <button class="cap-action-btn" id="manage-card-btn" aria-label="Configure Funding Card">Configure</button>
                    </div>
                </div>

                <!-- Payout Destinations -->
                <div class="cap-section" data-reveal>
                    <div class="cap-section-hdr">
                        <span class="cap-section-title">Settlement Destinations</span>
                        <button class="cap-add-btn" id="add-destination-header-btn">+ Add destination</button>
                    </div>
                    <div class="cap-row" id="destination-bank">
                        <i data-lucide="building-2" class="cap-row-icon"></i>
                        <div class="cap-row-text-group">
                            <span class="cap-row-identifier" id="bank-identifier">Bank account</span>
                            <span class="cap-row-detail" id="bank-detail">Loading...</span>
                            <span class="cap-row-badge-wrap" id="bank-badge"></span>
                        </div>
                        <button class="cap-action-btn" id="manage-payout-btn" aria-label="Configure Settlement Destination">Configure</button>
                    </div>
                </div>

                <div class="cap-caption-text">
                    Payouts execute only after contract settlement and clearance.
                </div>

                <!-- Bloomberg Footer -->
                <div class="cap-footer">
                    <div class="cap-footer-item">
                        <span class="cap-footer-lbl">System Status</span>
                        <span class="cap-footer-val"><span class="cap-footer-dot"></span>OPERATIONAL</span>
                    </div>
                    <div class="cap-footer-item">
                        <span class="cap-footer-lbl">Custody</span>
                        <span class="cap-footer-val">Stripe Connect</span>
                    </div>
                    <div class="cap-footer-item">
                        <span class="cap-footer-lbl">Settlement</span>
                        <span class="cap-footer-val">Automated</span>
                    </div>
                    <div class="cap-footer-item">
                        <span class="cap-footer-lbl">Jurisdiction</span>
                        <span class="cap-footer-val">US / Regulated</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ===== CARD MODAL ===== -->
        <div id="card-modal" class="cap-modal-overlay">
            <div class="cap-modal">
                <div class="cap-modal-hdr">
                    <span class="cap-modal-title">Add Funding Method</span>
                    <button id="close-card-modal" class="cap-modal-close">
                        <i data-lucide="x" style="width:16px;height:16px;"></i>
                    </button>
                </div>
                <div class="cap-modal-body">
                    <!-- Apple Pay / Google Pay -->
                    <div id="wallet-pay-section" style="display:none;">
                        <div id="payment-request-button" style="margin-bottom:16px;"></div>
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                            <div style="flex:1;height:1px;background:rgba(70,55,35,.22);"></div>
                            <span style="font-family:var(--font-data);font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:0.1em;">or enter card</span>
                            <div style="flex:1;height:1px;background:rgba(70,55,35,.22);"></div>
                        </div>
                    </div>
                    <p class="cap-modal-sub">Verify a card to use as your funding instrument.</p>
                    <div class="cap-card-el" id="card-element-container"></div>
                    <div class="cap-error" id="card-error"></div>
                    <button class="cap-btn-primary" id="submit-card-btn">VERIFY &amp; SAVE CARD</button>
                </div>
                <div class="cap-modal-footer">
                    Payment method is verified but not charged until capital is locked.
                </div>
            </div>
        </div>

        <!-- ===== REMOVE CARD MODAL ===== -->
        <div id="remove-card-modal" class="cap-modal-overlay">
            <div class="cap-modal">
                <div class="cap-modal-hdr">
                    <span class="cap-modal-title">Remove Funding Card</span>
                </div>
                <div class="cap-modal-body">
                    <p class="cap-modal-sub">This will remove your verified funding source. A new card must be added before locking capital.</p>
                    <button class="cap-btn-ghost" id="cancel-remove-btn">CANCEL</button>
                    <button class="cap-btn-danger" id="confirm-remove-btn">REMOVE CARD</button>
                </div>
            </div>
        </div>

        <!-- ===== DEPOSIT CAPITAL MODAL ===== -->
        <div id="add-funds-modal" class="cap-modal-overlay">
            <div class="cap-modal">
                <div class="cap-modal-hdr">
                    <span class="cap-modal-title">Deposit Capital</span>
                    <button id="close-add-funds-modal" class="cap-modal-close">
                        <i data-lucide="x" style="width:16px;height:16px;"></i>
                    </button>
                </div>
                <div class="cap-modal-body">
                    <p class="cap-modal-sub">Allocate capital to your available balance.</p>
                    <div class="cap-input-wrap">
                        <label class="cap-input-lbl">AMOUNT_USD</label>
                        <div class="cap-input-amt">
                            <span class="cap-input-prefix">$</span>
                            <input id="add-funds-amount" type="number" min="1" step="1" placeholder="0">
                        </div>
                    </div>
                    <div class="cap-error" id="add-funds-error"></div>
                    <button class="cap-btn-primary" id="submit-add-funds-btn">DEPOSIT CAPITAL</button>
                </div>
                <div class="cap-modal-footer">Charged immediately to your verified card.</div>
            </div>
        </div>

        <!-- ===== SUCCESS MODAL ===== -->
        <div id="success-modal" class="cap-modal-overlay">
            <div class="cap-modal">
                <div class="cap-success-body">
                    <div class="cap-success-icon">✓</div>
                    <h3 class="cap-success-title">Capital Deposited</h3>
                    <div class="cap-success-amt" id="success-amount">$0.00</div>
                    <p class="cap-success-sub">Added to your available balance</p>
                    <button class="cap-btn-primary" id="success-modal-close">CONTINUE</button>
                </div>
            </div>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════
// Helper
// ═══════════════════════════════════════════════════════
function formatUSD(cents) {
    const dollars = cents / 100;
    return '$' + dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Stripe instance (module-level)
let stripe = null;
let cardElement = null;

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
export async function initFunding() {
    if (window.lucide) window.lucide.createIcons();

    // Initialize Stripe.js
    const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    const isProduction = window.location.hostname === 'collateral.market';

    if (!isProduction) {
        console.log('[Capital] Stripe key:', STRIPE_PUBLISHABLE_KEY ? 'present' : 'MISSING');
    }

    if (window.Stripe && STRIPE_PUBLISHABLE_KEY && !STRIPE_PUBLISHABLE_KEY.includes('placeholder')) {
        try {
            stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);
        } catch (stripeErr) {
            console.error('[Capital] Failed to initialize Stripe:', stripeErr);
        }
    }

    // ── Helper ──
    function updateStatCard(cardId, valEl, cents, subEl, nonzeroText, zeroText) {
        if (valEl) valEl.textContent = formatUSD(cents);
        const card = document.getElementById(cardId);
        if (card) {
            card.classList.toggle('zero', cents === 0);
        }
        if (subEl) {
            subEl.textContent = cents > 0 ? nonzeroText : zeroText;
        }
    }

    // ── DOM refs ──
    const cardIdentifierEl = document.getElementById('card-identifier');
    const cardDetailEl = document.getElementById('card-detail');
    const cardBadgeEl = document.getElementById('card-badge');
    const bankIdentifierEl = document.getElementById('bank-identifier');
    const bankDetailEl = document.getElementById('bank-detail');
    const bankBadgeEl = document.getElementById('bank-badge');
    const availableBalanceEl = document.getElementById('available-balance');
    const lockedBalanceEl = document.getElementById('locked-balance');
    const pendingPayoutEl = document.getElementById('pending-payout');
    const manageCardBtn = document.getElementById('manage-card-btn');
    const managePayoutBtn = document.getElementById('manage-payout-btn');
    const addFundsBtn = document.getElementById('add-funds-btn');

    // Modal refs
    const cardModal = document.getElementById('card-modal');
    const closeCardModalBtn = document.getElementById('close-card-modal');
    const submitCardBtn = document.getElementById('submit-card-btn');
    const cardErrorEl = document.getElementById('card-error');
    const removeCardModal = document.getElementById('remove-card-modal');
    const cancelRemoveBtn = document.getElementById('cancel-remove-btn');
    const confirmRemoveBtn = document.getElementById('confirm-remove-btn');
    const addFundsModal = document.getElementById('add-funds-modal');
    const closeAddFundsBtn = document.getElementById('close-add-funds-modal');
    const addFundsAmountInput = document.getElementById('add-funds-amount');
    const addFundsErrorEl = document.getElementById('add-funds-error');
    const submitAddFundsBtn = document.getElementById('submit-add-funds-btn');
    const successModal = document.getElementById('success-modal');
    const successAmountEl = document.getElementById('success-amount');
    const successCloseBtn = document.getElementById('success-modal-close');

    let currentCardStatus = null;

    // ── Modal helpers ──
    function openModal(el) { el?.classList.add('open'); }
    function closeModal(el) { el?.classList.remove('open'); }

    // ── Success modal ──
    function showSuccessModal(amount) {
        successAmountEl.textContent = `$${amount.toFixed(2)}`;
        openModal(successModal);
    }
    successCloseBtn?.addEventListener('click', () => closeModal(successModal));
    successModal?.addEventListener('click', (e) => { if (e.target === successModal) closeModal(successModal); });

    // ── Load billing status ──
    async function loadBillingStatus() {
        try {
            const billingStatus = await window.api.getBillingStatus();

            if (billingStatus?.identityStatus === 'SUSPENDED') {
                document.getElementById('restriction-banner')?.classList.add('visible');
                [manageCardBtn, managePayoutBtn, addFundsBtn].forEach(b => { if (b) { b.disabled = true; b.style.opacity = '0.3'; } });
            }

            // Surface unconfigured payout banner
            const hasPayoutDest = !!(billingStatus?.payoutDestination?.connected);
            const bannerDismissed = sessionStorage.getItem('payout_warning_dismissed') === 'true';
            const warningBanner = document.getElementById('payout-warning-banner');
            if (warningBanner) {
                if (!hasPayoutDest && !bannerDismissed) {
                    warningBanner.classList.add('visible');
                } else {
                    warningBanner.classList.remove('visible');
                }
            }

            if (billingStatus?.fundingSource) {
                const fs = billingStatus.fundingSource;
                currentCardStatus = fs.status;

                if (fs.status === 'verified') {
                    const brand = fs.brand?.toUpperCase() || 'CARD';
                    const last4 = fs.last4 || '****';
                    const exp = fs.expMonth && fs.expYear ? `${String(fs.expMonth).padStart(2, '0')}/${String(fs.expYear).slice(-2)}` : '';
                    if (cardIdentifierEl) cardIdentifierEl.textContent = `${brand} •••• ${last4}`;
                    if (cardDetailEl) cardDetailEl.textContent = exp ? `exp ${exp}` : '';
                    if (cardBadgeEl) cardBadgeEl.innerHTML = '<span class="cap-badge verified">VERIFIED</span>';
                    if (manageCardBtn) {
                        manageCardBtn.textContent = 'Remove';
                        manageCardBtn.setAttribute('aria-label', `Remove ${brand} •••• ${last4} funding source (Verified)`);
                    }
                } else if (fs.status === 'pending_verification') {
                    if (cardIdentifierEl) cardIdentifierEl.textContent = 'Card';
                    if (cardDetailEl) cardDetailEl.textContent = 'Verification pending';
                    if (cardBadgeEl) cardBadgeEl.innerHTML = '<span class="cap-badge pending-badge">PENDING</span>';
                    if (manageCardBtn) {
                        manageCardBtn.textContent = 'Configure';
                        manageCardBtn.setAttribute('aria-label', 'Configure funding card (Pending verification)');
                    }
                } else {
                    if (cardIdentifierEl) cardIdentifierEl.textContent = 'Card';
                    if (cardDetailEl) cardDetailEl.textContent = 'Not configured';
                    if (cardBadgeEl) cardBadgeEl.innerHTML = '<span class="cap-badge required">REQUIRED</span>';
                    if (manageCardBtn) {
                        manageCardBtn.textContent = 'Configure';
                        manageCardBtn.setAttribute('aria-label', 'Configure funding card (Required)');
                    }
                }
            } else {
                if (cardIdentifierEl) cardIdentifierEl.textContent = 'Card';
                if (cardDetailEl) cardDetailEl.textContent = 'Not configured';
                if (cardBadgeEl) cardBadgeEl.innerHTML = '<span class="cap-badge required">REQUIRED</span>';
                if (manageCardBtn) {
                    manageCardBtn.textContent = 'Configure';
                    manageCardBtn.setAttribute('aria-label', 'Configure funding card (Required)');
                }
            }

            if (billingStatus?.payoutDestination?.connected) {
                if (bankIdentifierEl) bankIdentifierEl.textContent = 'Bank account';
                if (bankDetailEl) bankDetailEl.textContent = 'Connected';
                if (bankBadgeEl) bankBadgeEl.innerHTML = '<span class="cap-badge verified">ACTIVE</span>';
                if (managePayoutBtn) {
                    managePayoutBtn.textContent = 'Configure';
                    managePayoutBtn.setAttribute('aria-label', 'Configure bank account payout destination (Active)');
                }
            } else {
                if (bankIdentifierEl) bankIdentifierEl.textContent = 'Bank account';
                if (bankDetailEl) bankDetailEl.textContent = 'Not configured';
                if (bankBadgeEl) bankBadgeEl.innerHTML = '<span class="cap-badge required">REQUIRED</span>';
                if (managePayoutBtn) {
                    managePayoutBtn.textContent = 'Configure';
                    managePayoutBtn.setAttribute('aria-label', 'Configure bank account payout destination (Required)');
                }
            }

            if (billingStatus?.balances) {
                const avail = billingStatus.balances.availableBalanceUsdCents || 0;
                const locked = billingStatus.balances.lockedBalanceUsdCents || 0;
                const pending = billingStatus.balances.pendingPayoutUsdCents || 0;
                updateStatCard('stat-avail-card', availableBalanceEl, avail, document.getElementById('available-sub'), 'Undeployed. Ready to lock.', 'Deposit to begin.');
                updateStatCard('stat-locked-card', lockedBalanceEl, locked, document.getElementById('locked-sub'), 'Actively committed and at risk.', 'No active contracts.');
                updateStatCard('stat-pending-card', pendingPayoutEl, pending, document.getElementById('pending-sub'), 'Released. Transfer in progress.', 'No pending payouts.');
            } else {
                updateStatCard('stat-avail-card', availableBalanceEl, 0, document.getElementById('available-sub'), 'Undeployed. Ready to lock.', 'Deposit to begin.');
                updateStatCard('stat-locked-card', lockedBalanceEl, 0, document.getElementById('locked-sub'), 'Actively committed and at risk.', 'No active contracts.');
                updateStatCard('stat-pending-card', pendingPayoutEl, 0, document.getElementById('pending-sub'), 'Released. Transfer in progress.', 'No pending payouts.');
            }

        } catch (err) {
            console.error('[Capital] Error loading billing status:', err);
            // Set ALL fields to defaults so nothing stays stuck at "Loading..."
            if (cardIdentifierEl) cardIdentifierEl.textContent = 'Card';
            if (cardDetailEl) cardDetailEl.textContent = 'Not configured';
            if (cardBadgeEl) cardBadgeEl.innerHTML = '<span class="cap-badge required">REQUIRED</span>';
            if (bankIdentifierEl) bankIdentifierEl.textContent = 'Bank account';
            if (bankDetailEl) bankDetailEl.textContent = 'Not configured';
            if (bankBadgeEl) bankBadgeEl.innerHTML = '<span class="cap-badge required">REQUIRED</span>';
            updateStatCard('stat-avail-card', availableBalanceEl, 0, document.getElementById('available-sub'), 'Undeployed. Ready to lock.', 'Deposit to begin.');
            updateStatCard('stat-locked-card', lockedBalanceEl, 0, document.getElementById('locked-sub'), 'Actively committed and at risk.', 'No active contracts.');
            updateStatCard('stat-pending-card', pendingPayoutEl, 0, document.getElementById('pending-sub'), 'Released. Transfer in progress.', 'No pending payouts.');
        }
    }

    async function loadContractBalances() {
        try {
            const response = await window.api.getContracts();
            const contracts = response?.contracts || [];

            const lockedStates = ['LOCKED', 'ACTIVE', 'EXECUTION_CONFIRMED', 'FUNDS_LOCKED', 'VERIFIED', 'VERIFYING'];
            const pendingPayoutStates = ['SETTLED', 'PAYOUT_PENDING'];

            const lockedCents = contracts
                .filter(c => lockedStates.includes(c.derivedState))
                .reduce((sum, c) => sum + (c.lockAmountUsdCents || 0), 0);

            const pendingCents = contracts
                .filter(c => pendingPayoutStates.includes(c.derivedState))
                .reduce((sum, c) => sum + (c.lockAmountUsdCents || 0), 0);

            if (lockedCents > 0) {
                updateStatCard('stat-locked-card', lockedBalanceEl, lockedCents, document.getElementById('locked-sub'), 'Actively committed and at risk.', 'No active contracts.');
            }
            if (pendingCents > 0) {
                updateStatCard('stat-pending-card', pendingPayoutEl, pendingCents, document.getElementById('pending-sub'), 'Released. Transfer in progress.', 'No pending payouts.');
            }

        } catch (err) {
            console.error('[Capital] Error loading contracts:', err);
        }
    }

    // ── Card Modal ──
    let walletInitialized = false;
    function showCardModal() {
        openModal(cardModal);
        if (stripe && !cardElement) {
            const elements = stripe.elements();
            cardElement = elements.create('card', {
                style: {
                    base: {
                        fontSize: '15px',
                        color: '#111',
                        fontFamily: "var(--font-data)",
                        '::placeholder': { color: '#bbb' },
                    },
                    invalid: { color: '#752122' },
                },
            });
            cardElement.mount('#card-element-container');
            cardElement.on('change', (event) => {
                if (event.error) {
                    cardErrorEl.textContent = event.error.message;
                    cardErrorEl.classList.add('visible');
                } else {
                    cardErrorEl.classList.remove('visible');
                }
            });
        }

        // ── Apple Pay / Google Pay (Payment Request Button) ──
        if (stripe && !walletInitialized) {
            walletInitialized = true;
            const paymentRequest = stripe.paymentRequest({
                country: 'US',
                currency: 'usd',
                total: { label: 'Collateral — Verify Payment Method', amount: 0 },
                requestPayerName: true,
                requestPayerEmail: true,
            });

            const prButton = stripe.elements().create('paymentRequestButton', {
                paymentRequest,
                style: {
                    paymentRequestButton: {
                        type: 'default',
                        theme: 'dark',
                        height: '48px',
                    },
                },
            });

            paymentRequest.canMakePayment().then((result) => {
                if (result) {
                    const walletSection = document.getElementById('wallet-pay-section');
                    if (walletSection) walletSection.style.display = 'block';
                    prButton.mount('#payment-request-button');
                    console.log('[Capital] Wallet payment available:', result.applePay ? 'Apple Pay' : 'Google Pay');
                } else {
                    console.log('[Capital] No wallet payment available (Apple Pay / Google Pay)');
                }
            });

            // When user authenticates with Apple Pay / Google Pay
            paymentRequest.on('paymentmethod', async (ev) => {
                try {
                    const siResponse = await window.api.createCardSetupIntent();
                    if (!siResponse?.clientSecret) {
                        ev.complete('fail');
                        return;
                    }

                    const { setupIntent, error } = await stripe.confirmCardSetup(
                        siResponse.clientSecret,
                        { payment_method: ev.paymentMethod.id },
                        { handleActions: false }
                    );

                    if (error) {
                        ev.complete('fail');
                        cardErrorEl.textContent = error.message;
                        cardErrorEl.classList.add('visible');
                        return;
                    }

                    ev.complete('success');

                    if (setupIntent.status === 'succeeded') {
                        await window.api.confirmCard(setupIntent.id, setupIntent.payment_method);
                        closeModal(cardModal);
                        await loadBillingStatus();
                    } else if (setupIntent.status === 'requires_action') {
                        const { error: actionError } = await stripe.confirmCardSetup(siResponse.clientSecret);
                        if (actionError) {
                            cardErrorEl.textContent = actionError.message;
                            cardErrorEl.classList.add('visible');
                        } else {
                            await window.api.confirmCard(setupIntent.id, setupIntent.payment_method);
                            closeModal(cardModal);
                            await loadBillingStatus();
                        }
                    }
                } catch (err) {
                    ev.complete('fail');
                    cardErrorEl.textContent = err.message || 'Wallet verification failed.';
                    cardErrorEl.classList.add('visible');
                }
            });
        }

        if (window.lucide) window.lucide.createIcons();
    }

    async function submitCard() {
        if (!stripe || !cardElement) {
            const reason = !window.Stripe ? 'Stripe.js not loaded'
                : !stripe ? 'VITE_STRIPE_PUBLISHABLE_KEY missing'
                    : 'Card element not ready';
            cardErrorEl.textContent = `${reason}. Contact support.`;
            cardErrorEl.classList.add('visible');
            return;
        }

        submitCardBtn.disabled = true;
        submitCardBtn.textContent = 'VERIFYING...';
        cardErrorEl.classList.remove('visible');

        try {
            const siResponse = await window.api.createCardSetupIntent();
            if (!siResponse?.clientSecret) throw new Error('Failed to create setup intent');
            if (!siResponse.clientSecret.includes('_secret_')) throw new Error('Invalid setup intent format');

            const { setupIntent, error } = await stripe.confirmCardSetup(siResponse.clientSecret, {
                payment_method: { card: cardElement },
            });

            if (error) throw new Error(error.message);

            if (setupIntent.status === 'succeeded') {
                await window.api.confirmCard(setupIntent.id, setupIntent.payment_method);
                closeModal(cardModal);
                await loadBillingStatus();
            } else if (setupIntent.status === 'requires_action') {
                cardErrorEl.textContent = 'Additional authentication required.';
                cardErrorEl.classList.add('visible');
            }
        } catch (err) {
            cardErrorEl.textContent = err.message || 'Verification failed. Please retry.';
            cardErrorEl.classList.add('visible');
        } finally {
            submitCardBtn.disabled = false;
            submitCardBtn.textContent = 'VERIFY & SAVE CARD';
        }
    }

    async function removeCard() {
        confirmRemoveBtn.disabled = true;
        confirmRemoveBtn.textContent = 'REMOVING...';
        try {
            await window.api.removeCard();
            closeModal(removeCardModal);
            await loadBillingStatus();
        } catch (err) {
            window.CollateralModal.showAlert('Failed to remove card: ' + (err.message || 'Unknown error'), { type: 'error' });
        } finally {
            confirmRemoveBtn.disabled = false;
            confirmRemoveBtn.textContent = 'REMOVE CARD';
        }
    }

    // ── Add Funds ──
    async function submitAddFunds() {
        const amount = parseFloat(addFundsAmountInput.value);
        if (!amount || amount < 1) {
            addFundsErrorEl.textContent = 'MIN_AMOUNT: $1.00';
            addFundsErrorEl.classList.add('visible');
            return;
        }
        submitAddFundsBtn.disabled = true;
        submitAddFundsBtn.textContent = 'PROCESSING...';
        addFundsErrorEl.classList.remove('visible');
        try {
            const result = await window.api.addFunds(Math.round(amount * 100));
            if (result.error) throw new Error(result.error);
            closeModal(addFundsModal);
            await loadBillingStatus();

            // Conversion tracking — Capital Deposited
            if (typeof twq === 'function') twq('event', 'tw-rbwqr-rbx5z', {});
            if (typeof gtag === 'function') gtag('event', 'conversion', { send_to: 'AW-18147195908/funds_deposited', value: amount, currency: 'USD' });
            if (typeof fbq === 'function') fbq('track', 'AddPaymentInfo');
            if (typeof ttq !== 'undefined') ttq.track('AddPaymentInfo');

            showSuccessModal(amount);
        } catch (err) {
            addFundsErrorEl.textContent = err.message || 'Deposit failed. Retry.';
            addFundsErrorEl.classList.add('visible');
        } finally {
            submitAddFundsBtn.disabled = false;
            submitAddFundsBtn.textContent = 'DEPOSIT CAPITAL';
        }
    }

    // ── Event Wiring ──
    manageCardBtn?.addEventListener('click', () => {
        if (currentCardStatus === 'verified') {
            openModal(removeCardModal);
        } else {
            showCardModal();
        }
    });
    managePayoutBtn?.addEventListener('click', () => window.app?.setupPayout?.());

    closeCardModalBtn?.addEventListener('click', () => closeModal(cardModal));
    cardModal?.addEventListener('click', (e) => { if (e.target === cardModal) closeModal(cardModal); });
    submitCardBtn?.addEventListener('click', submitCard);

    cancelRemoveBtn?.addEventListener('click', () => closeModal(removeCardModal));
    confirmRemoveBtn?.addEventListener('click', removeCard);
    removeCardModal?.addEventListener('click', (e) => { if (e.target === removeCardModal) closeModal(removeCardModal); });

    addFundsBtn?.addEventListener('click', () => {
        addFundsAmountInput.value = '';
        addFundsErrorEl.classList.remove('visible');
        openModal(addFundsModal);
    });
    closeAddFundsBtn?.addEventListener('click', () => closeModal(addFundsModal));
    addFundsModal?.addEventListener('click', (e) => { if (e.target === addFundsModal) closeModal(addFundsModal); });
    submitAddFundsBtn?.addEventListener('click', submitAddFunds);
    addFundsAmountInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitAddFunds(); });

    // Affordance header buttons
    document.getElementById('add-source-header-btn')?.addEventListener('click', showCardModal);
    document.getElementById('add-destination-header-btn')?.addEventListener('click', () => window.app?.setupPayout?.());

    // Payout warning banner buttons
    document.getElementById('warning-add-bank-btn')?.addEventListener('click', () => {
        window.app?.setupPayout?.();
    });
    document.getElementById('warning-close-btn')?.addEventListener('click', () => {
        sessionStorage.setItem('payout_warning_dismissed', 'true');
        document.getElementById('payout-warning-banner')?.classList.remove('visible');
    });

    // ── Load ──
    await loadBillingStatus();
    await loadContractBalances();
}
