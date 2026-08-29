/**
 * Collateral — Section 02, Contract Primitives.
 *
 * The two contract types rendered as filed instruments rather than as a pair
 * of marketing cards: a form number, a revision, a reference, ruled fields with
 * dotted leaders, fold marks, corner registration brackets, and a wax seal over
 * the verification line.
 *
 * ── THIS REPLACED THE FORK SECTION ───────────────────────────────────────────
 * .fk ("How it settles / Who holds you to it") presented the same Solo/Rivalry
 * choice, so the two together said the same thing twice in different registers.
 * ForkSection.js is left in the tree, unimported, rather than deleted — it is
 * the only copy of the four-step sequence and of the "No judges. No voting.
 * Only the record." inscription, and neither survives anywhere else.
 *
 * Nothing linked to #fk-section — checked across src/ and index.html before
 * removing it — so no anchor broke.
 *
 * ── PORTED MECHANICALLY, NOT BY EYE ──────────────────────────────────────────
 * The source used class names this page already owns: .section, .form, .foot,
 * .kicker, .sub, .mark, .reg, .fold, .r, .t, .b, .ox, .dot, .st, .sh, .yt, a
 * bare h2, and a universal margin/padding reset that would have wiped spacing
 * across the whole document. All 56 classes were renamed to stc-* and every
 * rule scoped under .stc by script, because picking those out by hand is how
 * one gets missed.
 *
 * The reset is deliberately not a scoped universal selector either — that would
 * still strip margins from anything later nested in here. It lists the elements
 * the design actually zeroes.
 *
 * ── WHAT THE SOURCE DID NOT SHIP ─────────────────────────────────────────────
 * No media queries whatsoever. .stc-forms was a hard 1fr 1fr, so on a phone
 * this rendered as two ~150px columns. The mobile pass at the bottom of the
 * stylesheet is added here, not inherited.
 *
 * The certificates keep --paper #F5EDDA, one step lighter than the page. That
 * is the only lighter fill left on the site after the single-document pass, and
 * it is deliberate here: these are sheets lying on a desk, and the corner
 * brackets and fold marks only read against a sheet edge. The section GROUND is
 * the page paper, so nothing boxes.
 *
 * The CTAs are buttons carrying the same auth gate the fork used, in place of
 * the source's href="#".
 */

/** The landing behaviour: gate on auth before contract creation. */
const CTA_ACTION =
    "if(window.app &amp;&amp; window.app.openAccessModal){ window.app.openAccessModal('signup'); } else { window.router.navigate('/signin'); } return false;";

/**
 * @param {object} [o]
 * @param {string} [o.id]          Section id. The Exchange passes "how-it-works"
 *                                 because a button further up that page scrolls
 *                                 to it; the homepage takes the default.
 * @param {string} [o.soloAction]  onclick body for the Solo CTA.
 * @param {string} [o.rivalAction] onclick body for the Rivalry CTA.
 * @param {string} [o.soloLabel]   Solo CTA text.
 * @param {string} [o.rivalLabel]  Rivalry CTA text.
 */
