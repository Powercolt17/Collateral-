# Migrations

Before editing anything here, read the **Migrations** section of `/CLAUDE.md`.

Three rules that are not obvious and have each cost real time:

1. **Timestamp is identity, not hash.** A migration edited after it ran hashes
   to something the tracking table has never seen and looks unapplied forever.
   Reconcile on `created_at` vs the journal's `when`.
2. **A file here is not a migration.** `migrate()` runs what is in
   `meta/_journal.json`. Files without a journal entry never execute.
3. **`.sql` must be LF.** Pinned by `.gitattributes`. A CRLF checkout makes
   local hashes disagree with the build box, silently.
