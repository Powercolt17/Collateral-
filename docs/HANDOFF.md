# Handoff — August 2026

State of the income rail, payouts, and the migration system. Written at the end
of a long session; the point is that nothing here has to be rediscovered.

Read `/CLAUDE.md` first for the migration rules. This document is the status.

---

## 1. Built and working

| What | Commits |
|---|---|
| Plaid bank-income adapter — stream detection, personalized baseline, half-open windows | `05b1bbbf` |
| Derived contract terms — percentiles, payout multiplier, per-tier house edge, frozen settlement instant | `d31e103d` |
| Solo source picker replacing the pre-priced catalog | `b8acc723` … `c6b4c2f7` |
| Bank-first restructure (two steps, gated metric matrix) | `ad59117c` |
| Matrix driven by real connection state | `b2efc049` |
| Plaid Link connect flow (link-token → exchange → status → streams) | `47484004` |
| History-depth endpoint and "4 of 6 months" state | `f034a154` |
| Migration reconciliation + `start:migrate` back on | `6ae27e4e`, `ad34fb88` |
| Payout pipeline, two rails behind one queue | `b44af0fb` |
| **Manual-approval payouts + admin queue + UI** | `a454c195` |

Deployed: frontend on **Vercel** from `main` (`www.collateral.market`), backend on
**Railway** (`collateral-production.up.railway.app`). Both boot clean.

Test suites added this session: `tests/plaid-income-streams.test.ts` (17),
`tests/payout-job.test.ts` (13), `tests/payout-manual-approval.test.ts` (14).
All pass.

---

## 2. Built but NEVER RUN

**Nothing in this section has processed a real contract.** It is unit-proven
only. Treat every item as unverified until it runs once end to end.

- ~~**The worker is not deployed.**~~ **Deployed and looping** as of August 2026
  — 15s iterations, all jobs processing 0 rows. It now also owns the periodic
  jobs that used to run on the web service's 5-minute interval; see
  "One scheduler" below. Still nothing has *settled* — a clean loop over an
  empty queue proves the loop, not the settlement.
- **Settlement has never been proven** for a win or a miss. No test contract has
  ever been created, settled, or verified against a real oracle.
- **The payout approve path has never disbursed.** `POST /v1/admin/payouts/:id/approve`
  is unit-tested against stubs; it has never touched Stripe, not even in sandbox.
- **Plaid has never completed a real Link flow.** No `PLAID_CLIENT_ID` /
  `PLAID_SECRET` are configured, so link-token → exchange → status is untested
  against Plaid's sandbox. The validator's rejection paths *are* proven (9/9).
- **`unlocksAt` / `monthsAvailable`** are computed from logic that has never seen
  real deposit data.
- **The crypto rail is deliberately unimplemented.** `CryptoPayoutAdapter.send()`
  throws TERMINAL rather than no-op, so a crypto payout parks visibly instead of
  writing `PAYOUT_SENT` for money that never moved.

---

## 3. Blockers and owners

All owned by the user; none can be done from the agent side.

| Blocker | Why it is blocking | Owner |
|---|---|---|
| ~~**Railway worker service**~~ | **DONE** — deployed August 2026, looping cleanly on 15s iterations. | — |
| **Neon test branch / local Postgres** | Docker is not running and `DATABASE_URL_TEST` points at localhost, so settlement cannot be proven without writing to production. | User |
| **Exposed secrets** | `DEPLOYER_PRIVATE_KEY`, `STRIPE_SECRET_KEY`, `CLERK_SECRET_KEY`, production `DATABASE_URL` have been public in git since **2026-01-07**. Repo is public; 0 forks. Rotation at each provider is the only fix — removal does not un-expose. Also audit for persistence (new keys, roles, webhooks, collaborators). | User |
| **LLC name** | Required before Plaid/Stripe production applications. | User |
| **Plaid application** | Sandbox needs `PLAID_CLIENT_ID` / `PLAID_SECRET` / `PLAID_ENV`; production needs the LLC. | User |
| **Stripe Connect onboarding** | `connect_accounts` is empty — effectively nobody can be paid. | User |
| **Clerk publishable key** | `VITE_CLERK_PUBLISHABLE_KEY` is set in Railway but absent locally, so OAuth cannot work in local dev. Not a production issue. | User |

---

## 4. Decisions and why

**Payouts are manual-approval only.** Settlement stays automatic — verification,
outcome and `PAYOUT_QUEUED` all run unattended. Only money movement waits on a
human. The user oversees every disbursement.

**No bulk approve.** Omitted entirely rather than built with a confirmation
dialog. A single click that moves every pending payout is the specific mistake
the design exists to prevent. Approvals are one at a time; the UI confirms the
amount each time.

