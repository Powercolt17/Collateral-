// Header Component - Full-Bleed Viewport Layout, Left-Aligned Terminal Columns & Separated Menu Cluster
export function renderHeader(currentRoute = '') {
    const isRoot = currentRoute === '/' || currentRoute === '' || currentRoute === '/market';
    const isMarket = isRoot || currentRoute.startsWith('/market/');
    const isActiveContracts = currentRoute === '/my-contracts' || currentRoute.startsWith('/contracts/');
    const isLedger = currentRoute === '/ledger';
    const isSources = currentRoute === '/sources';
    const isCustodyTerminal = currentRoute === '/protocol?tab=terminal';
    const isProtocol = (currentRoute === '/protocol' || currentRoute.startsWith('/protocol')) && !isCustodyTerminal;
    const isDocs = currentRoute === '/docs';
    const isProfile = currentRoute === '/profile';
    const isReferrals = currentRoute === '/referrals';
    const isFunding = currentRoute === '/funding';

    // Route to Current-Section Label Mapping (Static location indicator)
    let sectionLabel = '';
    if (currentRoute === '/market' || currentRoute.startsWith('/market/')) {
        sectionLabel = 'MARKET';
    } else if (currentRoute === '/my-contracts' || currentRoute.startsWith('/contracts/')) {
        sectionLabel = 'ACTIVE';
    } else if (currentRoute === '/ledger') {
        sectionLabel = 'LEDGER';
    } else if (currentRoute === '/sources') {
        sectionLabel = 'SOURCES';
    } else if (currentRoute === '/protocol?tab=terminal') {
        sectionLabel = 'CUSTODY TERMINAL';
    } else if (currentRoute === '/protocol' || currentRoute.startsWith('/protocol')) {
        sectionLabel = 'PROTOCOL';
    } else if (currentRoute === '/profile') {
        sectionLabel = 'PROFILE';
    } else if (currentRoute === '/referrals') {
        sectionLabel = 'REFERRALS';
    } else if (currentRoute === '/funding') {
        sectionLabel = 'ACCOUNT CAPITAL';
    } else if (currentRoute === '/docs') {
        sectionLabel = 'DOCUMENTATION';
    } else if (currentRoute === '/' || currentRoute === '') {
        // Signed in on root: show MARKET. Signed out on homepage: omit label & rule entirely.
        sectionLabel = (typeof appState !== 'undefined' && appState.isLoggedIn) ? 'MARKET' : '';
    }

    return `
        <style>
            /* ══════════════════════════════════════════════════════════════
               FULL-BLEED STICKY HEADER & SEPARATED MENU CLUSTER
               ══════════════════════════════════════════════════════════════ */
            .ch-header {
                width: 100%;
                border-bottom: 1px solid var(--rule, #DCD5C6);
                background: var(--paper, #FFFDF9) !important;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 50;
                height: 64px; /* Fixed constant height — ZERO layout shift on scroll */
                transition: background 150ms ease, border-color 150ms ease;
            }
            .ch-header.nav-scrolled {
                background: rgba(255, 253, 249, 0.96) !important;
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                border-bottom-color: var(--rule-strong, #BDB3A0);
            }

            /* Full-Bleed Viewport Layout: Wordmark and Menu sit flush to edge gutters */
            .ch-header-inner {
                width: 100%;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 24px;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                box-sizing: border-box;
            }
            @media (max-width: 767px) {
                .ch-header-inner {
                    padding: 0 16px;
                }
            }

            .ch-left {
                display: flex;
                align-items: center;
            }

            /* Signature Wordmark */
            .ch-logo-wordmark {
                /* Trajan Pro, cut from the inscription on Trajan's Column, which
                   is the same Roman lettering tradition the hero engraving is
                   drawn from. Stack behind it is unchanged, so if the file fails
                   to load the wordmark falls back to exactly what it was before.

                   400, NOT 700. Trajan Pro Regular is a single-weight face, so a
                   700 request makes the browser fake a bold by smearing the
                   outlines — fatal on a face whose whole quality is the stroke
                   modulation of a chisel. font-synthesis: none refuses that
                   substitution outright rather than relying on the weight
                   matching, and also blocks synthetic obliquing. */
                font-family: 'Trajan Pro', 'Nevera', 'Aquire', 'Cinzel', sans-serif !important;
                font-size: 21px !important;
                font-weight: 400 !important;
                font-synthesis: none;
                /* Tuned for Nevera, kept unchanged so this commit changes the
                   typeface and nothing else. Trajan is a naturally wide face
                   with generous sidebearings, so this may now read as too airy —
                   it is the first thing to adjust if the lockup looks loose. */
                letter-spacing: 0.165em !important;
                color: #0E1420 !important;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                text-transform: uppercase;
                transition: opacity 150ms ease;
            }
            .ch-logo-wordmark:hover { opacity: 0.85; }
            .ch-logo-wordmark:focus-visible {
                outline: 2px solid var(--blood, #7A1C29);
                outline-offset: 4px;
            }

            /* Current-Section Divider Rule & Sub-label (Desktop only) */
            .ch-section-divider {
                width: 1px;
                height: 13px;
                background: #C8C2B4;
                margin: 0 12px;
                display: none;
                align-self: center;
                transform: translateY(1px);
            }
            .ch-section-label {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10.5px;
                font-weight: 600;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                color: #8C877B !important;
                user-select: none;
                display: none;
                align-self: center;
                transform: translateY(0.5px);
            }
            @media (min-width: 768px) {
                .ch-section-divider { display: inline-block; }
                .ch-section-label { display: inline-block; }
            }

            /* Right Controls Group */
            .ch-right {
                display: flex;
                align-items: center;
                gap: 16px;
                height: 100%;
            }

            /* Paired Capital & Health Block (Desktop only, Left-Aligned Terminal Format) */
            .ch-capital-btn {
                display: none;
                flex-direction: row;
                align-items: center;
                gap: 18px;
                cursor: pointer;
                padding: 6px 14px;
                border-right: 1px solid var(--rule, #DCD5C6);
                border-radius: var(--r, 2px);
                transition: background 150ms ease;
                user-select: none;
            }
            @media (min-width: 768px) {
                .ch-capital-btn { display: flex; }
            }
            @media (hover: hover) {
                .ch-capital-btn:hover {
                    background: rgba(14, 20, 32, 0.035);
                }
            }
            .ch-capital-btn:focus-visible {
                outline: 2px solid var(--blood, #7A1C29);
                outline-offset: -2px;
            }

            /* Left-Aligned Terminal Columns */
            .ch-cap-col {
                display: flex;
                flex-direction: column;
                align-items: flex-start; /* Left-aligned label and value */
                gap: 2px;
            }

            /* Micro-labels: Darkened to #333F51 for WCAG AA 4.5:1 Contrast */
            .ch-cap-lbl {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 8.5px;
                font-weight: 600;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: #333F51;
                white-space: nowrap;
            }

            /* Values: Left-aligned Tabular Nums & Integer formatting */
            .ch-cap-val {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 13.5px;
                font-weight: 700;
                font-variant-numeric: tabular-nums !important;
                color: var(--ink, #0E1420);
                white-space: nowrap;
                min-width: 4ch;
                text-align: left;
            }

            /* Health Value State Color: Green >=80% */
            .ch-cap-val--health {
                color: var(--win, #186B4A) !important;
            }

            /* Sign In Button */
            .ch-connect-btn {
                padding: 8px 16px;
                font-size: 11px;
                font-weight: 700;
                color: #FFF8F5;
                background: var(--blood, #7A1C29);
                border: none;
                border-radius: var(--r, 2px);
                cursor: pointer;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                letter-spacing: 0.12em;
                text-transform: uppercase;
                transition: background 150ms ease;
            }
            .ch-connect-btn:hover { background: #54111B; }
            .ch-connect-btn:focus-visible {
                outline: 2px solid var(--blood, #7A1C29);
                outline-offset: 2px;
            }

            /* ── Narrow-screen overflow guard ──
               The header row is wordmark + SIGN IN (or avatar) + MENU, none of
               which shrink. At 320px it measured 359px wide, pushing MENU off
               screen and dropping SIGN IN onto the wordmark.

               SIGN IN is HIDDEN below 820, not shrunk, and the drawer's own
               sign-in (#btn-auth-mobile, in .pnl-connect-section) is the mobile
               path. !important because the auth JS sets this button's display
               inline.

               The avatar and its divider go too. They are the signed-in
               equivalent of the same problem: with the wordmark left at full
               size, 21px, the signed-in row measured 350px against a 320px
               screen. The drawer already shows the profile card, so nothing is
               lost. Wordmark stays 21px at every width. */
            @media (max-width: 820px) {
                .ch-connect-btn { display: none !important; }
                .ch-trigger-avatar-indicator { display: none !important; }
                .ch-avatar-divider { display: none !important; }
            }

            /* Separated Avatar Status Indicator */
            .ch-trigger-avatar-indicator {
                width: 22px;
                height: 22px;
                border-radius: var(--r, 2px);
                background: var(--ink, #0E1420);
                color: #FFF8F5;
                font-family: var(--display, 'Archivo', sans-serif);
                font-size: 10.5px;
                font-weight: 800;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }
            .ch-trigger-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: none;
            }

            .ch-avatar-divider {
                width: 1px;
                height: 14px;
                background: var(--rule, #DCD5C6);
                margin: 0 2px;
            }

            /* Unboxed Menu Trigger (MENU Label + Hamburger Icon Morph to X, Min 44x44px Hit Target) */
            .ch-account-trigger {
                display: flex;
                align-items: center;
                gap: 8px;
                background: transparent;
                border: none; /* UNBOXED: No border or box around trigger */
                min-height: 44px;
                padding: 10px 12px;
                cursor: pointer;
                color: var(--ink, #0E1420);
                border-radius: var(--r, 2px);
                transition: background 150ms ease;
                user-select: none;
            }
            @media (hover: hover) {
                .ch-account-trigger:hover {
                    background: rgba(14, 20, 32, 0.04);
                }
            }
            .ch-account-trigger:focus-visible {
                outline: 2px solid var(--blood, #7A1C29);
                outline-offset: 2px;
            }

            /* Visible MENU Text Label */
            .ch-menu-label {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.16em;
                text-transform: uppercase;
                color: var(--ink, #0E1420);
            }

            /* Hamburger Icon Morph to X */
            .ch-hamburger-icon {
                width: 16px;
                height: 12px;
                position: relative;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }
            .ch-hamburger-icon span {
                display: block;
                width: 100%;
                height: 1.5px;
                background: var(--ink, #0E1420);
                transition: transform 150ms ease, opacity 150ms ease;
                transform-origin: center;
            }
            .ch-account-trigger.open .ch-hamburger-icon span:nth-child(1) {
                transform: translateY(5.25px) rotate(45deg);
            }
            .ch-account-trigger.open .ch-hamburger-icon span:nth-child(2) {
                opacity: 0;
            }
            .ch-account-trigger.open .ch-hamburger-icon span:nth-child(3) {
                transform: translateY(-5.25px) rotate(-45deg);
            }

            /* ════════ SCRIM OVERLAY ════════ */
            .pnl-overlay {
                position: fixed;
                inset: 0;
                background: rgba(14, 20, 32, 0.4);
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                z-index: 90;
                opacity: 0;
                visibility: hidden;
                transition: opacity 250ms ease, visibility 250ms ease;
            }
            .pnl-overlay.open { opacity: 1; visibility: visible; }
            @media (min-width: 768px) {
                .pnl-overlay { display: none !important; }
            }

            /* ════════ RIGHT-ANCHORED SINGLE-SURFACE DRAWER ════════ */
            .pnl-drawer {
                position: fixed;
                top: 0;
                right: 0;
                left: auto;
                bottom: 0;
                height: 100vh;
                background: var(--paper, #FFFDF9);
                border-left: 1px solid var(--rule, #DCD5C6);
                border-right: none;
                z-index: 100;
                display: flex;
                flex-direction: column;
                box-shadow: -12px 0 36px rgba(14, 20, 32, 0.08);
                box-sizing: border-box;
            }

            @media (max-width: 767px) {
                .pnl-drawer {
                    width: 85vw;
                    max-width: 360px;
                    transform: translateX(100%);
                    transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
                }
                .pnl-drawer.open { transform: translateX(0); }
            }

            @media (min-width: 768px) {
                .pnl-drawer {
                    width: 280px;
                    transform: translateX(100%);
                    transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
                }
                .pnl-drawer.open { transform: translateX(0); }
            }

            /* Drawer is the SINGLE navigation surface across ALL breakpoints */
            #drawer-nav-group { display: block !important; }

            /* Panel Header */
            .pnl-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid var(--rule, #DCD5C6);
                flex-shrink: 0;
                height: 64px;
                box-sizing: border-box;
            }
            .pnl-header-title {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.16em;
                color: var(--blood, #7A1C29);
            }
            .pnl-close {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: 1px solid var(--rule, #DCD5C6);
                border-radius: var(--r, 2px);
                cursor: pointer;
                color: var(--ink-3, #6E7686);
                transition: color 150ms ease, border-color 150ms ease, background 150ms ease;
            }
            .pnl-close:hover {
                color: var(--blood, #7A1C29);
                border-color: var(--blood, #7A1C29);
                background: rgba(122, 28, 41, 0.04);
            }
            .pnl-close:focus-visible {
                outline: 2px solid var(--blood, #7A1C29);
                outline-offset: -2px;
            }

            /* Profile Info */
            .pnl-user {
                display: flex;
                align-items: center;
                gap: 14px;
                padding: 16px 20px;
                background: var(--paper-deep, #E7E1D4);
                border-bottom: 1px solid var(--rule, #DCD5C6);
                flex-shrink: 0;
            }
            .pnl-user-badge {
                width: 40px;
                height: 40px;
                border-radius: var(--r, 2px);
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--ink, #0E1420);
                flex-shrink: 0;
                overflow: hidden;
            }
            .pnl-user-initial {
                font-family: var(--display, 'Archivo', sans-serif);
                font-size: 15px;
                font-weight: 800;
                color: #FFF8F5;
            }
            .pnl-user-avatar {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: none;
            }
            .pnl-user-info {
                display: flex;
                flex-direction: column;
                min-width: 0;
            }
            .pnl-user-name {
                font-family: var(--display, 'Archivo', sans-serif);
                font-size: 14px;
                font-weight: 700;
                color: var(--ink, #0E1420);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .pnl-user-role {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 9px;
                font-weight: 500;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: #333F51;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            /* Capital Summary Block in Drawer */
            .pnl-capital-summary {
                display: grid;
                grid-template-columns: 1fr 1fr 1.1fr;
                gap: 6px;
                padding: 14px 20px;
                background: var(--plate, #FFFDF9);
                border-bottom: 1px solid var(--rule, #DCD5C6);
                cursor: pointer;
                transition: background 150ms ease;
                outline: none;
            }
            .pnl-capital-summary:hover { background: var(--paper-deep, #E7E1D4); }
            .pnl-capital-summary:focus-visible {
                outline: 2px solid var(--blood, #7A1C29);
                outline-offset: -2px;
            }
            .pnl-cap-col { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
            .pnl-cap-lbl {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 8px;
                font-weight: 500;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: #333F51;
                white-space: nowrap;
            }
            .pnl-cap-val {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 13px;
                font-weight: 700;
                font-variant-numeric: tabular-nums !important;
                color: var(--ink, #0E1420);
                white-space: nowrap;
            }
            .pnl-cap-val--secondary { font-size: 12.5px; font-weight: 600; color: var(--ink-2, #4A5464); }
            .pnl-cap-val--health { font-size: 12.5px; color: var(--win, #186B4A); }

            /* Scroll Wrapper */
            .pnl-body-wrap {
                position: relative;
                flex: 1;
                min-height: 0;
                display: flex;
                flex-direction: column;
            }
            .pnl-body {
                flex: 1;
                overflow-y: auto;
                padding: 12px 0;
                box-sizing: border-box;
            }
            .pnl-body::-webkit-scrollbar { width: 4px; }
            .pnl-body::-webkit-scrollbar-track { background: transparent; }
            .pnl-body::-webkit-scrollbar-thumb { background: var(--rule, #DCD5C6); }

            .pnl-scroll-mask {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 32px;
                background: linear-gradient(to bottom, transparent, var(--paper, #FFFDF9));
                pointer-events: none;
                transition: opacity 200ms ease;
                z-index: 10;
            }
            .pnl-scroll-mask.at-bottom { opacity: 0; }

            .pnl-section-label {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.16em;
                color: #333F51;
                padding: 14px 20px 6px;
            }

            .pnl-nav-group-header {
                position: sticky;
                top: 0;
                z-index: 5;
                background: var(--paper, #FFFDF9);
                border-bottom: 1px solid var(--rule-light, #EFECE6);
            }

            /* Nav & Account Links */
            .pnl-nav-link, .pnl-acct-link {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                box-sizing: border-box;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                letter-spacing: 0.08em;
                text-transform: uppercase;
                text-decoration: none;
                text-align: left;
                background: transparent;
                border: none;
                border-right: 3px solid transparent !important;
                border-left: none !important;
                color: var(--ink, #0E1420);
                cursor: pointer;
                transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
                outline: none;
            }
            @media (max-width: 767px) {
                .pnl-nav-link, .pnl-acct-link { min-height: 44px; padding: 10px 24px 10px 20px; font-size: 12px; }
            }
            @media (min-width: 768px) {
                .pnl-nav-link, .pnl-acct-link { min-height: 36px; padding: 8px 24px 8px 20px; font-size: 11.5px; }
            }

            @media (hover: hover) {
                .pnl-nav-link:hover, .pnl-acct-link:hover {
                    background: rgba(122, 28, 41, 0.025);
                    color: var(--blood, #7A1C29);
                }
            }

            .pnl-nav-link.active, .pnl-acct-link.active {
                border-right: 3px solid var(--blood, #7A1C29) !important;
                border-left: none !important;
                background: rgba(122, 28, 41, 0.05) !important;
                color: var(--blood, #7A1C29) !important;
                font-weight: 700;
            }
            .pnl-nav-link:focus-visible, .pnl-acct-link:focus-visible, .pnl-subnav-link:focus-visible {
                outline: 2px solid var(--blood, #7A1C29);
                outline-offset: -2px;
            }

            .pnl-subnav {
                display: none;
                flex-direction: column;
                background: rgba(14, 20, 32, 0.015);
                padding: 4px 0;
            }
            .pnl-nav-group.expanded .pnl-subnav { display: flex; }
            .pnl-chevron { transition: transform 200ms ease; color: var(--ink-3, #6E7686); margin-right: 4px; }
            .pnl-nav-group.expanded .pnl-chevron { transform: rotate(180deg); }

            .pnl-subnav-link {
                display: flex;
                align-items: center;
                padding: 8px 24px 8px 36px;
                min-height: 36px;
                font-family: var(--display, 'Archivo', sans-serif);
                font-size: 13px;
                font-weight: 500;
                color: var(--ink-2, #4A5464);
                text-decoration: none;
                border-left: 1px solid var(--rule, #DCD5C6);
                border-right: none !important;
                margin-left: 20px;
                transition: color 150ms ease, border-color 150ms ease;
                box-sizing: border-box;
            }
            @media (hover: hover) {
                .pnl-subnav-link:hover { color: var(--blood, #7A1C29); border-left-color: var(--blood, #7A1C29); }
            }
            .pnl-subnav-link.active {
                color: var(--blood, #7A1C29) !important;
                font-weight: 700 !important;
                border-left: 1px solid var(--blood, #7A1C29) !important;
                background: transparent !important;
            }

            .pnl-divider { height: 1px; background: var(--rule, #DCD5C6); margin: 12px 20px; }
            .pnl-signout-row { color: var(--ink-3, #6E7686); }
            .pnl-signout-row:hover { color: var(--blood, #7A1C29) !important; }

            .pnl-connect-section {
                padding: 16px 20px;
                border-top: 1px solid var(--rule, #DCD5C6);
                background: var(--paper-deep, #E7E1D4);
            }
            .pnl-connect-btn {
                width: 100%;
                min-height: 44px;
                background: var(--blood, #7A1C29);
                color: #FFF8F5;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                border: none;
                border-radius: var(--r, 2px);
                cursor: pointer;
                transition: background 150ms ease;
            }
            .pnl-connect-btn:hover { background: #54111B; }

            .pnl-footer {
                border-top: 1px solid var(--rule, #DCD5C6);
                padding: 14px 20px;
                background: var(--paper-deep, #E7E1D4);
                flex-shrink: 0;
            }
            .pnl-status-bar { display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; }
            .pnl-status-left { display: flex; align-items: center; gap: 8px; }
            .pnl-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--win, #186B4A); }
            .pnl-status-text {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: var(--ink, #0E1420);
            }
            .pnl-meta {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px 16px;
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px dotted var(--rule, #DCD5C6);
                transition: max-height 200ms ease, opacity 200ms ease;
            }
            @media (max-width: 767px) {
                .pnl-meta.collapsed { display: none; }
            }
            .pnl-meta-item { display: flex; flex-direction: column; gap: 2px; }
            .pnl-meta-label {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 8.5px;
                font-weight: 500;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: #333F51;
            }
            .pnl-meta-value {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px;
                font-weight: 600;
                color: var(--ink, #0E1420);
            }
            .pnl-legal {
                display: flex;
                gap: 14px;
                margin-top: 12px;
                padding-top: 10px;
                border-top: 1px solid var(--rule, #DCD5C6);
            }
            .pnl-legal a {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 9.5px;
                color: #333F51;
                text-decoration: none;
            }
            .pnl-legal a:hover { color: var(--blood, #7A1C29); }

            @media (prefers-reduced-motion: reduce) {
                .pnl-drawer, .pnl-overlay, .pnl-subnav, .pnl-chevron, .pnl-scroll-mask, .ch-hamburger-icon span {
                    transition: none !important;
                    animation: none !important;
                }
            }
        </style>

        <header class="ch-header">
            <div class="ch-header-inner">
                <!-- Left Group: Signature Wordmark + Current-Section Location Indicator -->
                <div class="ch-left">
                    <a href="#" onclick="window.router.navigate('/'); return false;" class="ch-logo-wordmark">
                        COLLATERAL
                    </a>
                    <div class="ch-section-divider"></div>
                    <span class="ch-section-label">${sectionLabel || 'MARKET'}</span>
                </div>

                <!-- Right Group: Left-Aligned Paired Columns + Sign In + Separated Menu Cluster -->
                <div class="ch-right">
                    <!-- Paired Capital & Health Columns (Interactive link to /funding, Desktop only) -->
                    <div class="ch-capital-btn" 
                         id="header-capital-area" 
                         onclick="window.router.navigate('/funding')" 
                         tabindex="0"
                         role="button"
                         aria-label="View Account Capital: $2,500 Available Balance, Health 98.4% Healthy"
                         title="Margin Threshold: 80% min health required"
                         style="${isFunding ? 'display: none !important;' : ''}">
                        <div class="ch-cap-col">
                            <span class="ch-cap-lbl">AVAILABLE BALANCE</span>
                            <span id="header-avail-cap" class="ch-cap-val">$2,500</span>
                        </div>
                        <div class="ch-cap-col">
                            <span class="ch-cap-lbl">HEALTH</span>
                            <span id="header-health-cap" class="ch-cap-val ch-cap-val--health">98.4%</span>
                        </div>
                    </div>

                    <!-- Signed-Out Header Sign-In Button -->
                    <button class="ch-connect-btn" id="btn-auth" onclick="window.app.openAccessModal()" style="display:none;">SIGN IN</button>

                    <!-- Signed-In Avatar Status Indicator (Separated by Thin Rule) -->
                    <div class="ch-trigger-avatar-indicator" id="header-avatar-trigger" style="display:none;" title="Signed In Account">
                        <span id="header-avatar-initial">U</span>
                        <img id="header-avatar-img" class="ch-trigger-img" alt="" />
                    </div>
                    <div class="ch-avatar-divider" id="header-avatar-divider" style="display:none;"></div>

                    <!-- Unboxed Menu Trigger Button -->
                    <button id="mobile-menu-btn" 
                            onclick="window.app.toggleMobileMenu()" 
                            class="ch-account-trigger" 
                            aria-label="Toggle Navigation & Account Menu"
                            aria-expanded="false"
                            aria-controls="mobile-menu">
                        <span class="ch-menu-label">MENU</span>
                        <div class="ch-hamburger-icon">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </button>
                </div>
            </div>
        </header>

        <!-- Scrim Overlay -->
        <div id="mobile-menu-overlay" class="pnl-overlay" onclick="window.app.closeMobileMenu()"></div>

        <!-- Universal Single-Surface Navigation Drawer -->
        <aside id="mobile-menu" 
               class="pnl-drawer" 
               role="dialog" 
               aria-modal="true" 
               aria-label="Navigation & Account Menu">
            
            <div class="pnl-header">
                <span class="pnl-header-title">Menu</span>
                <button onclick="window.app.closeMobileMenu()" class="pnl-close" aria-label="Close menu">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>

            <!-- Profile Card -->
            <div id="mobile-user-section" class="pnl-user" style="display:none;">
                <div class="pnl-user-badge">
                    <span class="pnl-user-initial" id="mobile-menu-initial">U</span>
                    <img class="pnl-user-avatar" id="mobile-menu-avatar" alt="" />
                </div>
                <div class="pnl-user-info">
                    <span class="pnl-user-name" id="mobile-menu-username">@user</span>
                    <span class="pnl-user-role">VERIFIED OPERATOR &middot; TIER 1</span>
                </div>
            </div>

            <!-- Capital Summary Block -->
            <div id="mobile-capital-summary" 
                 class="pnl-capital-summary" 
                 onclick="window.app.closeMobileMenu(); window.router.navigate('/funding');" 
                 tabindex="0"
                 role="button"
                 aria-label="View Account Capital details"
                 title="Margin Threshold: 80% min health required for active commitments"
                 style="display:none;">
                <div class="pnl-cap-col">
                    <span class="pnl-cap-lbl">AVAILABLE</span>
                    <span class="pnl-cap-val">$2,500</span>
                </div>
                <div class="pnl-cap-col">
                    <span class="pnl-cap-lbl">IN ESCROW</span>
                    <span class="pnl-cap-val pnl-cap-val--secondary">$633,600</span>
                </div>
                <div class="pnl-cap-col">
                    <span class="pnl-cap-lbl">HEALTH <span style="font-size:7.5px; color:var(--win, #186B4A); font-weight:700;">HEALTHY</span></span>
                    <span class="pnl-cap-val pnl-cap-val--health">98.4%</span>
                </div>
            </div>

            <!-- Body Wrapper -->
            <div class="pnl-body-wrap">
                <div class="pnl-body" id="pnl-body-scroll">
                    <nav aria-label="Navigation & Account Menu">
                        
                        <!-- NAVIGATION Group (Single surface across ALL screen sizes) -->
                        <div id="drawer-nav-group">
                            <div class="pnl-section-label">NAVIGATION</div>

                            <!-- MARKET Group -->
                            <div class="pnl-nav-group ${isMarket ? 'expanded' : ''}">
                                <div class="pnl-nav-group-header">
                                    <button class="pnl-nav-link ${isMarket ? 'active' : ''}" 
                                            onclick="window.app.toggleNavSection(this); return false;"
                                            aria-expanded="${isMarket ? 'true' : 'false'}"
                                            aria-controls="subnav-market"
                                            ${isMarket ? 'aria-current="page"' : ''}>
                                        <span>MARKET</span>
                                        <svg class="pnl-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>
                                    </button>
                                </div>
                                <div class="pnl-subnav" id="subnav-market">
                                    <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/market'); return false;" class="pnl-subnav-link ${(currentRoute === '/market' && !window.location.search.includes('type=rivalry')) ? 'active' : ''}">Solo Contracts</a>
                                    <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/market?type=rivalry'); return false;" class="pnl-subnav-link ${(currentRoute === '/market' && window.location.search.includes('type=rivalry')) ? 'active' : ''}">Rivalry Contracts</a>
                                </div>
                            </div>

                            <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/my-contracts'); return false;" class="pnl-nav-link ${isActiveContracts ? 'active' : ''}" ${isActiveContracts ? 'aria-current="page"' : ''}>ACTIVE</a>
                            <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/ledger'); return false;" class="pnl-nav-link ${isLedger ? 'active' : ''}" ${isLedger ? 'aria-current="page"' : ''}>LEDGER</a>
                            <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/sources'); return false;" class="pnl-nav-link ${isSources ? 'active' : ''}" ${isSources ? 'aria-current="page"' : ''}>SOURCES</a>

                            <div class="pnl-nav-group ${isProtocol ? 'expanded' : ''}">
                                <div class="pnl-nav-group-header">
                                    <button class="pnl-nav-link ${isProtocol ? 'active' : ''}" 
                                            onclick="window.app.toggleNavSection(this); return false;"
                                            aria-expanded="${isProtocol ? 'true' : 'false'}"
                                            aria-controls="subnav-protocol"
                                            ${isProtocol ? 'aria-current="page"' : ''}>
                                        <span>PROTOCOL</span>
                                        <svg class="pnl-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>
                                    </button>
                                </div>
                                <div class="pnl-subnav" id="subnav-protocol">
                                    <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/protocol?tab=overview'); return false;" class="pnl-subnav-link ${window.location.search.includes('tab=overview') ? 'active' : ''}">Overview</a>
                                    <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/protocol?tab=vision'); return false;" class="pnl-subnav-link ${window.location.search.includes('tab=vision') ? 'active' : ''}">Vision</a>
                                    <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/protocol?tab=whitepaper'); return false;" class="pnl-subnav-link ${window.location.search.includes('tab=whitepaper') ? 'active' : ''}">Whitepaper</a>
                                    <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/protocol?tab=economics'); return false;" class="pnl-subnav-link ${window.location.search.includes('tab=economics') ? 'active' : ''}">Economics</a>
                                </div>
                            </div>

                            <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/protocol?tab=terminal'); return false;" class="pnl-nav-link ${isCustodyTerminal ? 'active' : ''}" ${isCustodyTerminal ? 'aria-current="page"' : ''}>CUSTODY TERMINAL</a>
                            <div class="pnl-divider"></div>
                        </div>

                        <!-- ACCOUNT Group -->
                        <div id="mobile-account-links" style="display:none;">
                            <div class="pnl-section-label">ACCOUNT</div>
                            <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/profile'); return false;" class="pnl-acct-link ${isProfile ? 'active' : ''}" ${isProfile ? 'aria-current="page"' : ''}>PROFILE</a>
                            <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/referrals'); return false;" class="pnl-acct-link ${isReferrals ? 'active' : ''}" ${isReferrals ? 'aria-current="page"' : ''}>REFERRALS</a>
                            <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/funding'); return false;" class="pnl-acct-link ${isFunding ? 'active' : ''}" ${isFunding ? 'aria-current="page"' : ''}>ACCOUNT CAPITAL</a>
                            <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/docs'); return false;" class="pnl-acct-link ${isDocs ? 'active' : ''}" ${isDocs ? 'aria-current="page"' : ''}>DOCUMENTATION</a>

                            <!-- De-emphasized Plain Sign Out Row -->
                            <button id="pnl-signout-btn" onclick="window.app.closeMobileMenu(); window.app.handleSignOut()" class="pnl-acct-link pnl-signout-row" style="display:none;">
                                <span>SIGN OUT</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            </button>
                        </div>

                        <!-- Sign In Row -->
                        <div id="mobile-connect-section" class="pnl-connect-section">
                            <button onclick="window.app.closeMobileMenu(); window.app.handleAuthClick()" id="btn-auth-mobile" class="pnl-connect-btn">
                                SIGN IN
                            </button>
                        </div>
                    </nav>
                </div>
                
                <div id="pnl-scroll-mask" class="pnl-scroll-mask"></div>
            </div>

            <!-- Footer -->
            <div class="pnl-footer">
                <div class="pnl-status-bar" onclick="window.app.toggleFooterMeta()">
                    <div class="pnl-status-left">
                        <div class="pnl-status-dot"></div>
                        <span class="pnl-status-text">ALL SYSTEMS OPERATIONAL</span>
                    </div>
                    <svg id="pnl-footer-chevron" class="pnl-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>

                <div id="pnl-footer-meta" class="pnl-meta collapsed">
                    <div class="pnl-meta-item">
                        <span class="pnl-meta-label">Protocol</span>
                        <span class="pnl-meta-value">v1.0</span>
                    </div>
                    <div class="pnl-meta-item">
                        <span class="pnl-meta-label">Network</span>
                        <span class="pnl-meta-value">Mainnet</span>
                    </div>
                    <div class="pnl-meta-item">
                        <span class="pnl-meta-label">Settlement</span>
                        <span class="pnl-meta-value">USD</span>
                    </div>
                    <div class="pnl-meta-item">
                        <span class="pnl-meta-label">Uptime</span>
                        <span class="pnl-meta-value">99.9%</span>
                    </div>
                </div>

                <div class="pnl-legal">
                    <a href="/terms" onclick="window.app.closeMobileMenu()">Terms</a>
                    <a href="/docs" onclick="window.app.closeMobileMenu()">Docs</a>
                    <a href="https://x.com/collaboralcap" target="_blank" rel="noopener">X / Twitter</a>
                </div>
            </div>
        </aside>
    `;
}

export function initScrollEffects() {
    const revealEls = document.querySelectorAll('[data-reveal]');
    if (revealEls.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        revealEls.forEach(el => observer.observe(el));
    }
}
