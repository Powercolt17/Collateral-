// @ts-nocheck
/**
 * Simulated Progress Updater
 * 
 * ONLY updates seed/demo rivalry contracts (users with @collateral.internal emails).
 * Real user contracts are NEVER touched by this job.
 * 
 * Creates realistic, organic-looking metric growth over time:
 * - Some contracts trend toward hitting target (win)
 * - Some contracts stall or grow too slowly (lose)
 * - Growth has natural noise, day/night variance, and occasional plateaus
 * - Runs every scheduler cycle via scheduler
 * 
 * Also ensures simulated rivalries never expire — keeps deadlines rolling forward.
 * When real users start creating contracts, this job ignores them entirely.
 */

import { db } from '../db/client.js';
import { sql } from 'drizzle-orm';
import { randomUUID, createHash } from 'crypto';

// =============================================================================
// OUTCOME ASSIGNMENT
// Deterministic based on rivalry ID — same rivalry always gets same outcome
// =============================================================================

function getOutcomeForParticipant(rivalryId: string, role: string): 'WIN' | 'LOSE' {
    const hash = createHash('md5').update(rivalryId + role).digest('hex');
    const num = parseInt(hash.slice(0, 8), 16);
    // ~35% chance of winning (realistic for Collateral's economics)
    return (num % 100) < 35 ? 'WIN' : 'LOSE';
}

// Deterministic pseudo-random based on a seed string (0.0 to 1.0)
function seededRandom(seed: string): number {
    const hash = createHash('md5').update(seed).digest();
    return (hash.readUInt16BE(0) % 10000) / 10000;
}

function calculateTargetGrowthAtTime(
    outcome: 'WIN' | 'LOSE',
    targetPct: number,
    elapsedRatio: number, // 0.0 to 1.0 (how far through the contract)
    seed: string = '', // deterministic seed (rivalryId + role + hour)
): number {
    // Clamp elapsed ratio
    const t = Math.min(1.0, Math.max(0, elapsedRatio));
    
    // Deterministic random values based on seed
    const r1 = seededRandom(seed + ':r1');
    const r2 = seededRandom(seed + ':r2');
    const r3 = seededRandom(seed + ':r3');
    const r4 = seededRandom(seed + ':r4');
    
    // Time-of-day engagement modifier (social/revenue peaks 9am-10pm)
    const hourOfDay = (r4 * 24) | 0;
    const isActiveHours = hourOfDay >= 9 && hourOfDay <= 22;
    const engagementMod = isActiveHours ? (0.95 + r4 * 0.1) : (0.75 + r4 * 0.15);
    
    if (outcome === 'WIN') {
        // Winners: S-curve growth that ends above target
        const sCurve = 1 / (1 + Math.exp(-8 * (t - 0.5))); // Sigmoid
        const finalPct = targetPct * (1.02 + r1 * 0.15); // 2-17% above target
        const basePct = sCurve * finalPct;
        
        // Noise varies per hour seed — creates realistic micro-movement
        const noise = (r2 - 0.5) * targetPct * 0.06;
        
        // Small momentum bursts (viral moments / ad pushes)
        const burst = r3 > 0.92 ? targetPct * 0.02 : 0;
        
        const raw = Math.max(0, (basePct + noise + burst) * engagementMod);
        // Minimum floor: once time has elapsed, always show at least small growth
        return t > 0.01 ? Math.max(0.1 + r1 * 0.3, raw) : raw;
    } else {
        // Losers: Start growing but plateau or stall
        const peakRatio = 0.4 + r1 * 0.25; // Plateau at 40-65% of target
        const peakPct = targetPct * peakRatio;
        
        // Quick rise then plateau
        const rise = Math.sqrt(Math.min(t * 2.5, 1.0));
        const basePct = rise * peakPct;
        
        // Noise creates realistic stalling/flickering near plateau
        const noise = (r2 - 0.5) * targetPct * 0.05;
        
        // Occasional dips (stalled growth, unfollows, refunds)
        const dip = r3 < 0.2 ? -(targetPct * 0.015) : 0;
        
        const raw = Math.max(0, (basePct + noise + dip) * engagementMod);
        // Minimum floor: losers also always show some positive movement
        return t > 0.01 ? Math.max(0.05 + r1 * 0.2, raw) : raw;
    }
}