**One queue, two rails.** USD and crypto drain the *same* `PAYOUT_QUEUED` events
behind a common `PayoutAdapter` interface. Two settlement paths would mean two
places a payout is decided and eventually two different answers for the same
contract.

**Onboarding gate at contract creation.** A user must have a payout destination
*before* capital locks. Discovering at settlement that there is nowhere to send
the money is the worst version: outcome already decided, user waiting on
onboarding nobody asked for.

**Timestamp is migration identity, not hash.** Drizzle replays by comparing the
journal's `when` against the newest `created_at`. A hash cannot distinguish
"never applied" from "applied, then edited" — 7 of 24 recorded migrations here
have stale hashes. A hash-based reconciliation would have inserted 18 duplicate
rows. Full detail in `/CLAUDE.md`.

**Bank-first source architecture.** The bank is the engine for every solo
contract, not one option among four. It settles anything denominated in dollars
(Stripe and Shopify payouts land there) and produces the baseline whichever
metric is chosen. Platform APIs are optional add-ons that unlock only what a
bank statement physically cannot see: MRR, order counts, views — counts, not
money.

**Plaid over Stripe Financial Connections.** Plaid Link is an embedded modal
with its own lifecycle (`onSuccess`/`onExit`/`onEvent`), so the browser never
leaves the page and there is nothing to poll — unlike the OAuth popup-and-poll
pattern the other connectors use. The access token never reaches the browser.

**One scheduler, in the worker.** The web service used to run every job on a
5-minute `setInterval` in `src/index.ts`. Once the worker was deployed, both
processes ran verification and settlement against the same database. The jobs
take advisory locks per contract, but those are a backstop, not the design —
two runners would have double-processed the first real contract. The interval is
gone from `index.ts`; the worker calls
`runScheduledJobs({ includeVerificationAndSettlement: false })` every
`PERIODIC_JOB_INTERVAL_MS` (default 5 min), because it already runs verification
and settlement on its own 15s loop. The periodic jobs deliberately do not run at
15s: several make one provider API call per participant and one sends email.
`POST /v1/ops/run-jobs` still triggers a full manual pass on the web service —
human-initiated, and not to be used while the worker is mid-iteration.

**Fail where it is cheap.** Recurring principle: reject a bad bank item at
connect time, not settlement; freeze the deadline at lock, not settlement;
require a payout destination at creation, not payout.

---

## 5. Landmines

- **146 pre-existing test failures.** A `ReferenceError` that killed an entire
  page passed typecheck and 499 green tests this session. With 146 known-red,
  "did I break something?" is unanswerable. Triage before trusting the suite.
  Always report new tests separately.
- **`.eq-grid` is shared with the Rivalry board.** Deleting it while cleaning up
  the Solo section breaks a board you were told not to touch. Same for
  `activeCategory` / `activeSort`, which drive Rivalry's filters.
- **`schema.ts` declares pgEnums that do not exist in production.**
  `account_ledger_events.event_type` is **VARCHAR** — migration `0016` converted
  it. So `PAYOUT_BLOCKED` and `PAYOUT_REJECTED` needed no migration. Check the
  database before writing an enum migration.
- **There is no rivalry verification job. Rivalries cannot settle at all.**
  `settleRivalry()` requires state `VERIFIED` (or `SETTLING`) and non-null
  `participants.final_value`. A rivalry reaches `VERIFIED` via
  `ACTIVE → VERIFYING → VERIFIED`, and **nothing in production performs that
  transition** — `RIVALRY_VERIFICATION_STARTED` / `RIVALRY_VERIFIED` are written
  only by `seed-activity.ts`, `seed-rivalries-fix.ts` and the sim job, and
  nothing sets `final_value`. `rivalry-cron.ts` used to call `settleRivalry()`
  from `ACTIVE` anyway, throwing `Invalid rivalry transition: ACTIVE → UNKNOWN`
  every 5 minutes forever (the `→ UNKNOWN` is a placeholder in the validator,
  not a real state). That now reports as `awaitingVerification` instead of an
  error — **the error is fixed, the missing feature is not.** Rivalry 34d63ca3
  is past deadline and parked there. Writing this job means the first real
  rivalry settlement, moving real capital and queueing a real payout: prove it
  on a test database first. There are no rivalry tests of any kind.
- **`resolveUserRail()` is hardcoded to USD.** There is no stored per-user rail
  preference. Defaulting to crypto would park every payout since that rail is
  unimplemented.
- **CRLF/LF hashing.** `core.autocrlf=true` checks `.sql` out as CRLF on Windows
  while Railway's Linux checkout gets LF, so locally computed migration hashes
  disagree with production. `.gitattributes` now pins `*.sql text eol=lf`, but
  `git add --renormalize` **stages LF without rewriting the working tree** — the
  files must be deleted and re-checked-out.