export function renderStructuresSection(o = {}) {
    const id = o.id || 'stc-section';
    const soloLabel = o.soloLabel || 'Review Solo Contract';
    const rivalLabel = o.rivalLabel || 'Review Rivalry Contract';
    const soloAction = o.soloAction || CTA_ACTION;
    const rivalAction = o.rivalAction || CTA_ACTION;
    return `
        <style>
.stc{
    /* --faint carried the form number, the agreement numbers and the revision line
       — the archival register marks, all set at 9px. #B4A98C on this stock is near
       2.1:1, faded past archival into unread. One step to #9A8C6F keeps it clearly
       the quietest tone on the document and leaves the hierarchy against --muted
       intact, but the marks can actually be read. */
    --parch:#F3EADB; --paper:#F5EDDA; --ink:#211B12; --ink-soft:#4E4636;
    --muted:#736750; --faint:#9A8C6F; --ox:#5E1E2E; --ox-deep:#5E1420; --win:#4E6B3E;
    --emblem:#4A3418; --logo:#3A2E1C;
    --line:rgba(70,55,35,.22); --line-soft:rgba(70,55,35,.13); --line-firm:rgba(70,55,35,.30);
    --dot:rgba(70,55,35,.38);
  }
        /* THE RESET HAS TO BE A UNIVERSAL SELECTOR, NOT AN ELEMENT LIST.
           It was first written as an explicit list — .stc h2, .stc p, .stc div,
           .stc span, .stc article — to avoid a blanket universal selector. That
           list is class-plus-element, specificity 0,1,1, which BEATS the
           component's own single-class rules at 0,1,0. So the reset silently
           stripped the padding from .stc-form, .stc-f-titlerow, .stc-f-row and
           everything else it was meant to leave alone: measured, each
           certificate came out 345px instead of ~700px.

           The universal form is 0,1,0. It ties with the component rules and
           loses to them on source order because it is declared first, which is
           what a reset is supposed to do.

           NO BACKTICKS IN THIS COMMENT. It lives inside a template literal, and
           quoting the selector in backticks here terminated the string and took
           the whole page down with an esbuild parse error. */
        .stc,.stc *{box-sizing:border-box;margin:0;padding:0}
        .stc{background:var(--parch);font-family:var(--font-content);color:var(--ink)}
        .stc-mark{width:8px;height:8px;background:var(--ox-deep);transform:rotate(45deg);display:inline-block;position:relative;box-shadow:-.5px -.5px 0 rgba(255,246,228,.45) inset,.6px .6px 1.4px rgba(0,0,0,.30) inset}
        .stc-mark::after{content:"";position:absolute;inset:2px;border:.5px solid rgba(255,246,228,.30)}
        /* embossed corner brackets */
.stc-reg{position:absolute;width:13px;height:13px;border:1.4px solid rgba(70,55,35,.42);opacity:.9;z-index:3}
        .stc-reg::after{content:"";position:absolute;width:13px;height:13px;border:1.4px solid rgba(255,250,235,.5)}
        .stc-reg.stc-tl{border-right:0;border-bottom:0}
        .stc-reg.stc-tl::after{border-right:0;border-bottom:0;left:1px;top:1px}
        .stc-reg.stc-tr{border-left:0;border-bottom:0}
        .stc-reg.stc-tr::after{border-left:0;border-bottom:0;right:1px;top:1px}
        .stc-reg.stc-bl{border-right:0;border-top:0}
        .stc-reg.stc-bl::after{border-right:0;border-top:0;left:1px;bottom:1px}
        .stc-reg.stc-br{border-left:0;border-top:0}
        .stc-reg.stc-br::after{border-left:0;border-top:0;right:1px;bottom:1px}
        .stc-paper-tx::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.06;mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.stc-w3.stc-org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
        .stc-wrap{max-width:1440px;margin:0 auto;padding:64px 64px 48px}
        .stc-kicker{display:inline-flex;align-items:center;gap:13px;font-family:var(--font-data);font-size:11px;letter-spacing:.30em;text-transform:uppercase;color:var(--ox);font-weight:500;margin-bottom:24px}
        .stc-kicker .stc-r{height:1px;width:30px;background:var(--ox);opacity:.75}
        .stc h2{font-family:var(--font-display);font-weight: 400;font-size:52px;line-height:1.0;margin-bottom:20px}
        .stc h2 .stc-ox{color:var(--ox)}
        /* The paragraph measure is the document column, not a round 600. Its right
           edge now falls exactly on the first card's right edge, so the intro is
           hung on the same grid as the instruments beneath it. 44px below is the
           grid gap, so the vertical step matches the horizontal one. */
        .stc-sub{font-size:18px;line-height:1.6;color:#504835;max-width:calc((100% - 44px) / 2);margin-bottom:44px}
        .stc-sub b{color:var(--ink);font-weight:600}
        .stc-forms{display:grid;grid-template-columns:1fr 1fr;gap:44px}
        .stc-form{position:relative;background:var(--paper);border:1px solid var(--line-firm);padding:24px 34px 20px;overflow:hidden;display:flex;flex-direction:column;
    box-shadow:0 16px 34px rgba(60,40,20,.10), inset 0 0 0 1px rgba(255,250,236,.4), inset 0 0 30px rgba(90,68,36,.07)}
        .stc-form::after{content:"";position:absolute;inset:9px;border:1px solid var(--line-soft);pointer-events:none}
        .stc-form .stc-reg.stc-tl{top:15px;left:15px}
        .stc-form .stc-reg.stc-tr{top:15px;right:15px}
        .stc-form .stc-reg.stc-bl{bottom:15px;left:15px}
        .stc-form .stc-reg.stc-br{bottom:15px;right:15px}
        /* faint certificate watermark */
.stc-seal-wm{position:absolute;left:50%;top:56%;transform:translate(-50%,-50%);width:250px;height:250px;opacity:.035;color:var(--emblem);z-index:0;pointer-events:none}
        /* fold marks */
.stc-fold{position:absolute;left:0;right:0;height:1px;background:rgba(70,55,35,.055);box-shadow:0 1px 0 rgba(255,250,235,.45);z-index:1;pointer-events:none}
        .stc-fold.stc-a{top:36%}
        .stc-fold.stc-b{top:69%}
        /* The flex chain runs card -> inner -> foot so the verification footer is
           pushed to the bottom of whichever card is taller. Both documents are
           equal height already (grid stretch), but their descriptions differ by
           a line, so without this the two footers sat on different baselines —
           the one thing that gives away two documents as separately made. */
        .stc-form-in{position:relative;z-index:2;display:flex;flex-direction:column;flex:1;min-height:0}
        .stc-f-head{display:flex;align-items:center;justify-content:space-between}
        .stc-f-agr{font-family:var(--font-data);font-size:9.5px;letter-spacing:.30em;text-transform:uppercase;color:var(--muted);font-weight:500}
        .stc-f-form{font-family:var(--font-data);font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--ox);font-weight:500}
        .stc-rule2{position:relative;height:0;border-top:1px solid var(--line-firm);margin:10px 0 0}
        .stc-rule2::after{content:"";position:absolute;left:0;right:0;top:2px;border-top:1px solid var(--line-soft)}
        .stc-f-titlerow{display:flex;align-items:center;gap:22px;padding:12px 0 10px}
        .stc-f-ico{height:60px;width:auto;flex:none;color:var(--emblem)}
        /* THESE WERE INLINE style="height:66px" / "76px" ON THE IMG.
           An inline style beats any stylesheet rule short of !important, so
           the mobile pass below could never shrink them — the icons would
           have stayed at desktop size on a phone. They are classes now.
           The two differ on purpose: the swords read smaller than the wreath
           at equal height, so they are set larger to match optically. */
        .stc-ico-solo{height:66px}
        .stc-ico-rival{height:76px}
        .stc-f-agr2{font-family:var(--font-data);font-size:9px;letter-spacing:.30em;text-transform:uppercase;color:var(--faint);margin-bottom:9px}
        .stc-f-title{font-family:var(--font-display);font-weight: 400;font-size:37px;line-height:.98;color:var(--ink)}
        .stc-f-desc{font-family:var(--font-data);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--ox);font-weight:500;margin-top:11px}
        .stc-f-refblock{margin-left:auto;text-align:right;font-family:var(--font-data);font-size:9px;letter-spacing:.12em;color:var(--faint);line-height:1.7;align-self:flex-start;padding-top:2px}
        /* SCOPED AS .stc-form .stc-f-body, AT (0,2,0), AND THAT IS THE WHOLE
           POINT OF THE SELECTOR. LandingStyles.js carries
             .cl-root h1, .cl-root h2, .cl-root h3, .cl-root p, ... { margin: 0 }
           at (0,1,1), which beats a bare .stc-f-body at (0,1,0). This card is
           inside .cl-root on the landing page, so the description's bottom
           margin has been computing to ZERO all along — measured 0px on the
           deployed page. Tightening it 24 -> 16 therefore changed nothing; the
           fields were already flush under the copy, which is past tight into
           collided. Two classes wins and the 16px is real. */
        .stc-form .stc-f-body{font-size:15px;line-height:1.46;color:var(--ink-soft);margin:0 0 11px;max-width:430px}
        .stc-f-fields{border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
        .stc-f-row{display:grid;grid-template-columns:112px minmax(0,1fr) 116px;align-items:center;gap:14px;padding:5px 0;border-bottom:1px solid var(--line-soft)}
        .stc-f-row:last-child{border-bottom:0}
        .stc-f-k{font-family:var(--font-data);font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
        .stc-f-lead{height:1px;border-bottom:1.5px dotted var(--dot)}
        .stc-f-v{font-family:var(--font-data);font-size:12.5px;letter-spacing:.02em;color:var(--ink);font-weight:500;text-align:right}
        .stc-f-foot{position:relative;display:flex;flex-direction:column-reverse;gap:9px;margin-top:auto;padding-top:10px}
        /* gap 7, not 14: the picture leaves ~18px beside a 175px seal, which at our
   62px is 6.4. 14 pushed the type away from the wax. */
        .stc-f-sources{display:flex;align-items:center;gap:14px;border-top:1px solid var(--line);padding-top:11px}
        /* The drawn SVG seal was replaced by the photographed one. It is 110x96,
   NOT square, so height is auto — forcing 32x32 as the SVG had would
   squash it. The drop-shadow goes too: the photograph carries its own
   shadow, and stacking a CSS one on top reads as a sticker. */
        /* 32px, DOWN FROM 62, and the 62 was reasoned from a bad reading.
           The note it replaces derived 6.25x cap height from "the supplied
           picture" — but the supplied markup for this section sets the seal at
           32x32 explicitly, and in the reference screenshot the seal is ~34px
           against a card ~880px wide. Scaled to this ~570px card that is under
           30px, not 62.
           The brief is also explicit about intent: 30-34px, "a quiet detail,
           not a focal point", with the engraved emblem at the top of the card as
           the hero mark. At 62 the seal was the second largest object on the
           card and the only saturated one, so the corner took the eye instead of
           the instrument.
           Height only, still auto width: the photograph is 147x128, not square,
           and forcing a square would squash it. */
        /* 30px, and NO drop-shadow, which is where this deliberately stops short
           of the reference. That file draws the seal as an SVG with no shadow of
           its own, so its filter:drop-shadow(0 1px 2px) supplies the only one.
           Ours is a PHOTOGRAPH of wax on a plate and already carries a real
           shadow in its pixels; adding a CSS one stacks a second, differently
           angled shadow on top and the mark starts to read as a sticker laid on
           the card rather than wax pressed into it. The brief says "at most a
           very subtle neutral shadow" — with a photograph that has its own, at
           most is none. */
        .stc-src-seal{width:auto;height:30px;flex:none}
        /* 12px at .10em, DOWN from 15px at .13em, and this fixes an overflow that
   predates the bigger seal. The line is white-space:nowrap and measured
   471px against 465px of usable card width, so even beside the old 30px
   seal the row ran 519px and pushed past the card edge.
   The supplied picture is a 1310px banner; this card is ~570px. The seal can
   only carry the picture's prominence here if the type gives way. Measured
   across five combinations: 62px seal + 12px/.10em totals 442px and clears
   the 465px with 23px to spare; every larger type size overflowed. */
        .stc-src-txt{font-family:var(--font-content);font-size:13.5px;font-weight:600;letter-spacing:.115em;text-transform:uppercase;color:var(--ink-soft);white-space:nowrap}
        .stc-src-txt .stc-dot{color:var(--ox);margin:0 9px}
        .stc-f-action{white-space:nowrap;align-self:flex-end}
        .stc-f-verified{font-family:var(--font-data);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-soft);font-weight:500;display:inline-flex;align-items:center;gap:9px}
        .stc-f-verified .stc-chk{color:var(--win);font-size:12px}
        .stc-f-versrc{display:block;font-family:var(--font-data);font-size:9px;letter-spacing:.06em;color:var(--muted);margin-top:6px}
        /* AN ACTION, NOT A BUTTON. It stays text so the specification rows above
           it remain the loudest thing on the card — a filled control here would
           make the form look like a pricing tier.

           THE UNDERLINE IS ON THE LABEL SPAN, NOT THE BUTTON. A border on the
           button would run under the arrow too and grow by 4px every time the
           arrow moved, which reads as the rule stretching rather than the arrow
           travelling. Wrapping the words means the rule measures the words.

           It is a scaleX transform rather than a border-bottom appearing, so it
           wipes in from the left instead of switching on, and it composites
           rather than triggering layout. 200ms ease-out, inside the 180-220 asked
           for. */
        /* THE CTA CARRIES MORE WEIGHT, AND IS STILL A LINE OF TYPE.
           It sat at 11px/500 in near-ink with a rule that only appeared on
           hover, so at rest it read as one more metadata line in a card full of
           them. It gains about 18% presence the way an engraved document does
           — size, weight and a rule that is always struck — rather than by
           becoming a button: 11 -> 11.6px, 500 -> 600, full ink, and the
           underline sits at rest in the faint line tone and takes the oxblood
           on hover instead of appearing from nothing. */
        .stc-f-action{font-family:var(--font-data);font-size:11.6px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink);font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:10px;padding-bottom:2px;background:none;border:0;cursor:pointer}
        .stc-f-label{position:relative;display:inline-block}
        .stc-f-label::before{content:"";position:absolute;left:0;right:0;bottom:-3px;height:1px;background:var(--line);}
        .stc-f-label::after{content:"";position:absolute;left:0;right:0;bottom:-3px;height:1px;background:var(--ox);
          transform:scaleX(0);transform-origin:left center;transition:transform 200ms ease-out}
        .stc-f-action .stc-a{color:var(--ox);display:inline-block;transition:transform 200ms ease-out}
        .stc-f-action:hover .stc-f-label::after,
        .stc-f-action:focus-visible .stc-f-label::after{transform:scaleX(1)}
        .stc-f-action:hover .stc-a,
        .stc-f-action:focus-visible .stc-a{transform:translateX(4px)}
        /* A visible focus ring rather than the underline alone: the underline is
           also the hover state, so on its own it would not tell a keyboard user
           where focus actually is. Offset outward so it never sits on the type. */
        .stc-f-action:focus-visible{outline:2px solid var(--ox);outline-offset:4px;border-radius:1px}
        @media (prefers-reduced-motion:reduce){
          .stc-f-label::after,.stc-f-action .stc-a{transition:none}
        }
        /* red wax approval stamp */
.stc-wax-stamp{position:absolute;left:50%;bottom:-2px;transform:translateX(-50%) rotate(-7deg);width:52px;height:52px;z-index:4;filter:drop-shadow(0 3px 5px rgba(60,20,25,.30))}
        .stc-foot{display:flex;align-items:center;gap:20px;margin-top:40px;padding:16px 24px;border:1px solid var(--line);background:rgba(250,245,232,.5)}
        .stc-foot .stc-fl{font-family:var(--font-data);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--ox);font-weight:500;white-space:nowrap;display:inline-flex;align-items:center;gap:10px}
        .stc-foot .stc-fi{width:15px;height:15px;border:1px solid var(--ox);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-style:italic;font-family:var(--font-content)}
        .stc-foot .stc-ft{font-size:15px;color:var(--ink-soft);line-height:1.5;flex:1}
        .stc-fsrc{display:flex;align-items:center;gap:18px;white-space:nowrap}
        .stc-fsrc .stc-lbl{font-family:var(--font-data);font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
        .stc-fsrc svg{fill:var(--logo);display:block;opacity:.82}
        .stc-fsrc .stc-st{height:15px}
        .stc-fsrc .stc-sh{height:17px}
        .stc-fsrc .stc-yt{height:13px}

        /* ── MOBILE ──────────────────────────────────────────────────────────
           The source file shipped no media query at all: .stc-forms is a hard
           1fr 1fr, the wrap carries 64px of side padding and the heading is
           52px, so on a phone the two certificates would render as two ~150px
           columns of broken type. Everything below is that missing pass. */
        @media (max-width:1040px){
          .stc-forms{grid-template-columns:1fr;gap:30px}
        }
        /* Vertical rhythm, side gutters and heading size are NOT set here.
           LandingMobile.js sets those for every section at once, with
           !important, so declaring them again would be a second source of
           truth that always loses. This block covers only what is specific
           to the certificates. */
        @media (max-width:820px){
          .stc-sub{font-size:16.5px;line-height:1.6;margin-bottom:34px}
          .stc-kicker{font-size:10px;letter-spacing:.24em;margin-bottom:18px}
          .stc-form{padding:24px 22px 22px}
          .stc-form::after{inset:7px}
          .stc-form .stc-reg.stc-tl{top:12px;left:12px}
          .stc-form .stc-reg.stc-tr{top:12px;right:12px}
          .stc-form .stc-reg.stc-bl{bottom:12px;left:12px}
          .stc-form .stc-reg.stc-br{bottom:12px;right:12px}
          /* The title row is icon + title + reference on one line. On a phone
             the reference block wraps under and the icon comes down. */
          .stc-f-titlerow{gap:16px;padding:20px 0 18px;flex-wrap:wrap}
          .stc-ico-solo{height:44px}
          .stc-ico-rival{height:50px}
          .stc-f-title{font-size:29px}
          .stc-f-refblock{margin-left:0;text-align:left;width:100%;order:3;padding-top:0}
          .stc-form .stc-f-body{font-size:15px;max-width:none;margin-bottom:14px}
          /* 120px of fixed key column leaves almost nothing for the value at
             360px wide, and the dotted leader is the first thing to collapse. */
          .stc-f-row{grid-template-columns:86px 1fr max-content;gap:10px}
          .stc-f-k{font-size:8.5px;letter-spacing:.16em}
          .stc-f-v{font-size:11.5px}
          /* THE LABEL GOES, THE SOURCES STAY. Measured at 320 and 360: the line
             never CLIPS, because white-space:normal lets it wrap — but it wrapped
             to THREE lines beside a 30px seal, standing the strip 79px tall on a
             card two passes were spent shortening. A caption taller than a field
             row is not a caption.
             "Verification Sources" is the redundant half: the seal already says
             this block certifies something, and what the phone reader needs is
             WHICH sources. Dropping the label and its middot leaves
             "Bank / Stripe / YouTube", which is the information. */
          .stc-src-lbl{display:none}
          .stc-src-txt{white-space:normal;letter-spacing:.1em}
          .stc-src-seal{width:auto;height:28px}
          .stc-f-sources{gap:11px}
          /* The footer is a four-across flex row; stacked it stays readable. */
          .stc-foot{flex-direction:column;align-items:flex-start;gap:14px;
            padding:16px 18px;margin-top:30px}
          .stc-foot .stc-ft{font-size:14.5px}
          .stc-fsrc{gap:14px}
        }
        @media (max-width:379px){
          .stc-f-title{font-size:25px}
          .stc-f-row{grid-template-columns:74px 1fr max-content}
        }
        @media (prefers-reduced-motion:reduce){.stc *{transition:none !important}}
        </style>

        <section class="stc" id="${id}" aria-labelledby="stc-title">
<div class="stc-wrap">
    <div class="stc-kicker"><span class="stc-r"></span> Section 02 · Contract Primitives</div>
    <h2 id="stc-title">Contract <span class="stc-ox">structures.</span></h2>
    <p class="stc-sub">Every agreement on the exchange takes one of two forms. Both use verified metrics, hold capital in escrow, and settle automatically. <b>Only the counterparty changes.</b></p>

    <div class="stc-forms">
      <!-- SOLO -->
      <article class="stc-form stc-paper-tx">
        <span class="stc-reg stc-tl"></span><span class="stc-reg stc-tr"></span><span class="stc-reg stc-bl"></span><span class="stc-reg stc-br"></span>
        <span class="stc-fold stc-a"></span><span class="stc-fold stc-b"></span>
        <svg class="stc-seal-wm" viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="2"><circle cx="100" cy="100" r="80"/><circle cx="100" cy="100" r="68"/><text x="100" y="130" font-family="var(--font-content)" font-size="90" font-weight="700" fill="currentColor" stroke="none" text-anchor="middle">C</text></svg>
        <div class="stc-form-in">
          <div class="stc-f-head"><span class="stc-f-agr">Collateral Exchange</span><span class="stc-f-form">Form S · 01</span></div>
          <div class="stc-rule2"></div>
          <div class="stc-f-titlerow">
            <!-- engraved wax seal with ribbons -->
            <!-- THE SOLO MEDALLION, DRAWN RATHER THAN PHOTOGRAPHED.
                 It was a 247px raster of a laurel wreath around a lozenge —
                 generic enough to be any coin, and at 66px its relief blurred
                 into a smudge. It is engraved line work now, which is what the
                 rest of this section is made of, and which holds at any size.

                 Struck like a real instrument: a milled outer rim with beading,
                 an engraved inner field, the Collateral diamond centred with a
                 C cut into it, and EXCHANGE / SOLO lettered around the rim the
                 way an issuing authority is named on a medal. No double-C.
                 Relief is carried by paired strokes — a dark pass and a light
                 pass offset a half pixel — which is how an engraver shows a
                 bevel, rather than by a gradient. -->
            <svg class="stc-f-ico stc-ico-solo" viewBox="0 0 100 100" role="img" aria-label="Collateral Exchange, Solo instrument">
              <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="50" cy="50" r="47" stroke-width="1.6"/>
                <circle cx="50" cy="50" r="43.4" stroke-width=".7" opacity=".55"/>
                <circle cx="50" cy="50" r="34.6" stroke-width="1.15"/>
                <circle cx="50" cy="50" r="32.4" stroke-width=".6" opacity=".5"/>
                <!-- milled beading between the rims -->
                <g stroke-width="1.5" stroke-linecap="round" opacity=".72">
                  <path d="M50 4.2v2.6M50 93.2v2.6M4.2 50h2.6M93.2 50h2.6"/>
                  <path d="M17.6 17.6l1.85 1.85M80.55 80.55l1.85 1.85M82.4 17.6l-1.85 1.85M19.45 80.55l-1.85 1.85"/>
                  <path d="M67.9 5.9l1 2.4M31.1 91.7l1 2.4M94.1 67.9l-2.4 1M8.3 31.1l-2.4 1"/>
                  <path d="M32.1 5.9l-1 2.4M68.9 91.7l-1 2.4M5.9 67.9l2.4 1M91.7 31.1l2.4 1"/>
                </g>
                <!-- the diamond, struck with a bevel -->
                <path d="M50 27.5 72.5 50 50 72.5 27.5 50Z" stroke-width="1.5"/>
                <path d="M50 31.6 68.4 50 50 68.4 31.6 50Z" stroke-width=".65" opacity=".5"/>
                <!-- the C, cut into the field -->
                <path d="M58.2 41.4a11.2 11.2 0 1 0 0 17.2" stroke-width="3.4" opacity=".18"
                      transform="translate(0 .9)"/>
                <path d="M58.2 41.4a11.2 11.2 0 1 0 0 17.2" stroke-width="2.9"/>
                <!-- exergue rules, the line a date or issue is struck on -->
                <path d="M39.5 79.4h21" stroke-width=".9" opacity=".6"/>
              </g>
              <g fill="currentColor" stroke="none" opacity=".8">
                <text x="50" y="16.4" text-anchor="middle" font-size="6.4"
                      style="font-family:var(--font-data);letter-spacing:.22em">EXCHANGE</text>
                <text x="50" y="88.6" text-anchor="middle" font-size="6.4"
                      style="font-family:var(--font-data);letter-spacing:.3em">SOLO</text>
              </g>
            </svg>
            <div>
              <div class="stc-f-agr2">Performance Agreement</div>
              <div class="stc-f-title">Solo Contract</div>
              <div class="stc-f-desc">Stake against your own record</div>
            </div>
            <div class="stc-f-refblock">No. CM·S·0001<br>Rev. 01</div>
          </div>
          <p class="stc-f-body">Stake against your own verified metric. Capital remains locked until settlement. Meet the target and recover your stake with a matched payout. Miss it, and capital settles automatically to the pool.</p>
          <div class="stc-f-fields">
            <div class="stc-f-row"><span class="stc-f-k">Metric</span><span class="stc-f-lead"></span><span class="stc-f-v">Revenue Growth</span></div>
            <div class="stc-f-row"><span class="stc-f-k">Capital</span><span class="stc-f-lead"></span><span class="stc-f-v">From $250</span></div>
            <div class="stc-f-row"><span class="stc-f-k">Settlement</span><span class="stc-f-lead"></span><span class="stc-f-v">Automatic</span></div>
            <div class="stc-f-row"><span class="stc-f-k">Source</span><span class="stc-f-lead"></span><span class="stc-f-v">Stripe API</span></div>
            <div class="stc-f-row"><span class="stc-f-k">Window</span><span class="stc-f-lead"></span><span class="stc-f-v">30 Days</span></div>
          </div>
          <div class="stc-f-foot">
            <span class="stc-f-sources"><img class="stc-src-seal" src="/assets/images/wax-seal-verification.png" alt="" aria-hidden="true" width="147" height="128" decoding="async"><span class="stc-src-txt"><span class="stc-src-lbl">Verification Sources <span class="stc-dot">·</span> </span>Bank / Stripe / YouTube</span></span>
            <button type="button" class="stc-f-action" onclick="${soloAction}"><span class="stc-f-label">${soloLabel}</span> <span class="stc-a" aria-hidden="true">→</span></button>
          </div>
        </div>
      </article>

      <!-- RIVALRY -->
      <article class="stc-form stc-paper-tx">
        <span class="stc-reg stc-tl"></span><span class="stc-reg stc-tr"></span><span class="stc-reg stc-bl"></span><span class="stc-reg stc-br"></span>
        <span class="stc-fold stc-a"></span><span class="stc-fold stc-b"></span>
        <svg class="stc-seal-wm" viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="2"><circle cx="100" cy="100" r="80"/><circle cx="100" cy="100" r="68"/><text x="100" y="130" font-family="var(--font-content)" font-size="90" font-weight="700" fill="currentColor" stroke="none" text-anchor="middle">C</text></svg>
        <div class="stc-form-in">
          <div class="stc-f-head"><span class="stc-f-agr">Collateral Exchange</span><span class="stc-f-form">Form R · 02</span></div>
          <div class="stc-rule2"></div>
          <div class="stc-f-titlerow">
            <!-- crossed Roman gladii — filled bronze -->
            <img class="stc-f-ico stc-ico-rival" alt="" aria-hidden="true" decoding="async" width="247" height="247" src="data:image/webp;base64,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" alt="Crossed gladii"/>
            <div>
              <div class="stc-f-agr2">Performance Agreement</div>
              <div class="stc-f-title">Rivalry Contract</div>
              <div class="stc-f-desc">Stake against another operator</div>
            </div>
            <div class="stc-f-refblock">No. CM·R·0002<br>Rev. 02</div>
          </div>
          <p class="stc-f-body">Two operators lock equal capital and choose the same verified metric. The highest verified outcome receives the full settlement. Read head-to-head at the deadline. No judge, no appeal.</p>
          <div class="stc-f-fields">
            <div class="stc-f-row"><span class="stc-f-k">Parties</span><span class="stc-f-lead"></span><span class="stc-f-v">2 Operators</span></div>
            <div class="stc-f-row"><span class="stc-f-k">Metric</span><span class="stc-f-lead"></span><span class="stc-f-v">Revenue Growth</span></div>
            <div class="stc-f-row"><span class="stc-f-k">Settlement</span><span class="stc-f-lead"></span><span class="stc-f-v">Head-to-head</span></div>
            <div class="stc-f-row"><span class="stc-f-k">Source</span><span class="stc-f-lead"></span><span class="stc-f-v">Stripe + Shopify</span></div>
            <div class="stc-f-row"><span class="stc-f-k">Window</span><span class="stc-f-lead"></span><span class="stc-f-v">14 — 60 Days</span></div>
          </div>
          <div class="stc-f-foot">
            <span class="stc-f-sources"><img class="stc-src-seal" src="/assets/images/wax-seal-verification.png" alt="" aria-hidden="true" width="147" height="128" decoding="async"><span class="stc-src-txt"><span class="stc-src-lbl">Verification Sources <span class="stc-dot">·</span> </span>Bank / Stripe / Shopify</span></span>
            <button type="button" class="stc-f-action" onclick="${rivalAction}"><span class="stc-f-label">${rivalLabel}</span> <span class="stc-a" aria-hidden="true">→</span></button>
          </div>
        </div>
      </article>
    </div>

    <div class="stc-foot">
      <span class="stc-fl"><span class="stc-fi">i</span> How Sources Work</span>
      <span class="stc-ft">Your own accounts settle every contract. Stripe, Shopify, and YouTube only unlock metrics a bank statement can't see — read-only, never written to.</span>
      <span class="stc-fsrc">
        <span class="stc-lbl">Verified Sources</span>
        <svg class="stc-st" viewBox="0 0 24 24" role="img" aria-label="Stripe"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/></svg>
        <svg class="stc-sh" viewBox="0 0 24 24" role="img" aria-label="Shopify"><path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z"/></svg>
        <svg class="stc-yt" viewBox="0 0 24 24" role="img" aria-label="YouTube"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
      </span>
    </div>
  </div>
        </section>
    `;
}