// =============================================================================
// STEP 0: KEEP SIMULATED RIVALRIES ALIVE
// Extends deadlines and un-settles any that the cron auto-settled
// =============================================================================

async function keepSimRivalriesAlive(): Promise<number> {
    let fixed = 0;
    
    try {
        // Find ALL sim rivalries that were activated (including auto-settled ones)
        const simRivalries = await db.execute(sql`
            SELECT r.id, r.activated_at, r.deadline_utc, r.settled_at, r.duration_days,
                   r.platform, r.metric_key, r.target_growth_pct,
                   r.challenger_user_id, r.opponent_user_id
            FROM rivalries r
            JOIN users u_c ON r.challenger_user_id = u_c.id
            JOIN users u_o ON r.opponent_user_id = u_o.id
            WHERE r.activated_at IS NOT NULL
              AND u_c.email LIKE '%@collateral.internal'
              AND u_o.email LIKE '%@collateral.internal'
        `);
        
        const rows = (simRivalries as any).rows || simRivalries;
        const now = new Date();
        
        for (const r of rows) {
            const deadline = new Date(r.deadline_utc);
            const durationDays = r.duration_days || 14;
            const durationMs = durationDays * 86400000;
            
            // If deadline is in the past or within 2 days, push it forward
            if (deadline.getTime() < now.getTime() + 2 * 86400000) {
                // Set new activation to ~40% through the contract period ago
                const newActivatedAt = new Date(now.getTime() - durationMs * 0.4);
                const newDeadline = new Date(newActivatedAt.getTime() + durationMs);
                
                await db.execute(sql`
                    UPDATE rivalries
                    SET activated_at = ${newActivatedAt.toISOString()},
                        deadline_utc = ${newDeadline.toISOString()},
                        settled_at = NULL,
                        winner_user_id = NULL,
                        settlement_metadata = NULL,
                        updated_at = ${now.toISOString()}
                    WHERE id = ${r.id}
                `);
                
                // Reset participant outcomes
                await db.execute(sql`
                    UPDATE rivalry_participants
                    SET outcome = NULL,
                        payout_cents = NULL,
                        final_snapshot_at = NULL
                    WHERE rivalry_id = ${r.id}
                `);
                
                // Remove ALL terminal/post-activation events that cause state derivation crashes
                await db.execute(sql`
                    DELETE FROM rivalry_ledger_events
                    WHERE rivalry_id = ${r.id}
                      AND event_type IN (
                        'RIVALRY_SETTLED', 'RIVALRY_EXPIRED', 'RIVALRY_CANCELLED',
                        'RIVALRY_VERIFICATION_STARTED', 'RIVALRY_VERIFIED',
                        'RIVALRY_SETTLEMENT_STARTED', 'RIVALRY_DRAW',
                        'RIVALRY_CAPITAL_RETURNED'
                      )
                `);
                
                // CRITICAL: Clear ALL old metric snapshots and backfill with clean historical data
                await db.execute(sql`
                    DELETE FROM rivalry_metric_snapshots
                    WHERE rivalry_id = ${r.id}
                `);
                
                // Get participants for backfill
                const parts = await db.execute(sql`
                    SELECT id, user_id, role, baseline_value
                    FROM rivalry_participants
                    WHERE rivalry_id = ${r.id}
                `);
                const partRows = (parts as any).rows || parts;
                const targetPct = parseFloat(r.target_growth_pct || '15');
                
                // Generate daily historical snapshots from activation to now
                const daysElapsed = Math.floor((now.getTime() - newActivatedAt.getTime()) / 86400000);
                
                for (const part of partRows) {
                    let baseline = parseFloat(part.baseline_value || '0');
                    if (baseline <= 0) {
                        const platform = (r.platform || '').toUpperCase();
                        const seed = seededRandom(`${r.id}:${part.role}:baseline`);
                        if (platform === 'STRIPE' || platform === 'SHOPIFY' || platform === 'AMAZON') {
                            baseline = Math.round(150000 + seed * 400000);
                        } else if (platform === 'X') {
                            baseline = Math.round(5000 + seed * 20000);
                        } else if (platform === 'YOUTUBE') {
                            baseline = Math.round(10000 + seed * 40000);
                        } else {
                            baseline = Math.round(10000 + seed * 30000);
                        }
                        await db.execute(sql`
                            UPDATE rivalry_participants
                            SET baseline_value = ${baseline.toString()},
                                baseline_json = ${JSON.stringify({ value: baseline, autoAssigned: true })}
                            WHERE id = ${part.id}
                        `);
                    }
                    
                    const outcome = getOutcomeForParticipant(r.id, part.role);
                    
                    for (let d = 0; d <= daysElapsed; d++) {
                        const dayRatio = d / durationDays;
                        const daySeed = `${r.id}:${part.role}:d${d}`;
                        const growthPct = calculateTargetGrowthAtTime(outcome, targetPct, dayRatio, daySeed);
                        const value = Math.round(baseline * (1 + growthPct / 100));
                        
                        // Deterministic timestamp offset per day
                        const hourOffset = seededRandom(`${r.id}:${part.role}:t${d}`) * 12;
                        const snapshotTime = new Date(newActivatedAt.getTime() + d * 86400000 + hourOffset * 3600000);
                        
                        await db.execute(sql`
                            INSERT INTO rivalry_metric_snapshots (
                                id, rivalry_id, user_id, provider, metric_key,
                                metric_value, fetched_at, created_at
                            ) VALUES (
                                ${randomUUID()}, ${r.id}, ${part.user_id}, ${r.platform}, ${r.metric_key},
                                ${value.toString()}, ${snapshotTime.toISOString()}, ${snapshotTime.toISOString()}
                            )
                        `);
                    }
                    
                    // Update participant with latest growth
                    const latestRatio = daysElapsed / durationDays;
                    const latestGrowth = calculateTargetGrowthAtTime(outcome, targetPct, latestRatio, `${r.id}:${part.role}:d${daysElapsed}`);
                    const latestValue = Math.round(baseline * (1 + latestGrowth / 100));
                    
                    await db.execute(sql`
                        UPDATE rivalry_participants
                        SET percentage_delta = ${latestGrowth.toFixed(2)},
                            absolute_delta = ${(latestValue - baseline).toString()},
                            final_value = ${latestValue.toString()},
                            final_json = ${JSON.stringify({ value: latestValue, simulated: true, updatedAt: now.toISOString() })}
                        WHERE id = ${part.id}
                    `);
                }
                
                fixed++;
                console.log(`[SimProgress] 🔄 Reset rivalry ${r.id.slice(0,8)} — backfilled ${daysElapsed} days of data, new deadline: ${newDeadline.toISOString()}`);
            }
        }
        
        if (fixed > 0) {
            console.log(`[SimProgress] 🔄 Reset ${fixed} expired/near-expired simulated rivalries`);
        }
    } catch (err: any) {
        console.error('[SimProgress] keepAlive error:', err.message);
    }
    
    return fixed;
}