- **`mockRivalries` renders over real data.** `/market` shows four fabricated
  duels with fabricated capital while the database holds one real rivalry
  (1 rivalry, 2 participants, 6 ledger events, 16 metric snapshots). The schema
  and data exist; the board just never queries them. This is a display fix, and
  it is the same class of artifact as the fake catalog and ticker that were
  deleted — something presenting as real that is not.
- **The onboarding gate blocks contract creation today.** `connect_accounts` is
  empty, so with the gate live *no user can create a contract* until they
  onboard. Correct by design, but it will look like a bug.
- **`node_modules` is tracked in git — 24,489 files, 201 packages, on a public
  repo.** Backend only; `FRONTEND/node_modules` is clean. `.gitignore` lists
  `node_modules/`, which does nothing for files already tracked, so it has been
  silently committing since before the ignore rule existed. **Audit before
  untracking.** A first pass found no tracked `.env`, `.pem`, `.key`, `.p12` or
  `.pfx` — the hits on "credential"/"secret" are library source (grpc's
  credentials modules, Stripe's `Apps/Secrets` resource), not secrets. That pass
  was filename-only. Given the secrets already public since 2026-01-07, assume
  nothing and check contents, including history, before deciding this is clean.
  Note that `git rm -r --cached node_modules` removes it going forward but does
  **not** remove it from history — same distinction as the exposed keys, where
  removal does not un-expose.

---

## 6. State of migrations — read this plainly

**Migrations are reconciled. `start:migrate` is ON as of `ad34fb88`, and the
service boots clean.**

Earlier status lists in this session said otherwise and cost real time. They were
stale. The sequence was:

1. `b3f96c94` turned `start:migrate` on → drizzle replayed `0004` → duplicate
   enum → boot loop
2. `c87f621f` reverted to `npm start` to restore the site
3. Audit + reconciliation: 4 rows inserted into `__drizzle_migrations` using
   **timestamp** identity, 3 missing `0022` enum values added by hand, the
   missing `idx_account_ledger_event_type` index created
4. `ad34fb88` turned `start:migrate` back on — **this is current**

Verified state: **28 tracking rows, 28 journal entries, 0 migrations pending.**
`platform.PLAID`, `metric_type.NET_INCOME_DEPOSITS`, `sales_provider.plaid`,
`identity_provider.plaid` all present.

Enum additions are one-way — Postgres has no `DROP VALUE`.

---

## 7. Copy — DONE

Revised in `ceeb1c69`'s successor commit. The distinction now held everywhere:
**the outcome is automatic and unappealable; the disbursement is reviewed.**
Outcome language was deliberately not softened — it is the product's strongest
claim and it is still true.

| File | Now reads |
|---|---|
| `Landing.js:169` | "the oracle reports and the outcome is set. Neither party gets a vote." |
| `ContractTermSheet.js:342` | "Settled automatically at window close. Funds released after review, typically within one business day." |
| `Contracts.js:588`, `TermSheet.js:527` | "No overrides on the outcome. No appeals." |
| `ActiveContracts.js:1221` | "✓ No Appeals" — unchanged, still true |

Payout timing added where a winner sees their own result, which previously said
nothing about when money arrives: `ReceiptDetail.js:181` (settled-success status
message) and `ContractDetail.js` `renderActionPanel()`, which gained a
win branch — `SETTLED_SUCCESS`/`SETTLEMENT_COMPLETE` say funds are released
after review, `PAYOUT_COMPLETE`/`COMPLETED` say they have been released.
Previously both fell through to a generic "Final state reached."

The wording is **"after review, typically within one business day"** — settled
deliberately, not by default. A hard one-day promise is gated on a human
clicking approve in the admin queue with no SLA and no alerting behind it, which
is the same overstatement this section exists to fix, moved from settlement to
timing. "Typically" is honest about a manual gate. If overnight alerting on the
pending queue ever lands, a hard number becomes defensible; until then it is not.

Still accurate, no change needed: `ActiveContracts.js:1198`, `ReceiptDetail.js:387`,
`platform-policy.ts:31` — all describe verification and outcome, not disbursement.

---

## Next three things

1. **Get a test database.** Docker is down and `DATABASE_URL_TEST` points at
   localhost, so the suite cannot run at all — `tests/global-setup.ts` refuses to
   start without it. Everything below is gated on this, and so is any claim that
   a change was tested.
2. **Rotate the exposed secrets.** Seven months public. Independent of everything
   else. Pair it with the `node_modules` audit — same question about what has
   been readable in that repo since January.
3. **Prove settlement** for a win and a miss on that test database, then approve
   one payout in Stripe sandbox. Only then is the pipeline real. Rivalries need
   a verification job built before they can settle at all (see landmines).
