# Collateral — working notes

Things that cost real time to discover. Read before touching migrations.

## Migrations

### Timestamp is identity. Hash is not.

Drizzle records `(hash, created_at)` in `drizzle.__drizzle_migrations`, where
`hash = sha256(raw .sql file bytes)` and `created_at` is the journal entry's
`when`. It decides what to replay by comparing each journal `when` against the
newest `created_at` in that table — **not** by hash.

That matters because **a hash cannot distinguish "never applied" from "applied,
then the file was edited."** Any migration touched after it ran hashes to
something the table has never seen, and looks unapplied forever.

This is not rare here. As of the July 2026 audit, **7 of 24 recorded migrations
had stale hashes** — files edited after they ran. `0016_add_origin_event_id` is
the clearest case: applied 2026-01-25, edited 2026-01-26 and again 2026-02-08.

**When reconciling, match on `created_at` against the journal's `when`.** A
hash-based reconciliation drafted during that audit would have inserted 18
duplicate rows for migrations that already had one — silently, because drizzle
would not have complained.

### `.sql` files must be LF in the working tree

`.gitattributes` pins `*.sql text eol=lf`. Without it, `core.autocrlf=true` on
Windows checks these out as CRLF, so locally computed hashes differ from the
ones the Linux build box computes, and every hash comparison silently fails.

**`git add --renormalize` stages LF but does not rewrite the working tree.** The
attribute alone changes nothing for files already checked out. To actually
normalise:

```bash
rm -f src/db/migrations/*.sql
git checkout -- src/db/migrations/
```

Then verify rather than assume — check the bytes, not the attribute. During the
audit this took native hash matches from 6/24 to 17/24.

### A file on disk is not a migration drizzle will run

`migrate()` runs what is listed in `meta/_journal.json`, not what is in the
folder. Hand-written `.sql` files added without a journal entry are never
executed. At one point 47 files existed on disk and only 27 were journalled.

### Enum additions are one-way

`ALTER TYPE ... ADD VALUE` cannot be undone — Postgres has no `DROP VALUE`.
Removing one means recreating the type and rewriting every column using it. Use
`IF NOT EXISTS`, run them individually rather than batched, and confirm each.

### Schema was partly built by hand

Some tables were created with raw SQL rather than through drizzle, so their
constraints carry Postgres's default `_fkey` naming instead of drizzle's `_fk`
(e.g. `user_wallets_user_id_fkey`, not `user_wallets_user_id_users_id_fk`).
Likewise `creator_referrals_slug_key` covers what `idx_creator_referrals_slug`
would have. **These are not gaps** — check the relationship, not the name.

A table existing does not mean its indexes do. `0014_account_ledger_events`
created its table but `idx_account_ledger_event_type` was missing in production;
only a column-and-index-level check found it. Audit at object level, never at
table level.

## Deploy

- **Frontend** deploys to **Vercel** from `main` (`www.collateral.market`).
- **Backend** deploys to **Railway** via `railway.json`.

`startCommand` must be `npm run start:migrate` for migrations to run at all;
`npm start` skips them. Do not flip it while the tracking table is inconsistent
— a replay of an already-applied migration fails the start command, Railway
retries three times, and the service stays down.