// =============================================================================
// MAIN JOB
// =============================================================================

export async function runSimProgressJob(): Promise<{ updated: number; snapshots: number; skipped: number; reset: number }> {
    console.log('[SimProgress] Starting simulated progress update...');
    
    let updated = 0;
    let snapshots = 0;
    let skipped = 0;
    
    // Step 0a: Nuke ALL sim rivalry snapshots and regenerate clean daily data
    try {
        // Get all sim rivalries
        const simRivalries = await db.execute(sql`
            SELECT r.id, r.platform, r.metric_key, r.target_growth_pct,
                   r.activated_at, r.deadline_utc, r.duration_days
            FROM rivalries r
            JOIN users u ON r.challenger_user_id = u.id
            WHERE u.email LIKE '%@collateral.internal'
              AND r.activated_at IS NOT NULL
              AND r.settled_at IS NULL
        `);
        const simRows = (simRivalries as any).rows || simRivalries;
        
        for (const rivalry of simRows) {
            // Count existing snapshots
            const countResult = await db.execute(sql`
                SELECT COUNT(*) as cnt FROM rivalry_metric_snapshots
                WHERE rivalry_id = ${rivalry.id}
            `);
            const countRows = (countResult as any).rows || countResult;
            const existingCount = parseInt(countRows[0]?.cnt || '0');
            
            const activatedAt = new Date(rivalry.activated_at);
            const now = new Date();
            const durationDays = rivalry.duration_days || 14;
            const daysElapsed = Math.floor((now.getTime() - activatedAt.getTime()) / 86400000);
            
            /* Expected: ~2 snapshots per day, one per participant.

               REBUILDS ON TOO FEW AS WELL AS TOO MANY. This only ever checked
               the upper bound, so a rivalry that arrived with no history — one
               inserted directly, or one whose first tick happened today —
               stayed at a single verification forever. The job appended one
               point per run and never filled in the days between activation
               and now, so the chart drew a dot where a curve belonged and the
               contract looked like it had been measured once in three weeks.

               Both bounds now trigger the same rebuild, which regenerates the
               whole series deterministically from the rivalry id, so a rebuilt
               chart is identical to the one it replaced apart from the points
               that were missing. */
            const expectedPerDay = 2;
            const expected = (daysElapsed + 1) * expectedPerDay;
            const expectedMax = expected * 1.5;
            const expectedMin = expected * 0.6;
            const tooMany = existingCount > expectedMax || existingCount > daysElapsed * 4;
            // Only from a day in: a rivalry activated an hour ago legitimately
            // has one reading and must not be rebuilt on every pass.
            const tooFew = daysElapsed >= 1 && existingCount < expectedMin;

            if (tooMany || tooFew) {
                console.log(`[SimProgress] 🧹 Rivalry ${rivalry.id.slice(0,8)} has ${existingCount} snapshots (expected ~${expected}, ${tooFew ? 'backfilling' : 'trimming'}). Rebuilding...`);
                
                // Delete ALL snapshots
                await db.execute(sql`
                    DELETE FROM rivalry_metric_snapshots WHERE rivalry_id = ${rivalry.id}
                `);
                
                // Get participants
                const parts = await db.execute(sql`
                    SELECT id, user_id, role, baseline_value
                    FROM rivalry_participants WHERE rivalry_id = ${rivalry.id}
                `);
                const partRows = (parts as any).rows || parts;
                const targetPct = parseFloat(rivalry.target_growth_pct || '15');
                
                // Regenerate clean daily snapshots
                for (const part of partRows) {
                    let baseline = parseFloat(part.baseline_value || '0');
                    if (baseline <= 0) {
                        const platform = (rivalry.platform || '').toUpperCase();
                        const seed = seededRandom(`${rivalry.id}:${part.role}:baseline`);
                        if (platform === 'STRIPE' || platform === 'SHOPIFY' || platform === 'AMAZON') {
                            baseline = Math.round(150000 + seed * 400000);
                        } else if (platform === 'X') {
                            baseline = Math.round(5000 + seed * 20000);
                        } else if (platform === 'YOUTUBE') {
                            baseline = Math.round(10000 + seed * 40000);
                        } else {
                            baseline = Math.round(10000 + seed * 30000);
                        }
                        await db.execute(sql`
                            UPDATE rivalry_participants
                            SET baseline_value = ${baseline.toString()},
                                baseline_json = ${JSON.stringify({ value: baseline, autoAssigned: true })}
                            WHERE id = ${part.id}
                        `);
                    }
                    
                    const outcome = getOutcomeForParticipant(rivalry.id, part.role);
                    
                    for (let d = 0; d <= daysElapsed; d++) {
                        const dayRatio = d / durationDays;
                        const daySeed = `${rivalry.id}:${part.role}:d${d}`;
                        const growthPct = calculateTargetGrowthAtTime(outcome, targetPct, dayRatio, daySeed);
                        const value = Math.round(baseline * (1 + growthPct / 100));
                        
                        // One snapshot per day at a consistent time (activation + d days + 6-hour offset)
                        const snapshotTime = new Date(activatedAt.getTime() + d * 86400000 + 6 * 3600000);
                        
                        await db.execute(sql`
                            INSERT INTO rivalry_metric_snapshots (
                                id, rivalry_id, user_id, provider, metric_key,
                                metric_value, fetched_at, created_at
                            ) VALUES (
                                ${randomUUID()}, ${rivalry.id}, ${part.user_id}, ${rivalry.platform}, ${rivalry.metric_key},
                                ${value.toString()}, ${snapshotTime.toISOString()}, ${snapshotTime.toISOString()}
                            )
                        `);
                        snapshots++;
                    }
                }
                
                console.log(`[SimProgress] ✅ Rebuilt ${daysElapsed + 1} clean daily snapshots for rivalry ${rivalry.id.slice(0,8)}`);
            }
        }
    } catch (err: any) {
        console.error('[SimProgress] Snapshot cleanup error:', err.message);
    }
    
    // Step 0b: Ensure sim rivalries haven't expired
    const reset = await keepSimRivalriesAlive();
    
    try {
        // 1. Find all ACTIVE rivalries owned by simulated users (@collateral.internal)
        const activeSimRivalries = await db.execute(sql`
            SELECT r.id, r.platform, r.metric_key, r.metric_type,
                   r.target_growth_pct, r.duration_days,
                   r.activated_at, r.deadline_utc,
                   r.challenger_user_id, r.opponent_user_id
            FROM rivalries r
            JOIN users u_c ON r.challenger_user_id = u_c.id
            JOIN users u_o ON r.opponent_user_id = u_o.id
            WHERE r.activated_at IS NOT NULL
              AND r.settled_at IS NULL
              AND u_c.email LIKE '%@collateral.internal'
              AND u_o.email LIKE '%@collateral.internal'
        `);
        
        const rows = (activeSimRivalries as any).rows || activeSimRivalries;
        
        if (!rows || rows.length === 0) {
            console.log('[SimProgress] No active simulated rivalries found. Skipping.');
            return { updated: 0, snapshots: 0, skipped: 0, reset };
        }
        
        console.log(`[SimProgress] Found ${rows.length} active simulated rivalries`);
        
        for (const rivalry of rows) {
            const rivalryId = rivalry.id;
            const activatedAt = new Date(rivalry.activated_at);
            const deadlineUtc = new Date(rivalry.deadline_utc);
            const now = new Date();
            
            // Calculate elapsed ratio (0.0 to 1.0)
            const totalDuration = deadlineUtc.getTime() - activatedAt.getTime();
            const elapsed = now.getTime() - activatedAt.getTime();
            const elapsedRatio = Math.min(1.0, elapsed / totalDuration);
            
            const targetPct = parseFloat(rivalry.target_growth_pct || '15');
            
            // Get participants
            const participants = await db.execute(sql`
                SELECT id, rivalry_id, user_id, role, baseline_value, percentage_delta
                FROM rivalry_participants
                WHERE rivalry_id = ${rivalryId}
            `);
            
            const parts = (participants as any).rows || participants;
            
            for (const part of parts) {
                let baseline = parseFloat(part.baseline_value || '0');
                
                // Auto-assign baseline if missing — prevents 0% display
                if (!baseline || baseline <= 0) {
                    // Generate a realistic baseline based on platform
                    const platform = (rivalry.platform || '').toUpperCase();
                    const seed = seededRandom(`${rivalryId}:${part.role}:baseline`);
                    if (platform === 'STRIPE' || platform === 'SHOPIFY' || platform === 'AMAZON') {
                        baseline = Math.round(150000 + seed * 400000); // $1,500 - $5,500 in cents
                    } else if (platform === 'X') {
                        baseline = Math.round(5000 + seed * 20000); // 5k - 25k followers
                    } else if (platform === 'YOUTUBE') {
                        baseline = Math.round(10000 + seed * 40000); // 10k - 50k subs
                    } else {
                        baseline = Math.round(10000 + seed * 30000);
                    }
                    
                    // Persist the baseline so it sticks
                    await db.execute(sql`
                        UPDATE rivalry_participants
                        SET baseline_value = ${baseline.toString()},
                            baseline_json = ${JSON.stringify({ value: baseline, autoAssigned: true })}
                        WHERE id = ${part.id}
                    `);
                    console.log(`[SimProgress] 🔧 Auto-assigned baseline ${baseline} for ${part.role} in ${rivalryId.slice(0,8)}`);
                }
                
                // Get predetermined outcome for this participant
                const outcome = getOutcomeForParticipant(rivalryId, part.role);
                
                // Calculate current growth percentage
                // Use hour-level seed with interpolation for smooth, realistic updates
                const totalHours = (rivalry.duration_days || 14) * 24;
                const hourNum = Math.floor(elapsedRatio * totalHours);
                const hourFraction = (elapsedRatio * totalHours) - hourNum;
                
                // Interpolate between current hour and next hour for smooth transitions
                const currentSeed = `${rivalryId}:${part.role}:h${hourNum}`;
                const nextSeed = `${rivalryId}:${part.role}:h${hourNum + 1}`;
                const currentGrowth = calculateTargetGrowthAtTime(outcome, targetPct, elapsedRatio, currentSeed);
                const nextElapsed = Math.min(1.0, elapsedRatio + 1 / totalHours);
                const nextGrowth = calculateTargetGrowthAtTime(outcome, targetPct, nextElapsed, nextSeed);
                
                // Smooth linear interpolation between hourly anchor points
                const growthPct = currentGrowth + (nextGrowth - currentGrowth) * hourFraction;
                const currentValue = Math.round(baseline * (1 + growthPct / 100));
                const absoluteDelta = currentValue - baseline;
                
                // Update rivalry_participants with current progress
                await db.execute(sql`
                    UPDATE rivalry_participants
                    SET percentage_delta = ${growthPct.toFixed(2)},
                        absolute_delta = ${absoluteDelta.toString()},
                        final_value = ${currentValue.toString()},
                        final_json = ${JSON.stringify({ value: currentValue, simulated: true, updatedAt: now.toISOString() })}
                    WHERE id = ${part.id}
                `);
                
                updated++;
                
                // Insert a new metric snapshot (the chart data source)
                // Limit to 1 snapshot per 4 hours for smooth, realistic chart curves
                const recentSnap = await db.execute(sql`
                    SELECT id FROM rivalry_metric_snapshots
                    WHERE rivalry_id = ${rivalryId}
                      AND user_id = ${part.user_id}
                      AND fetched_at > ${new Date(now.getTime() - 4 * 3600000).toISOString()}
                    LIMIT 1
                `);
                
                const recentRows = (recentSnap as any).rows || recentSnap;
                if (!recentRows || recentRows.length === 0) {
                    const snapId = randomUUID();
                    await db.execute(sql`
                        INSERT INTO rivalry_metric_snapshots (
                            id, rivalry_id, user_id, provider, metric_key,
                            metric_value, fetched_at, created_at
                        ) VALUES (
                            ${snapId}, ${rivalryId}, ${part.user_id}, ${rivalry.platform}, ${rivalry.metric_key},
                            ${currentValue.toString()}, ${now.toISOString()}, ${now.toISOString()}
                        )
                    `);
                    snapshots++;
                }
                
                const statusIcon = outcome === 'WIN' ? '📈' : '📉';
                console.log(`[SimProgress] ${statusIcon} ${part.role} in ${rivalryId.slice(0,8)}: ${growthPct.toFixed(1)}% growth (target: ${targetPct}%, elapsed: ${(elapsedRatio * 100).toFixed(0)}%, outcome: ${outcome})`);
            }
        }
        
        console.log(`[SimProgress] ✅ Complete — ${updated} participants updated, ${snapshots} snapshots, ${skipped} skipped, ${reset} reset`);
        
    } catch (err: any) {
        console.error('[SimProgress] Error:', err.message);
    }
    
    return { updated, snapshots, skipped, reset };
}

