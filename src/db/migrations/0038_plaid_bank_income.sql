-- Add Plaid Bank Income verification rail
-- Verifies INCOME RECEIVED (bank deposits) — never sales or commission.
--
-- ⚠️ MAINTAINER WARNING — ENUM VALUES IN TRANSACTIONS
-- The drizzle migrator runs ALL pending migrations inside a SINGLE transaction.
-- Postgres 12+ allows ALTER TYPE ... ADD VALUE inside a transaction, but the new
-- value CANNOT BE USED until that transaction commits. This file therefore only
-- ADDS values and never inserts/updates rows using them.
-- Do NOT add a migration that writes 'plaid' / 'PLAID' / 'NET_INCOME_DEPOSITS'
-- without confirming it lands in a separate migration batch — on a fresh database
-- every migration replays in one transaction and it would fail with
-- "unsafe use of new value of enum type".
-- Verified: local postgres:15, prod Neon (PG 14+) — both support this usage.

-- Add PLAID to platform enum
ALTER TYPE platform ADD VALUE IF NOT EXISTS 'PLAID';

-- Add income metric (deposits received, not sales made)
ALTER TYPE metric_type ADD VALUE IF NOT EXISTS 'NET_INCOME_DEPOSITS';

-- Add plaid to sales_provider enum (new contracts write this properly;
-- existing Shopify/Amazon rows written as 'stripe' are left untouched)
ALTER TYPE sales_provider ADD VALUE IF NOT EXISTS 'plaid';

-- Add plaid to identity_provider enum (mirrors the AMAZON precedent in 0020)
ALTER TYPE identity_provider ADD VALUE IF NOT EXISTS 'plaid';
