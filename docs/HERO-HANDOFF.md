# Hero handoff — landing page

Everything below is verified against the file at `c983a457`, not recalled.
The only file that matters is `FRONTEND/src/components/CollateralHero.js`.

## Where things stand

Live and pushed. Nothing outstanding in the working tree except a pre-existing
deletion of `CollateralModes.jsx` that is not ours.

The hero is a **two-column layout**: type in a left column, a close-crop sepia
engraving of three figures massed on the right, bleeding off the right edge.
Mobile is a **paper panel with the artwork anchored to the bottom**.

## Live values

| | value | why |
|---|---|---|
| `PLATE_W / PLATE_H` | `1917 x 866` | must track the file exactly |
| desktop plate | `collateral-crop5.jpg` | ink starts 42.8% across |
| mobile plate | `collateral-group2.jpg` | figure crop, ratio 1.29 |
| `--plate-grade` | `saturate(.62) contrast(.92) brightness(1.09)` | see below |
| `--ox` / `--ox-deep` | `#781C22` / `#57131A` | button only |
| `--ink-warm` | `#2B2118` | headline, eyebrow, link |
| `--roman` | Trajan Pro, 400 and 700 | display caps |
| plate anchor | `left center` | crop lands on the right |
| column | `max-width:40cqw`, `padding-left:5cqw` | |
| headline desktop | `3.95cqw` (61px at 1551) | |
| headline mobile | `clamp(26px,7.2vw,34px)` | |
| cloud layer | `opacity:.16`, 12s, tile `12.5%` | |
| mobile hero height | `100svh` (with `100vh` fallback) | |

## Things that will bite you

**The style block is inside a template literal.** A backtick anywhere in those
CSS comments closes the literal and the landing page dies with a syntax error.
This happened three times. Before every push:

```bash
tr -cd '\140' < FRONTEND/src/components/CollateralHero.js | wc -c
```

Must be **8**. Line 26 (JSDoc), 92 (open), two nested templates in the markup,
and the close.

**This file has accumulated superseded CSS, and a wrong value can hide below a
right one.** Three separate duplicate-declaration bugs shipped this way — two
`color` declarations on `h1` (oxblood silently beating `--ink-warm`), and two
mobile `h1` font-size rules (`12vw` beating `9vw`). **Always verify with
`getComputedStyle` on the live page, never by reading the source.** A cleanup
pass to strip dead rules is overdue.

**`src/mobile.css:521` sets `font-size`, `letter-spacing:-0.5px` and
`line-height:1.15` with `!important` on a bare `h1` selector for every view
under 768px.** An `!important` at lower specificity beats a plain declaration at
higher specificity, so anything the hero sets for mobile type needs `!important`
too or it silently loses.

**The three cloud values are one set.** `opacity` on the cloud layer, the
`brightness` in `--plate-grade`, and the reduced-motion flat `background-color`.
Brightness exists only to compensate for the cloud layer's mean shade
(`opacity x 0.5`, which is why the fallback is `rgba(0,0,0,.08)` at `.16`). Move
one alone and the plate gets darker or washes out, and reduced-motion users get
a differently lit hero.

**Comments in this file have gone stale before.** Three stacked `--plate-grade`
comment blocks — 95 lines — described a crimson plate and a `sepia()` step that
had not been in the chain for a long time. Anything quoting a measurement should
be re-measured before it is trusted. The current block is verified against
`collateral-crop5.jpg`: graded mean `242,225,201`, no clipping, headline
contrast **12.30:1** in full sun to **10.39:1** under deepest cloud against
`--ink-warm`. Note the headline is `--ink-warm`, **not** `--ox` — oxblood is
button-only, and measuring the wrong colour understates the margin badly.

**The cloud layer translates**, so a mask applied to it travels with it. The
left-side texture vignette lives on a `.clt-sky` wrapper that never moves, with
the animation on an inner `<i>`.

**Anchor is zero-sum on the desktop plate.** Where the ink starts sets how big
the headline can be. Moving the plate right buys type width but `cover` then
discards more off the right, and the third figure crops off — that regression
shipped once and had to be reverted.

## How to change the artwork

Measure first. The number that governs everything is **where ink starts as a
percentage of plate width**. At 42.8% the column supports `3.95cqw`. Headline
width is **8.792px per px of font-size in Trajan** against 6.918 in the
grotesque — that ratio is why every size had to be re-derived when the face
changed.

Renders have consistently come back with the figure group further left than
asked (26.8%, 30.5%, 39.8% against a 48% brief). The fix that works is padding
the canvas leftward with the plate's own flat paper via System.Drawing in
PowerShell — there is no Node or Python on this machine, so all image work goes
through `Add-Type -AssemblyName System.Drawing`.

## Open, undecided

1. **"Recorded onchain."** Asked for in the mobile mockup, deliberately NOT
   shipped. The ledger section on the same page says settlement happens because
   an API reported and escrow moved — oracle-verified, not onchain. It is a
   claim about where customer deposits sit and needs confirming before it ships.
2. **Headline copy.** "PUT MONEY ON YOUR OWN DEADLINE" is under review. The
   argument for changing it is sound — the illustration now explains the
   mechanic, so the headline could carry the aspiration. Candidates offered were
   "Bet On Yourself" (conflicts with the page's own anti-gambling framing),
   "Where Commitment Becomes Capital" (strongest), "Commit to What Matters",
   "The First Market Built on Human Execution" (**"first" is a substantiation
   risk**).
3. **Circular "C" mark** next to the wordmark, in the mockup. Does not exist in
   the project — nearest assets are wax-seal and eye-logo PNGs.
4. **Cloud strength.** Currently `.16`, raised on request. At `.18` it read as
   staining rather than light on a pale plate. If it looks dirty, `.12` is the
   middle, and the two coupled values must move with it.
5. **Narrow desktop windows.** Below roughly 1200px, or at browser zoom, `cover`
   crops the wide plate hard and the third figure is lost. The durable fix is a
   breakpoint that switches desktop to the mobile treatment — artwork as a
   bottom panel rather than full-bleed — rather than more padding.

## Housekeeping

18 orphaned plate JPEGs in `FRONTEND/public/assets/images`, roughly 7MB, none
referenced. Only `collateral-crop5.jpg` and `collateral-group2.jpg` are live.

`collateral-plate.jpg` was flagged as a possible live reference — **it is not.**
The single hit in `src` is inside a CSS *comment*, leftover measurement notes.
All 18 orphans are confirmed safe to delete, no broken-image risk.

Trajan Pro is **commercial Adobe**; a desktop licence does not cover serving it
from your domain. Both faces are unsubsetted, ~585KB for seven glyphs in the
wordmark.

## Verifying

There is no Node on this machine, so the dev server cannot run. Everything is
verified by driving the deployed site with the browser tools and reading
computed styles. The browser pane does not composite frames — screenshots fail
and CSS animations sit frozen at their first frame, so **animation cannot be
observed here, only measured**. The 12s cloud cycle has never actually been
watched.