// =============================================================================
// ALSO UPDATE SOLO CONTRACTS
// Updates simulated solo contracts with progress too
// =============================================================================

export async function runSimSoloProgressJob(): Promise<{ updated: number }> {
    console.log('[SimProgress] Updating simulated solo contract progress...');
    let updated = 0;
    
    try {
        // Find active solo contracts owned by sim users
        const activeContracts = await db.execute(sql`
            SELECT c.id, c.principal_user_id, c.platform, c.metric_type,
                   c.condition_json, c.baseline_json,
                   c.created_at, c.deadline_utc,
                   ci.current_state
            FROM contracts c
            JOIN users u ON c.principal_user_id = u.id
            LEFT JOIN contract_index ci ON ci.contract_id = c.id
            WHERE u.email LIKE '%@collateral.internal'
              AND ci.current_state = 'EXECUTION_CONFIRMED'
              AND ci.is_terminal = 0
        `);
        
        const rows = (activeContracts as any).rows || activeContracts;
        
        for (const contract of rows) {
            const baseline = JSON.parse(contract.baseline_json || '{}');
            const condition = JSON.parse(contract.condition_json || '{}');
            const baseVal = baseline.value || 0;
            const targetVal = condition.threshold || 0;
            if (!baseVal || !targetVal) continue;
            
            const targetPct = ((targetVal - baseVal) / baseVal) * 100;
            const createdAt = new Date(contract.created_at);
            const deadline = new Date(contract.deadline_utc);
            const now = new Date();
            
            const totalDuration = deadline.getTime() - createdAt.getTime();
            const elapsed = now.getTime() - createdAt.getTime();
            const elapsedRatio = Math.min(1.0, elapsed / totalDuration);
            
            // Use contract ID to deterministically decide outcome
            const outcome = getOutcomeForParticipant(contract.id, 'solo');
            const dayNum = Math.floor(elapsedRatio * (contract.duration_days || 14));
            const growthPct = calculateTargetGrowthAtTime(outcome, targetPct, elapsedRatio, `${contract.id}:solo:d${dayNum}`);
            const currentValue = Math.round(baseVal * (1 + growthPct / 100));
            
            // Store in condition_json as currentValue for frontend
            const updatedCondition = {
                ...condition,
                currentValue,
                lastSimUpdate: now.toISOString(),
            };
            
            await db.execute(sql`
                UPDATE contracts
                SET condition_json = ${JSON.stringify(updatedCondition)},
                    updated_at = ${now.toISOString()}
                WHERE id = ${contract.id}
            `);
            
            updated++;
        }
        
        console.log(`[SimProgress] ✅ Updated ${updated} solo contracts`);
    } catch (err: any) {
        console.error('[SimProgress] Solo update error:', err.message);
    }
    
    return { updated };
}
