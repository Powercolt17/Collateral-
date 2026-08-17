/**
 * Seed / top up the simulated rivalries.
 *
 * WHY THIS EXISTS ALONGSIDE THE ADMIN ENDPOINT. POST /v1/admin/seed-activity
 * does the same work but is gated on ADMIN_API_KEY, which means seeding
 * requires holding a production secret. Run from inside the environment this
 * needs no secret at all — it uses the DATABASE_URL already in the process —
 * so it is the safer of the two paths and the one to prefer.
 *
 *   railway run npm run db:seed:rivalries
 *
 * Or from Railway's web console on the service:
 *
 *   npm run db:seed:rivalries
 *
 * SAFE TO RUN TWICE. seedSimulatedActivity() skips the solo-contract sections
 * once they exist, and every rivalry checks for its own pair before inserting,
 * so re-running adds whatever is new and leaves the rest alone. It prints what
 * it actually did rather than claiming success.
 */

import 'dotenv/config';
import { db } from '../src/db/client.js';
import { sql } from 'drizzle-orm';
import { seedSimulatedActivity } from '../src/db/seed-activity.js';

async function main() {
    const before: any = await db.execute(sql`SELECT count(*) AS c FROM rivalries`);
    const beforeCount = Number(before?.rows?.[0]?.c ?? before?.[0]?.c ?? 0);
    console.log(`[seed-rivalries] rivalries before: ${beforeCount}`);

    const result = await seedSimulatedActivity();
    console.log('[seed-rivalries] seeder reported:', JSON.stringify(result));

    const after: any = await db.execute(sql`SELECT count(*) AS c FROM rivalries`);
    const afterCount = Number(after?.rows?.[0]?.c ?? after?.[0]?.c ?? 0);

    // What is actually on the public board, by the same state the API derives.
    const states: any = await db.execute(sql`
        SELECT
            count(*) FILTER (WHERE settled_at IS NOT NULL)  AS settled,
            count(*) FILTER (WHERE settled_at IS NULL AND activated_at IS NOT NULL) AS live,
            count(*) FILTER (WHERE activated_at IS NULL)    AS open
        FROM rivalries
    `);
    const s = states?.rows?.[0] ?? states?.[0] ?? {};

    console.log(`[seed-rivalries] rivalries after:  ${afterCount}  (+${afterCount - beforeCount})`);
    console.log(`[seed-rivalries] open: ${s.open ?? '?'} · live: ${s.live ?? '?'} · settled: ${s.settled ?? '?'}`);

    if (afterCount === beforeCount) {
        console.log('[seed-rivalries] NOTHING WAS ADDED. Every pair in the set already exists.');
    }
    process.exit(0);
}

main().catch((err) => {
    console.error('[seed-rivalries] failed:', err);
    process.exit(1);
});
