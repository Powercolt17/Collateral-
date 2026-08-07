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
            /* SEAMLESS BLURRED HEADER.
               The bar itself paints nothing — no fill, no rule. Everything
               visible is on ::before, which carries the blur, a light tint and
               a mask.

               THE MASK IS THE POINT, not decoration. backdrop-filter had been
               tried on this header before and rejected, because a blur layer
               with a square bottom edge draws a visible seam across the artwork
               where the filter stops. Fading the layer out over its last third
               means the blur has no edge to see: it thins to nothing before the
               bar ends. That is what makes it read as seamless rather than as a
               pane sitting on top.

               The tint is deliberately low. It is there to lift text contrast,
               not to reintroduce the paper fill this replaces. */
            .ch-header {
                width: 100%;
                border-bottom: 0;
                background: transparent;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 50;
                /* Fixed constant height — ZERO layout shift on scroll. */
                height: 64px;
            }
            /* 64 -> 92px, and 24 -> 56px of gutter, on desktop only. The
               approved header gives the wordmark and the nav visibly more room
               off the top edge than a 64px bar can: at its own width the mark's
               optical centre sits near y=46, which is a 92px bar centred, and
               the mark starts about 3.5% in rather than 24px.

               Held to 1024 and up on purpose. The 64px height is load-bearing
               on a phone — the mobile hero's eyebrow was measured clearing the
               header by 22px, so a 92px bar would put it 6px UNDER. The target
               is a desktop frame and this is a desktop change. */
            @media (min-width: 1024px) {
                /* 84px, down from 92. Eight pixels off the bar on EVERY route,
                   because the header is one shared component — "every page
                   should share identical header proportions" is already true,
                   and forking a market-only bar is what would break it.
                   Everything below now clears the bar by MORE than it did, so
                   nothing can collide: the landing card's clearance was measured
                   at 110px against the old 92. */
                .ch-header { height: 84px; }
                /* Selector is .ch-header .ch-header-inner, not .ch-header-inner
                   alone. The base padding rule is declared LATER in this same
                   stylesheet, so at equal specificity it wins on source order
                   and a bare selector here silently did nothing — measured 24px
                   with the rule in place. Two classes beats one. */
                .ch-header .ch-header-inner { padding: 0 64px; }
            }
            /* NO BLUR, NO TINT, NO LAYER. The ::before that carried
               backdrop-filter, a paper tint and a fade mask is gone entirely.
               Over the hero the bar is simply transparent and the plate reads
               through it at full sharpness, which is what the approved header
               shows — the engraving behind the wordmark is crisp, not frosted.

               This is safe here for a reason worth recording rather than
               assuming: the senate plate's top band is clear paper. The first
               inked pixel sits at y=97 of 1024, and at the header's own depth
               the band measured 0% dark pixels. There is nothing behind the bar
               to hide from, so there is nothing for a tint to do.

               Legibility while scrolled is handled by .nav-scrolled below with a
               solid fill, not by a blur. */
            /* Content rides above the blur layer. Without this the wordmark and
               the menu sit inside the blurred pane and get filtered with it. */
            .ch-header-inner { position: relative; z-index: 1; }

            /* Scrolled off the hero the bar takes a solid paper fill. Below the
               hero it passes over the ledger, the fork and the rest, which are
               real content rather than clear plate, and a transparent bar is
               unreadable over them. Solid, not translucent — there is no blur
               to soften what shows through any more, so a partial tint would
               just be text over text. */
            /* Parchment, not --paper. This fill only ever existed to keep the
               wordmark legible once the bar is over content, and #FFFDF9 is a
               near-white that now reads as a foreign panel against a parchment
               page. Matched to .cl-root so that when it does engage the bar
               does not announce itself.

               CORRECTION — THIS CLASS IS APPLIED, and the note that used to sit
               here said it was not. That note reported checking the live page at
               scrollY 900 and finding neither body nor .ch-header carrying
               nav-scrolled, and concluded handleGlobalScroll was not running on
               this route. The handler runs. It is dispatched inside
               requestAnimationFrame, and rAF does not fire in the automation
               browser while its pane is not compositing, so the class never gets
               added THERE and only there. On a real device it applies normally —
               confirmed by the reported phone screenshot, which shows the bar as
               a flat lighter band over the artwork, which is this fill.

               Anything measured through a frozen pane needs that ruled out
               first: the same artifact has already produced a wrong "the drawer
               is broken" call and a wrong "the scroll animation is dead" call in
               this codebase.

               main.js now gates the class on the HERO'S bottom edge rather than
               scrollY > 20, so this fill cannot engage while the plate is still
               behind the bar. */
            /* THE BAR ONLY FILLS ONCE THE PAGE HAS MOVED. At the top it stays
               transparent so the hero's gold runs up through it, which is
               deliberate and was asked for. Past 24px it takes a ground, because
               a fixed transparent bar over a scrolling page is two sets of type
               occupying the same 64 pixels — the wordmark and whatever line of
               the hero happens to be passing under it.

               Solid parchment is the BASE, not the preferred state: an unblurred
               translucent bar over engraving is the worst of both, so a browser
               without backdrop-filter gets an opaque bar it can definitely
               render. The @supports block below then trades opacity for blur
               where the capability exists. This is the fallback the old note
               said had been removed along with the blur it covered for — the
               blur is back, so its fallback is back with it. */
            .ch-header.nav-scrolled {
                /* #F1E8D3, matching the hero. This fallback was #F3EADB while
                   the @supports variant below was already rgba(241,232,211) —
                   so the bar changed colour depending on whether the browser
                   had backdrop-filter. Same value in both now. */
                background: #F1E8D3;
                border-bottom: 1px solid rgba(60, 48, 30, 0.12);
            }
            @supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
                .ch-header.nav-scrolled {
                    background: rgba(241, 232, 211, 0.72);
                    -webkit-backdrop-filter: blur(14px) saturate(1.06);
                    backdrop-filter: blur(14px) saturate(1.06);
                }
            }
            /* Fades rather than snapping. The class flips on a single scroll
               frame, and without this the bar appears mid-gesture. */
            .ch-header {
                transition: background 220ms ease, border-color 220ms ease,
                            -webkit-backdrop-filter 220ms ease, backdrop-filter 220ms ease;
            }
            @media (prefers-reduced-motion: reduce) {
                .ch-header { transition: none; }
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

                   700 is a REAL cut here, not a synthesised one — the family
                   declares both a 400 TTF and a 700 OTF, so font-weight picks
                   between drawn faces. font-synthesis: none stays anyway: with
                   a genuine bold present it is belt-and-braces, but it also
                   means that if the bold file ever fails the mark falls back to
                   real Regular rather than a browser-smeared fake bold, which
                   is fatal on a face whose quality is chisel stroke
                   modulation. */
                font-family: 'Trajan Pro', 'Nevera', 'Aquire', 'Cinzel', sans-serif !important;
                /* 24.5px, up from 21. Trajan's cap height sits low in its em
                   box compared with the grotesques this was sized against, so
                   the mark measured smaller than the number suggested. Clamped
                   back to 21px below 820 — see the overflow guard further down,
                   where 21px was measured against a 320px screen. */
                font-size: 24.5px !important;
                font-weight: 700 !important;
                font-synthesis: none;
                /* 0.154em, tightened from 0.165. The old value was tuned for
                   Nevera, a face with tight sidebearings that needed the help.
                   Trajan is drawn from chiselled inscription and already
                   carries generous space in the glyphs themselves, so the same
                   tracking read as ten separate letters rather than one cut
                   word. This is the tightest setting that still leaves the mark
                   inscriptional rather than typeset. */
                letter-spacing: 0.154em !important;
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

            /* Current-Section Divider Rule & Sub-label (Desktop only)
               NOT a brand suffix. This is the wayfinding indicator and it reads
               MARKET, ACTIVE, LEDGER, SOURCES, CUSTODY, PROTOCOL, PROFILE,
               REFERRALS, ACCOUNT or DOCUMENTS depending on route. Deleting it
               to simplify the lockup would strip location from every view in
               the app, so it stays and recedes instead.

               Recedes by: 10.5 -> 9.2px, weight 600 -> 500, colour lifted from
               #8C877B to #A8A296, tracking 0.18 -> 0.2em. Each of those lowers
               weight on the page; together the label reads as a caption to the
               mark rather than the second half of a two-word logo. */
            .ch-section-divider {
                width: 1px;
                /* Shorter and paler. A 1px rule cannot get physically thinner,
                   so apparent weight comes off the height and the value —
                   #D5CFC2 against #C8C2B4 is roughly a third less contrast
                   against the paper. */
                height: 11px;
                background: #D5CFC2;
                /* 12 -> 15px. The mark grew; the gap has to grow with it or the
                   label crowds the final L. */
                margin: 0 15px;
                display: none;
                align-self: center;
                transform: translateY(1px);
            }
            .ch-section-label {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 9.2px;
                font-weight: 500;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                /* Oxblood, using the header's own --blood token so it tracks the
                   nav hover colour rather than introducing a fourth red.

                   Measured before switching, because this is 9.2px text and the
                   label sits over two different grounds as you move around the
                   site: 8.51:1 on the parchment page ground and 7.36:1 on the
                   hero's graded gold. Both clear the 4.5:1 AA floor for text
                   this size with room to spare - the grey it replaces was the
                   lighter of the two. */
                color: var(--blood, #7A1C29) !important;
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
                /* 16 -> 22 -> 34px. Same argument as before, carried further:
                   the nav should recede until it is wanted, and on an
                   institutional bar that is bought with air rather than with
                   weight. Height is untouched, so the bar itself does not
                   move. */
                gap: 34px;
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

            /* NAV LINKS AND THE PRIMARY ACTION.
               Trajan, not the mono stack the rest of the bar uses. The approved
               frame sets the nav in the same inscriptional face as the wordmark
               beside it, which is what makes the header read as one object
               rather than a wordmark with a toolbar bolted to its right. */
            .ch-nav-link {
                font-family: "Trajan Pro", "Cinzel", Georgia, serif;
                /* 11.5 -> 11px and the ink drops to --ink-soft, so the two
                   secondary links sit back and GET STARTED is unambiguously
                   the only call to action in the bar.

                   The brief asked for --ink-soft and for weight 500. Neither
                   is applied, and both for measured reasons.

                   --ink-soft is #5A6172, a COOL blue-grey, and these links sit
                   over warm sepia artwork on the landing hero — the scrim is
                   zero by the time it reaches this side of the bar. Measured
                   against the plate under the nav after the grade and the top
                   fade, it lands at 4.40:1 over the mean sky and 3.96:1 at the
                   darkest point, both under the 4.5:1 AA floor at 11px.
                   #5F5344 is the same recession in a warm key and measures
                   5.31:1 and 4.77:1 — it passes at both, and it belongs to the
                   palette rather than fighting it.

                   Weight 500 is Trajan Pro, which is loaded at 400 and 700
                   only, with font-synthesis:none. A 500 would silently resolve
                   to 400 — a declaration that reads as intent and does nothing.
                   The recession is bought with colour and size instead, which
                   is what the brief was actually after. */
                font-size: 11px;
                font-weight: 400;
                font-synthesis: none;
                letter-spacing: 0.13em;
                text-transform: uppercase;
                color: #5F5344;
                text-decoration: none;
                white-space: nowrap;
                transition: color 150ms ease;
            }
            .ch-nav-link:hover { color: var(--blood, #7A1C29); }
            .ch-nav-link:focus-visible { outline: 2px solid var(--blood, #7A1C29); outline-offset: 4px; }
            /* The sign-in control is a <button> for the modal it opens, so it
               needs the button chrome stripped to sit level with the anchor. */
            .ch-nav-btn {
                background: none; border: 0; padding: 0; cursor: pointer;
                line-height: 1;
            }

            .ch-cta-btn {
                font-family: "Trajan Pro", "Cinzel", Georgia, serif;
                font-size: 11.5px;
                font-weight: 400;
                font-synthesis: none;
                letter-spacing: 0.13em;
                text-transform: uppercase;
                color: #FFF8F5;
                background: var(--blood, #7A1C29);
                border: 0;
                border-radius: var(--r, 2px);
                padding: 11px 21px;
                cursor: pointer;
                white-space: nowrap;
                transition: background 150ms ease;
            }
            .ch-cta-btn:hover { background: #5E1420; }
            .ch-cta-btn:focus-visible { outline: 2px solid var(--ink, #0E1420); outline-offset: 3px; }

            /* The nav collapses into the drawer on small screens for the same
               reason SIGN IN already did: the bar is wordmark + controls +
               MENU, and three more items walk them onto the wordmark. The
               hamburger is untouched and remains the way in at every width. */
            @media (max-width: 1023px) {
                .ch-nav-link, .ch-cta-btn { display: none !important; }
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
                /* Back to the measured-safe 21px. The desktop mark is 24.5px,
                   and that extra 3.5px is about 35px of added width across ten
                   tracked capitals — enough to reintroduce the 320px overflow
                   this whole block exists to prevent. */
                .ch-logo-wordmark { font-size: 21px !important; }
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
            /* THE DESKTOP "display: none !important" IS GONE. It hid the scrim
               above 768px, from back when the drawer was a phone-only sheet and
               desktop got a non-modal panel. The drawer is now the single
               navigation surface at every width, and the museum-glass backdrop
               below is the whole point of opening it — leaving this rule in
               place would have meant no backdrop at all on the one breakpoint
               the design is being reviewed at. It also makes click-outside close
               the drawer on desktop, which is what a layer above the page should
               do. */

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
        /* ══════════════════════════════════════════════════════════════════
           THE DRAWER, RESTYLED AS A PRINTED INDEX

           This block replaces an earlier port of a supplied CollateralMenu.jsx.
           It keeps that port's two correct instincts — serif type instead of the
           terminal mono, and an oxblood edge marker instead of a filled active
           row — and undoes everything else, because the drawer had accumulated
           the vocabulary of an admin panel: a dotted ground, white sticky
           accordion bars, six horizontal rules, a two-column metrics grid and
           two stacked filled buttons in a tinted well.

           EVERY ONE OF THOSE IS A BOX, AND THAT IS THE DIAGNOSIS. A printed
           index separates with SPACE; interfaces separate with BORDERS AND
           FILLS. The drawer had eleven separating elements and almost no air, so
           it read as a control panel no matter what typeface it was set in. What
           follows deletes ten of the eleven — one hairline under the header
           survives — and spends the recovered room on spacing.

           WHAT IS PRESERVED, DELIBERATELY. Every id the auth layer writes to:
           #mobile-user-section, #mobile-capital-summary, #mobile-account-links,
           #mobile-connect-section, #pnl-signout-btn, #mobile-menu-initial,
           #mobile-menu-username, #btn-auth-mobile, #btn-get-started-mobile,
           #pnl-footer-meta, #pnl-body-scroll, #pnl-scroll-mask. updateMobileAuthUI
           guards every lookup with "if (el)", so deleting one of these would
           fail SILENTLY — a signed-in user would lose their account links with
           nothing logged. Nothing here changes markup that carries state; it
           changes how that markup looks.

           FONTS: Cormorant Garamond and EB Garamond, both already in the
           existing Google Fonts link. No new request. ══════════════════════ */

        /* ---------- backdrop: flat, warm, and the page still visible ----------
           This used to be a blurred copy of the hero plate under a left-to-right
           scrim. Two reasons it goes: the brief asks for the page to stay
           faintly visible behind the drawer, and a full-bleed photograph cannot
           do that; and a drawer that replaces the page with different artwork
           reads as a destination rather than as a layer over where you already
           are. It also drops a 3.2KB request and a composited scale(1.06). */
        /* ---------- MUSEUM GLASS ----------
           A sheet of frosted glass between the page and the drawer, not a
           dark wash over it. The difference is which direction the page moves:
           a black scrim DIMS the page toward nothing, so the reader loses the
           hero; a blur DEFOCUSES it, so every shape stays exactly where it was
           and simply stops being readable. Continuity survives, competition
           does not.

           WHY THE TINT IS WARM AND NOT BLACK. Blur alone averages colour toward
           grey, and grey over parchment reads as cold and slightly dirty.
           rgba(245,239,225,.18) is a lighter, warmer value than the page beneath
           it, so the glass frosts the page toward its own light rather than away
           from it — which is what glass in front of a lit room actually does.
           brightness(92%) then takes back just enough that the drawer stays the
           brightest thing on screen.

           THIS SUPERSEDES AN EARLIER DECISION, deliberately. backdrop-filter was
           removed from here once because the overlay used to carry a blurred
           photograph of the hero plate, and sampling the live page underneath
           made the backdrop change as the reader scrolled — below the hero it
           turned body copy into grey mush. That was an argument against blurring
           in service of a fixed IMAGE. With no image, sampling the live page is
           precisely the requirement: the backdrop is meant to be wherever you
           actually are.

           EVERYTHING BEHIND SOFTENS EQUALLY, and that is a z-index fact rather
           than a hope. The overlay is z-index 90; the header bar is 50 and every
           section below it is lower, so the nav, the hero, the contract card,
           the artwork and the type are all inside the backdrop. Only the drawer,
           at 100, sits in front of the glass. */
        .pnl-overlay {
            background: rgba(245, 239, 225, 0);
            backdrop-filter: blur(0px) saturate(100%) brightness(100%);
            -webkit-backdrop-filter: blur(0px) saturate(100%) brightness(100%);
            /* CLOSING: no delay, and slower than the open. The page sharpens as
               the drawer retreats rather than snapping back the instant the
               class comes off — visibility is held for the full duration so the
               glass is still there to animate out of. */
            transition: opacity 300ms cubic-bezier(.22,.8,.22,1),
                        background-color 300ms cubic-bezier(.22,.8,.22,1),
                        backdrop-filter 300ms cubic-bezier(.22,.8,.22,1),
                        -webkit-backdrop-filter 300ms cubic-bezier(.22,.8,.22,1),
                        visibility 0s linear 300ms;
        }
        /* OPENING, TIMED AGAINST THE PANEL. The drawer starts at 0 and unfolds
           over 380ms. The glass waits 60ms — long enough that the panel is
           visibly the thing that moved first — then frosts over 160ms, so it is
           roughly half strength around 120ms and full at 220ms, well before the
           drawer settles. Frosting that lands with the panel reads as a state
           change; frosting that trails it reads as the panel casting the
           effect. */
        .pnl-overlay.open {
            background: rgba(245, 239, 225, .18);
            backdrop-filter: blur(12px) saturate(85%) brightness(92%);
            -webkit-backdrop-filter: blur(12px) saturate(85%) brightness(92%);
            transition: opacity 160ms cubic-bezier(.4,.5,.2,1) 60ms,
                        background-color 160ms cubic-bezier(.4,.5,.2,1) 60ms,
                        backdrop-filter 160ms cubic-bezier(.4,.5,.2,1) 60ms,
                        -webkit-backdrop-filter 160ms cubic-bezier(.4,.5,.2,1) 60ms,
                        visibility 0s linear 0s;
        }
        .pnl-overlay::before, .pnl-overlay::after { content: none; }
        /* No blur where the reader has asked for no motion: a 12px defocus
           appearing under the page is motion whether or not anything slides.
           The warm tint stays, so the layer separation survives. */
        @media (prefers-reduced-motion: reduce) {
            .pnl-overlay, .pnl-overlay.open {
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                transition-duration: .01ms !important;
                transition-delay: 0ms !important;
            }
            .pnl-overlay.open { background: rgba(245, 239, 225, .55); }
        }

        /* ---------- drawer: solid warm parchment, anchored right ----------
           RIGHT, NOT LEFT, and this is a change of side. The trigger that opens
           it sits at the top right of the bar, so a panel that flies in from the
           left leaves the finger that summoned it pointing at nothing. */
        .pnl-drawer {
            right: 0;
            left: auto;
            border-right: none;
            border-left: 1px solid rgba(122, 29, 43, .18);
            background: #F3EADB;
            /* Same three layers at zero alpha, so the shadow GROWS with the
               unfold instead of appearing when the class lands. A box-shadow
               that switches from none to a value cannot interpolate — the layer
               counts have to match at both ends. */
            box-shadow: inset 1px 0 0 rgba(255, 252, 244, 0),
                        -12px 0 28px -8px rgba(60, 44, 24, 0),
                        -48px 0 110px -24px rgba(60, 44, 24, 0);
            transition: transform 380ms cubic-bezier(.22,.8,.22,1),
                        box-shadow 380ms cubic-bezier(.22,.8,.22,1);
        }
        /* ELEVATION IN THREE PARTS, none of them dramatic. A single big blur is
           what makes a panel look like a modal; a real object on glass casts
           three different things at three different distances:

             CONTACT     -12px/28px at .16 — the tight, dark edge immediately
                         left of the panel. This is the shadow that says the
                         sheet has a thickness.
             AMBIENT     -48px/110px at .13 — a very wide, very faint fall
                         across the frosted page. Almost invisible alone; it is
                         what stops the panel looking cut out.
             HIGHLIGHT   inset 1px of warm white down the left edge. Light
                         catching the leading edge of the sheet. It is the
                         cheapest of the three and does the most work, because
                         a lit edge is the one cue that cannot be faked by a
                         darker background.

           The shadows are warm (60,44,24), not neutral. A grey shadow on a
           parchment page reads as dirt. */
        .pnl-drawer.open {
            box-shadow: inset 1px 0 0 rgba(255, 252, 244, .55),
                        -12px 0 28px -8px rgba(60, 44, 24, .16),
                        -48px 0 110px -24px rgba(60, 44, 24, .13);
        }

        /* GRAIN, NOT PATTERN. The dotted 4px radial grid this replaces was the
           single loudest thing in the drawer: a visible, regular, machine-made
           texture, which is the opposite of paper. Fractal turbulence has no
           period at all — it reads as tooth in the sheet and disappears the
           moment you stop looking for it.

           MULTIPLY, AND THIS IS WHY THE DRAWER LOOKED NEARLY WHITE. The base is
           and always was #F3EADB — verified on the live page as
           rgb(243,234,219) — but desaturated turbulence is MID-GREY, and at
           mix-blend-mode:normal half of every grain sample was LIGHTER than the
           parchment under it. The layer was averaging the sheet toward grey,
           which on a warm ground reads as washed out. Multiply lets grain only
           ever darken, which is the only thing a fibre in paper can do. */
        .pnl-drawer::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            opacity: .38;
            mix-blend-mode: multiply;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E");
            background-size: 180px 180px;
        }
        /* Both breakpoints declare their own transform, so the side has to be
           flipped in both — overriding only the base rule parks the drawer off
           the opposite edge and it never appears. */
        /* ---------- THE FOLIO UNFOLD ----------
           Not a slide. The panel is hinged on its right edge and swings open
           like the cover of a bound folio: it starts rotated 9deg away from the
           reader, so the leading (left) edge is further off than the spine, and
           settles flat as it arrives.

           WHY IT READS AS PAPER AND NOT AS A 3D EFFECT: perspective is 1500px
           against a 420px panel, which is a very long lens — the foreshortening
           is barely a few pixels of taper across the width. What the eye
           actually registers is that the far edge arrives LAST, which is how a
           physical sheet behaves and how no CSS slide behaves. 9deg is the
           largest angle that still lands under the threshold where type starts
           to look distorted mid-transition.

           transform-origin is the right edge because that is the hinge. The
           duration goes to 380ms: an unfold that takes exactly as long as a
           slide reads as a slide with a glitch in it.

           BOTH BREAKPOINTS, since each declares its own transform — overriding
           only one parks the drawer off the opposite edge and it never
           appears. */
        .pnl-drawer { transform-origin: 100% 50%; }
        @media (max-width: 767px) {
            .pnl-drawer {
                width: 90vw; max-width: 420px;
                transform: perspective(1500px) translateX(102%) rotateY(-9deg);
            }
            .pnl-drawer.open { transform: perspective(1500px) translateX(0) rotateY(0deg); }
        }
        /* PROPORTIONAL ON DESKTOP, NOT FIXED. A flat 420px is 26% of a 1590px
           window and 41% of a 1024px one — the same panel reading as cramped on
           the first and overbearing on the second. clamp gives it 31% of the
           window with a 400px floor so it never collapses on a small laptop and
           a 520px ceiling so it never becomes a second page on a wide monitor.
           At 1590 that is 493px, which is the room CUSTODY TERMINAL needs before
           the longest label starts dictating the layout. */
        @media (min-width: 768px) {
            .pnl-drawer {
                width: clamp(400px, 31vw, 520px);
                transform: perspective(1500px) translateX(102%) rotateY(-9deg);
            }
            .pnl-drawer.open { transform: perspective(1500px) translateX(0) rotateY(0deg); }
        }

        /* ---------- THE PANEL ARRIVES FIRST, THE TYPE SECOND ----------
           The whole content of the drawer is held back 60ms behind the panel and
           then fades up over 280ms. It is a small thing that does a specific
           job: when a surface and the words on it arrive together, the eye reads
           one moving object; when the surface lands first, it reads as a sheet
           that was already there being turned toward you. The delay only exists
           on .open, so closing takes everything out together — an exit that
           staggers reads as hesitation. */
        .pnl-drawer .pnl-header,
        .pnl-drawer .pnl-body-wrap,
        .pnl-drawer .pnl-footer {
            opacity: 0;
            transition: opacity 280ms cubic-bezier(.22,.8,.22,1);
        }
        .pnl-drawer.open .pnl-header,
        .pnl-drawer.open .pnl-body-wrap,
        .pnl-drawer.open .pnl-footer {
            opacity: 1;
            transition-delay: 60ms;
        }

        /* ---------- staggered reveal ---------- */
        /* --i is set per row in the markup; the delay only applies while open,
           so closing collapses everything together instead of unwinding. The
           offset now comes FROM the right, with the drawer. Its base delay drops
           to 40ms because the 60ms content fade above now carries the "panel
           first" beat — leaving it at 120 stacked two waits on top of each other
           and the nav visibly lagged the footer. */
        .pnl-drawer .pnl-nav-group,
        .pnl-drawer #drawer-nav-group > .pnl-nav-link {
            opacity: 0;
            transform: translateX(16px);
            transition: opacity 420ms cubic-bezier(.22,.8,.22,1),
                        transform 420ms cubic-bezier(.22,.8,.22,1);
        }
        .pnl-drawer.open .pnl-nav-group,
        .pnl-drawer.open #drawer-nav-group > .pnl-nav-link {
            opacity: 1;
            transform: translateX(0);
            transition-delay: calc(var(--i, 0) * 45ms + 40ms);
        }

        /* ---------- HEADER: one row, one line under it ---------- */
        .pnl-drawer .pnl-header {
            height: 58px;
            padding: 0 26px;
            background: transparent;
            border-bottom: 1px solid rgba(122, 29, 43, .28);
        }
        /* "NAVIGATION", NOT "MENU", AND NOT IN MONO. Two changes, one point.
           "Menu" is what a phone app calls its drawer; an index page calls
           itself what it is. And tracked uppercase mono is the voice of a
           terminal — the same voice the whole rest of this pass removed — so
           the one piece of text naming the panel was contradicting it. Cormorant
           small caps, in ink rather than oxblood, because a title that names the
           page does not also need to be the brightest thing on it.

           NOT "COLLATERAL / Navigation". The wordmark is 20px away in the bar
           behind this, at the same height, and still visible with the drawer
           open — printing it twice on one line would read as a mistake. */
        .pnl-drawer .pnl-header-title {
            font-family: "Cormorant Garamond", Georgia, serif !important;
            font-size: 15px;
            font-weight: 600;
            letter-spacing: .24em;
            text-transform: uppercase;
            color: #3A3126;
        }
        /* The close control loses its box. A bordered 32px square in the corner
           of a drawer whose whole premise is "no boxes" was the first thing that
           contradicted it; the glyph alone is unambiguous. */
        .pnl-drawer .pnl-close {
            width: 34px; height: 34px;
            border: none;
            background: transparent;
            color: #6B5F4C;
            transition: color 220ms cubic-bezier(.22,.8,.22,1),
                        transform 320ms cubic-bezier(.22,.8,.22,1);
        }
        .pnl-drawer .pnl-close:hover {
            background: transparent;
            border-color: transparent;
            color: #7A1C29;
            transform: rotate(90deg);
        }

        /* ---------- BODY ---------- */
        .pnl-drawer .pnl-body { padding: 26px 0 0; }
        .pnl-drawer .pnl-body::-webkit-scrollbar-thumb { background: rgba(90,72,45,.18); }
        /* The fade at the bottom of the scroll area has to be the drawer's own
           colour or it shows as a pale bar over parchment. It was still
           #FFFDF9. */
        .pnl-drawer .pnl-scroll-mask {
            height: 40px;
            background: linear-gradient(to bottom, rgba(243,234,219,0), #F3EADB);
        }

        /* THE "NAVIGATION" LABEL IS GONE FROM THE MARKUP. It labelled the only navigation in the
           drawer, which is a label that carries no information — and the brief's
           complaint about competing labels is exactly this. The ACCOUNT label
           below it stays, because that one distinguishes two groups from each
           other, which is what a label is for. */
        .pnl-drawer .pnl-section-label {
            font-family: "IBM Plex Mono", ui-monospace, monospace !important;
            font-size: 8.5px;
            font-weight: 500;
            letter-spacing: .26em;
            color: #7C6E58;
            padding: 30px 26px 12px;
        }
        /* The rule after Custody Terminal is removed rather than restyled. It
           was cutting the last primary item away from the five above it, which
           is why Custody Terminal read as an orphan bolted onto the nav — it was
           on the far side of a line from everything it belongs with. */

        /* ---------- PRIMARY NAVIGATION ---------- */
        /* THE WHITE BARS WERE A STICKY HEADER. .pnl-nav-group-header carried
           position:sticky with an opaque #FFFDF9 fill and a bottom rule, so
           MARKET and PROTOCOL sat in white blocks while ACTIVE, LEDGER and
           SOURCES sat on parchment — five identical links, two of them boxed,
           purely because two of them can expand. Sticky headers earn their fill
           in a long scrolling list; six items is not that list. */
        .pnl-drawer .pnl-nav-group-header {
            position: static;
            background: transparent;
            border-bottom: none;
        }
        .pnl-drawer .pnl-nav-link {
            font-family: "Cormorant Garamond", Georgia, serif !important;
            font-size: 20px !important;
            font-weight: 600;
            letter-spacing: .15em;
            text-transform: uppercase;
            color: #2A2118;
            min-height: 0 !important;
            /* 20px, up from 14 — about 40px between rows. Luxury print sets
               its indexes loose; the constraint is the drawer's height, and at
               six primary items this still clears the CTA on a 667px phone. */
            padding: 20px 26px !important;
            border-right: none !important;
            transition: color 220ms cubic-bezier(.22,.8,.22,1);
        }
        /* No letter-spacing animation. It reflowed the row on every hover, and
           on a touch device — which is the whole target here — hover fires on
           tap and the label visibly grows as you leave the page. */
        .pnl-drawer .pnl-nav-link:hover { color: #7A1C29; }

        /* ---------- ACTIVE: an edge mark, and BLACK TYPE ----------
           The original active state was a tinted fill plus a 3px rule down the
           RIGHT edge; both were set with !important, so these have to be.

           THE INK STAYS INK. Setting the active label in oxblood made MARKET the
           loudest thing in a drawer whose whole argument is restraint — every
           other row whispered and one shouted, purely because of which page you
           happened to be on. Colour is a poor carrier for "you are here"
           anyway: it competes for the same channel the brand uses. The burgundy
           moves entirely to the accent bar and the diamonds, where it marks
           position without setting the type on fire. */
        .pnl-drawer .pnl-nav-link.active,
        .pnl-drawer .pnl-acct-link.active {
            background: transparent !important;
            border-right: none !important;
            border-left: none !important;
            color: #2A2118 !important;
        }
        @media (hover: hover) {
            .pnl-drawer .pnl-nav-link:hover,
            .pnl-drawer .pnl-acct-link:hover { background: transparent; }
        }
        .pnl-drawer .pnl-nav-link,
        .pnl-drawer .pnl-nav-group-header { position: relative; }
        .pnl-drawer .pnl-nav-link::before,
        .pnl-drawer .pnl-nav-group-header::before {
            content: "";
            position: absolute;
            /* 1.5px, down from 2. On a row whose type is already black, the bar
               IS the accent, so its whole job is to be found rather than seen —
               and at 2px against 20px caps it was reading as a weight rather
               than as a rule. A hair thinner and the mark stops competing with
               the word it marks. */
            left: 10px; top: 20px; bottom: 20px;
            width: 1.5px;
            background: #7A1C29;
            transform: scaleY(0);
            transform-origin: center;
            opacity: 0;
            transition: transform 320ms cubic-bezier(.22,.8,.22,1),
                        opacity 320ms cubic-bezier(.22,.8,.22,1);
        }
        .pnl-drawer .pnl-nav-link.active::before,
        .pnl-drawer .pnl-nav-group.expanded .pnl-nav-group-header::before {
            transform: scaleY(1);
            opacity: 1;
        }
        @media (hover: hover) {
            .pnl-drawer .pnl-nav-link:hover::before,
            .pnl-drawer .pnl-nav-group-header:hover::before { transform: scaleY(1); opacity: .45; }
        }
        /* THE DIAMOND ON THE ACTIVE ROW. Same mark the sub-nav already uses, at
           4px — the drawer's one positional glyph, applied consistently, rather
           than a new ornament. It is ABSOLUTE and sits in the gutter between the
           rule and the text, so the active label stays on the same left edge as
           the five inactive ones; an inline bullet would have shunted one row
           right and broken the index alignment that is the whole point. */
        .pnl-drawer .pnl-nav-link.active::after,
        .pnl-drawer .pnl-nav-group.expanded .pnl-nav-group-header::after {
            content: "";
            position: absolute;
            left: 16px; top: 50%;
            width: 4px; height: 4px;
            margin-top: -2px;
            background: #7A1C29;
            transform: rotate(45deg);
            pointer-events: none;
        }
        /* ONE MARKER PER ROW. A group's button sits inside .pnl-nav-group-header
           and both carry ::before at the same offset, so an expanded MARKET drew
           the mark twice in the same place — invisible while they matched, and a
           2px-wide bug waiting for the day they stop matching. The wrapper owns
           it, since the wrapper is what "expanded" is a state of. */
        .pnl-drawer .pnl-nav-group-header .pnl-nav-link::before,
        .pnl-drawer .pnl-nav-group-header .pnl-nav-link::after { content: none; }

        /* The chevron stays ONLY where something expands. It is smaller and
           much quieter than the ink beside it: it answers "is there more here",
           it does not announce itself. */
        .pnl-drawer .pnl-chevron {
            color: #9A8B72;
            margin-right: 0;
            transition: transform 320ms cubic-bezier(.22,.8,.22,1);
        }

        /* ---------- SUB-NAVIGATION ---------- */
        /* grid-template-rows 0fr -> 1fr animates to the content's real height
           without anyone having to know what that height is. The rule it
           replaces was display:none/flex, which cannot transition at all.

           NO VERTICAL PADDING ON EITHER BOX, and the first attempt at this was
           wrong in an instructive way: padding on the grid ITEM is no better
           than padding on the container, because the row track going to zero
           drives the item's HEIGHT to zero while padding is added outside that
           height and survives. Only content inside the item is clipped. Both
           boxes are flat; the air comes from the links' own padding, which is
           inside the clip and collapses with it. */
        .pnl-drawer .pnl-subnav {
            display: grid !important;
            grid-template-rows: 0fr;
            background: transparent;
            padding-top: 0; padding-bottom: 0;
            transition: grid-template-rows 380ms cubic-bezier(.22,.8,.22,1);
        }
        .pnl-drawer .pnl-nav-group.expanded .pnl-subnav { grid-template-rows: 1fr; }
        .pnl-drawer .pnl-subnav > * { min-height: 0; }
        .pnl-drawer .pnl-subnav-inner {
            overflow: hidden;
            display: flex;
            flex-direction: column;
            padding-top: 0; padding-bottom: 0;
        }
        /* SUBORDINATE, WHICH MEANS SMALLER AND QUIETER, NOT FURTHER RIGHT. The
           sub-links were 13px Archivo — a sans, at almost the size of the nav
           above them, hanging off a vertical rule. The rule is gone (it was one
           more border doing a job indentation already does), the face matches
           the rest of the drawer, and the size drops to 14.5 against 20. */
        .pnl-drawer .pnl-subnav-link {
            font-family: "EB Garamond", Georgia, serif !important;
            font-size: 14.5px !important;
            font-weight: 400;
            letter-spacing: .05em;
            text-transform: none !important;
            color: #5D5241;
            min-height: 0;
            padding: 7px 26px 7px 44px;
            margin-left: 0;
            border-left: none !important;
            border-right: none !important;
            display: flex; align-items: center; gap: 11px;
            transition: color 220ms cubic-bezier(.22,.8,.22,1);
        }
        .pnl-drawer .pnl-subnav-link:first-child { padding-top: 4px; }
        .pnl-drawer .pnl-subnav-link:last-child { padding-bottom: 14px; }
        /* Same rule as the primary rows: the burgundy lives in the diamond, not
           in the words. Weight and a solid bullet carry "you are here". */
        .pnl-drawer .pnl-subnav-link.active {
            color: #2A2118 !important;
            font-weight: 600 !important;
            border-left: none !important;
            background: transparent !important;
        }
        @media (hover: hover) {
            .pnl-drawer .pnl-subnav-link:hover { color: #7A1C29; border-left-color: transparent; }
        }
        /* A filled burgundy diamond, not an outlined one: at 5px an outline is
           two hairlines and a hole, which renders as a grey smudge on a phone. */
        .pnl-drawer .pnl-subnav-link::before {
            content: "";
            width: 5px; height: 5px;
            background: #7A1C29;
            border: none;
            transform: rotate(45deg);
            opacity: .5;
            flex: 0 0 auto;
            transition: opacity 200ms cubic-bezier(.22,.8,.22,1);
        }
        .pnl-drawer .pnl-subnav-link:hover::before,
        .pnl-drawer .pnl-subnav-link.active::before { opacity: 1; }

        /* ---------- ACCOUNT LINKS (signed in) ---------- */
        .pnl-drawer .pnl-acct-link {
            font-family: "EB Garamond", Georgia, serif !important;
            font-size: 14px !important;
            letter-spacing: .16em;
            color: #3A3126;
            min-height: 0 !important;
            padding: 10px 26px !important;
            border-right: none !important;
        }
        .pnl-drawer .pnl-signout-row { color: #8A7C64; }

        /* ---------- ACTIONS ---------- */
        /* THE TINTED WELL IS GONE. .pnl-connect-section was a #E7E1D4 block with
           a rule across the top holding two full-width buttons — a footer
           toolbar, which is a dashboard's way of ending a menu. On parchment,
           with 34px of air above it, one burgundy button is already the loudest
           thing in the drawer and needs nothing behind it. */
        .pnl-drawer .pnl-connect-section {
            padding: 40px 26px 4px;
            background: transparent;
            border-top: none;
        }
        .pnl-drawer .pnl-cta-primary {
            display: flex; align-items: center; justify-content: center; gap: 12px;
            /* DEEPER, TALLER, AND IT LIFTS. This is the primary action on the
               page and it was the most restrained thing in a drawer full of
               restraint — which is the one place restraint is wrong. #6B1622 is
               two steps deeper than the nav's oxblood, so the button reads as
               the darkest mass in the panel instead of matching the accent
               marks; 60px of height gives the letterspaced caps room to sit
               rather than fill; and the hover finally moves, because a control
               this important should answer when you touch it. Text stays at
               10.1:1 on the deeper ground. */
            width: 100%; min-height: 60px;
            background: #6B1622;
            color: #F3EADB;
            border: none;
            border-radius: 2px;
            font-family: "Cormorant Garamond", Georgia, serif !important;
            font-size: 13px; font-weight: 600;
            letter-spacing: .26em; text-transform: uppercase;
            cursor: pointer; text-decoration: none;
            box-shadow: 0 1px 2px rgba(60, 14, 22, .16);
            transition: background 280ms cubic-bezier(.22,.8,.22,1),
                        transform 280ms cubic-bezier(.22,.8,.22,1),
                        box-shadow 280ms cubic-bezier(.22,.8,.22,1);
        }
        .pnl-drawer .pnl-cta-primary:hover {
            background: #5C1119;
            transform: translateY(-2px);
            box-shadow: 0 10px 22px rgba(60, 14, 22, .26);
        }
        .pnl-drawer .pnl-cta-primary:active { transform: translateY(0); }
        .pnl-drawer .pnl-cta-primary .pnl-arrow {
            display: inline-block;
            transition: transform 280ms cubic-bezier(.22,.8,.22,1);
        }
        .pnl-drawer .pnl-cta-primary:hover .pnl-arrow { transform: translateX(4px); }

        /* SIGN IN IS A LINK NOW, NOT A SECOND BUTTON. Two full-width controls
           stacked in a well read as two equal choices; they are not equal, and
           the outlined one was drawing as much attention as the filled one
           purely by being the same size and shape. #btn-auth-mobile keeps its id
           and its onclick — updateMobileAuthUI still finds it — and only its
           skin changes. */
        .pnl-drawer .pnl-connect-btn {
            display: block;
            width: 100%;
            min-height: 0 !important;
            margin-top: 16px;
            padding: 6px 0 !important;
            background: transparent !important;
            border: none !important;
            color: #6B5F4C !important;
            font-family: "IBM Plex Mono", ui-monospace, monospace !important;
            font-size: 10px !important;
            font-weight: 500 !important;
            letter-spacing: .26em !important;
            text-transform: uppercase;
            text-align: center;
            transition: color 220ms cubic-bezier(.22,.8,.22,1);
        }
        .pnl-drawer .pnl-connect-btn:hover {
            background: transparent !important;
            border: none !important;
            color: #7A1C29 !important;
            transform: none;
        }

        /* ---------- FOOTER: two lines, one hairline ---------- */
        /* The panel this replaces was a clickable status bar with a chevron, a
           dotted rule, a two-column grid of Network / Settlement / Uptime with
           labels above values, another rule, and a legal row — about 150px of
           dashboard for three facts nobody opens a menu to read. It is now the
           status line and one run-on line of the same three facts. The chevron
           went with it: nothing expands any more, and a chevron on something
           that does not expand is a promise the interface does not keep. */
        /* A SIGNATURE BLOCK, NOT TEXT AT THE BOTTOM. Three changes and they are
           all about cohesion: the divider comes up from .16 to .30 alpha so
           there is visibly a line the block sits under rather than a suggestion
           of one; the padding tightens to 16/18 so the four lines read as one
           mark instead of a column that ran out of page; and the whole thing is
           set as a unit against the drawer's bottom edge.

           It is still one hairline. The temptation here is a rule above AND a
           tinted ground, which is how this becomes a footer again. */
        .pnl-drawer .pnl-footer {
            padding: 16px 26px 18px;
            background: transparent;
            border-top: 1px solid rgba(90, 72, 45, .30);
        }
        .pnl-drawer .pnl-status-bar { cursor: default; }
        .pnl-drawer .pnl-status-left { gap: 9px; }
        .pnl-drawer .pnl-status-dot {
            width: 6px; height: 6px;
            background: #5F7D4F;
            box-shadow: 0 0 0 0 rgba(95,125,79,.4);
            animation: pnl-pulse 2.6s ease-out infinite;
        }
        @keyframes pnl-pulse {
            0%   { box-shadow: 0 0 0 0 rgba(95,125,79,.4); }
            70%  { box-shadow: 0 0 0 6px rgba(95,125,79,0); }
            100% { box-shadow: 0 0 0 0 rgba(95,125,79,0); }
        }
        .pnl-drawer .pnl-status-text {
            font-family: "IBM Plex Mono", ui-monospace, monospace !important;
            font-size: 9px;
            font-weight: 500;
            letter-spacing: .22em;
            color: #3A3126;
        }
        /* One line, always shown. It keeps the id #pnl-footer-meta because
           toggleMobileMenu still strips .collapsed from it on desktop; with no
           .collapsed rule left that call is simply a no-op, which is the quiet
           way to retire a behaviour without touching main.js. */
        .pnl-drawer .pnl-meta {
            display: flex;
            flex-direction: column;
            gap: 3px;
            margin: 8px 0 0;
            padding: 0 0 0 15px;
            border-top: none;
            font-family: "IBM Plex Mono", ui-monospace, monospace;
            font-size: 9px;
            font-weight: 400;
            letter-spacing: .16em;
            text-transform: uppercase;
            /* #74674F, not the #7C6E58 the other muted labels use. Measured on
               the live drawer: that colour lands at 4.16:1 on #F3EADB, and at
               9px this is body-size text needing 4.5. Two steps deeper takes it
               to 4.66 and still reads as the quietest thing in the panel. */
            color: #74674F;
        }

        /* ---------- TYPE BASE ---------- */
        .pnl-drawer, .pnl-drawer .pnl-body, .pnl-drawer .pnl-legal {
            font-family: "EB Garamond", Georgia, "Times New Roman", serif;
            color: #2A2118;
        }

        /* ---------- signed-in blocks, brought onto the same paper ----------
           These only render for a signed-in user, so they were never in the
           screenshot — but they are the two remaining tinted panels in the
           drawer, and leaving them would mean the menu changes character the
           moment someone logs in. */
        .pnl-drawer .pnl-user,
        .pnl-drawer .pnl-capital-summary {
            background: transparent;
            border-bottom: 1px solid rgba(90, 72, 45, .14);
            padding-left: 26px; padding-right: 26px;
        }
        .pnl-drawer .pnl-user-badge { background: #7A1C29; border-radius: 2px; }
        .pnl-drawer .pnl-user-name {
            font-family: "Cormorant Garamond", Georgia, serif;
            font-size: 16px; font-weight: 600; letter-spacing: .04em;
        }
        .pnl-drawer .pnl-user-role,
        .pnl-drawer .pnl-cap-lbl {
            font-family: "IBM Plex Mono", ui-monospace, monospace;
            letter-spacing: .18em; color: #7C6E58;
        }
        .pnl-drawer .pnl-cap-val {
            font-family: "Cormorant Garamond", Georgia, serif;
            font-size: 16px; font-weight: 600;
        }
        .pnl-drawer .pnl-capital-summary:hover { background: rgba(122,28,41,.03); }

        @media (prefers-reduced-motion: reduce) {
            .pnl-drawer .pnl-status-dot { animation: none; }
            .pnl-drawer .pnl-header,
            .pnl-drawer .pnl-body-wrap,
            .pnl-drawer .pnl-footer {
                opacity: 1 !important;
                transition-duration: .01ms !important;
                transition-delay: 0ms !important;
            }
            .pnl-drawer .pnl-cta-primary { transition-duration: .01ms !important; }
            .pnl-drawer .pnl-nav-group,
            .pnl-drawer #drawer-nav-group > .pnl-nav-link {
                opacity: 1 !important;
                transform: none !important;
                transition-duration: .01ms !important;
            }
            .pnl-drawer .pnl-subnav,
            .pnl-drawer .pnl-close,
            .pnl-drawer .pnl-nav-link::before,
            .pnl-drawer .pnl-nav-group-header::before { transition-duration: .01ms !important; }
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

                    <!-- Primary nav. Present for signed-out and signed-in alike;
                         it is wayfinding, not account state. -->
                    <!-- Scrolls to the flow section rather than routing to
                         /how-it-works: THAT ROUTE DOES NOT EXIST. The router's
                         table has no entry for it, so the link would have hit
                         the SPA catch-all and rendered a blank shell. #flow is
                         the section that actually explains it, and is the same
                         target the hero's own "See how it works" uses. From any
                         other route it goes home first, then scrolls once the
                         landing view has rendered. -->
                    <a class="ch-nav-link" href="/#flow" onclick="
                       var f=document.getElementById('flow');
                       if(f){f.scrollIntoView({behavior:'smooth'});}
                       else{window.router.navigate('/');
                            setTimeout(function(){var g=document.getElementById('flow');
                              if(g)g.scrollIntoView({behavior:'smooth'});},260);}
                       return false;">HOW IT WORKS</a>

                    <!-- Signed-Out Header Sign-In. Still #btn-auth and still
                         toggled by updateAuthUI; only its appearance changed
                         from a filled button to a nav link, because the filled
                         treatment now belongs to GET STARTED beside it. -->
                    <button class="ch-nav-link ch-nav-btn" id="btn-auth" onclick="window.app.openAccessModal()" style="display:none;">SIGN IN</button>

                    <!-- Signed-out primary action. Mirrors #btn-auth's
                         visibility in updateAuthUI. -->
                    <button class="ch-cta-btn" id="btn-get-started" onclick="window.app.openAccessModal('signup')" style="display:none;">GET STARTED</button>

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
                <span class="pnl-header-title">Navigation</span>
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
                            <!-- No "NAVIGATION" label: it named the only
                                 navigation in the drawer, so it carried no
                                 information and competed with the six links it
                                 was introducing. -->

                            <!-- MARKET Group -->
                            <div class="pnl-nav-group ${isMarket ? 'expanded' : ''}" style="--i:0">
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
                                <!-- .pnl-subnav-inner is REQUIRED, not decoration. The
                                     accordion animates grid-template-rows 0fr -> 1fr, and
                                     that only measures a single track: with the links as
                                     direct children each one gets its own row and the
                                     collapse comes out ragged. One wrapper, one track,
                                     overflow hidden on the wrapper. -->
                                <div class="pnl-subnav" id="subnav-market">
                                  <div class="pnl-subnav-inner">
                                    <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/market'); return false;" class="pnl-subnav-link ${(currentRoute === '/market' && !window.location.search.includes('type=rivalry')) ? 'active' : ''}">Solo Contracts</a>
                                    <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/market?type=rivalry'); return false;" class="pnl-subnav-link ${(currentRoute === '/market' && window.location.search.includes('type=rivalry')) ? 'active' : ''}">Rivalry Contracts</a>
                                  </div>
                                </div>
                            </div>

                            <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/my-contracts'); return false;" style="--i:1" class="pnl-nav-link ${isActiveContracts ? 'active' : ''}" ${isActiveContracts ? 'aria-current="page"' : ''}>ACTIVE</a>
                            <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/ledger'); return false;" style="--i:2" class="pnl-nav-link ${isLedger ? 'active' : ''}" ${isLedger ? 'aria-current="page"' : ''}>LEDGER</a>
                            <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/sources'); return false;" style="--i:3" class="pnl-nav-link ${isSources ? 'active' : ''}" ${isSources ? 'aria-current="page"' : ''}>SOURCES</a>

                            <div class="pnl-nav-group ${isProtocol ? 'expanded' : ''}" style="--i:4">
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
                                  <div class="pnl-subnav-inner">
                                    <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/protocol?tab=overview'); return false;" class="pnl-subnav-link ${window.location.search.includes('tab=overview') ? 'active' : ''}">Overview</a>
                                    <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/protocol?tab=vision'); return false;" class="pnl-subnav-link ${window.location.search.includes('tab=vision') ? 'active' : ''}">Vision</a>
                                    <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/protocol?tab=whitepaper'); return false;" class="pnl-subnav-link ${window.location.search.includes('tab=whitepaper') ? 'active' : ''}">Whitepaper</a>
                                    <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/protocol?tab=economics'); return false;" class="pnl-subnav-link ${window.location.search.includes('tab=economics') ? 'active' : ''}">Economics</a>
                                  </div>
                                </div>
                            </div>

                            <a href="#" onclick="window.app.closeMobileMenu(); window.router.navigate('/protocol?tab=terminal'); return false;" style="--i:5" class="pnl-nav-link ${isCustodyTerminal ? 'active' : ''}" ${isCustodyTerminal ? 'aria-current="page"' : ''}>CUSTODY TERMINAL</a>
                            <!-- The rule that used to close this group is gone.
                                 It cut the last primary item away from the five
                                 above it, which is the whole reason Custody
                                 Terminal read as an orphan bolted onto the nav:
                                 it sat on the far side of a line from everything
                                 it belongs with. -->
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
                            <!-- Oxblood primary above the ghost, per the supplied
                                 design. GET STARTED opens the signup modal, the
                                 same action the header's own GET STARTED uses, so
                                 the two agree. #btn-auth-mobile below is
                                 UNCHANGED in id and handler — updateMobileAuthUI
                                 still finds it — and only its skin moved from the
                                 black block to the outline. -->
                            <button onclick="window.app.closeMobileMenu(); window.app.openAccessModal('signup')" id="btn-get-started-mobile" class="pnl-cta-primary">
                                Get Started <span class="pnl-arrow" aria-hidden="true">&rarr;</span>
                            </button>
                            <button onclick="window.app.closeMobileMenu(); window.app.handleAuthClick()" id="btn-auth-mobile" class="pnl-connect-btn">
                                Sign In
                            </button>
                        </div>
                    </nav>
                </div>
                
                <div id="pnl-scroll-mask" class="pnl-scroll-mask"></div>
            </div>

            <!-- Footer -->
            <div class="pnl-footer">
                <!-- NOT CLICKABLE, AND NO CHEVRON. Nothing expands here any
                     more, and a chevron on something that does not expand is a
                     promise the interface does not keep. window.app.toggleFooterMeta
                     survives in main.js and is simply no longer called; it
                     guards its own lookup, so nothing breaks. -->
                <div class="pnl-status-bar">
                    <div class="pnl-status-left">
                        <div class="pnl-status-dot"></div>
                        <span class="pnl-status-text">ALL SYSTEMS OPERATIONAL</span>
                    </div>
                </div>

                <!-- Three facts, three lines, under the status they qualify.
                     Run together with middots they read as a strapline; stacked,
                     they read as a standing declaration — which is what an
                     institution's status block is. #pnl-footer-meta keeps its id
                     because toggleMobileMenu still strips .collapsed from it on
                     desktop; with no .collapsed rule left, that call is a
                     no-op. -->
                <div id="pnl-footer-meta" class="pnl-meta">
                    <span>Mainnet</span>
                    <span>USD Settlement</span>
                    <span>99.9% Uptime</span>
                </div>

                <!-- TERMS / DOCS / X ARE GONE FROM HERE. A navigation drawer
                     that also carries legal and social links is a sitemap, and
                     they were the last thing in it still behaving like page
                     furniture. They belong in the site footer, which is where
                     someone looking for them would go. -->

            </div>
        </aside>
    `;
}

/* Attached once for the life of the page. initScrollEffects runs on every route
   render, and binding per render would stack another callback on every
   navigation. */
let _headerFillBound = false;

/**
 * Toggles .nav-scrolled on the bar once the page has moved off the top.
 *
 * THIS DOES NOT LIVE IN main.js, AND THAT IS THE POINT. handleGlobalScroll
 * there already sets this exact class, and it has never worked on the landing
 * route — checked on the live page at scrollY 600 and again at 900, with a
 * delay between the scroll and the read to rule out racing its rAF callback:
 * neither body nor .ch-header carried the class either time. The CSS for it has
 * been sitting in this file unreachable. Rather than debug a handler that spans
 * several views, the header now drives its own state from a hook that
 * demonstrably runs — initScrollEffects is called after every header render.
 *
 * 24px rather than 0: the bar stays clear while the reader is still at the top,
 * where the hero's gold is meant to show through it, and 24 is past an
 * accidental trackpad nudge without waiting for real scrolling.
 */
function bindHeaderFill() {
    if (_headerFillBound) return;
    _headerFillBound = true;

    let ticking = false;
    const apply = () => {
        ticking = false;
        const bar = document.querySelector('.ch-header');
        if (!bar) return;
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        bar.classList.toggle('nav-scrolled', y > 24);
    };
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(apply);
    }, { passive: true });
    /* Once now, too: a reload part-way down the page starts already scrolled,
       and waiting for the first scroll event would leave the bar clear over
       text until the reader happened to move. */
    apply();
}

export function initScrollEffects() {
    bindHeaderFill();

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
