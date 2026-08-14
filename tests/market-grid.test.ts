// @vitest-environment happy-dom
/**
 * Market Grid Tests
 *
 * /market rendered ONE card against a market holding several contracts, and
 * nothing on the page could reveal it: the results count agreed with the cards
 * because both were derived from the same truncated array.
 *
 * So the property under test is the one that was violated — the card count is
 * the data's length, never a constant. Each case drives the real view module
 * against a stubbed feed and counts what lands in the DOM.
 *
 * These run against the view's own markup, so they also fail if the grid's
 * class names drift away from what the renderer emits.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderActiveContracts, initActiveContracts } from '../FRONTEND/src/views/ActiveContracts.js';

function mkRivalry(i: number, over: any = {}) {
    return {
        id: 'riv-' + i,
        recordHash: 'hash' + i + 'abcdef',
        state: i % 2 === 0 ? 'ACTIVE' : 'CHALLENGE_ISSUED',
        metricType: 'GROSS_REVENUE',
        platform: ['STRIPE', 'SHOPIFY', 'X'][i % 3],
        durationDays: 30,
        settlementRail: 'USD',
        stakePerSideCents: (i + 1) * 10000,
        deadlineUtc: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        challengerUserId: 'u' + i,
        opponentUserId: i % 2 === 0 ? 'o' + i : null,
        challengerUsername: 'chal' + i,
        opponentUsername: i % 2 === 0 ? 'opp' + i : null,
        participants: [],
        ...over,
    };
}

function install(all: any[]) {
    (globalThis as any).window.api = {
        hasAuthToken: () => false,
        getRivalries: async ({ limit, offset }: any) => ({
            ok: true, rivalries: all.slice(offset, offset + limit), total: all.length,
        }),
        getMyRivalries: async () => ({ ok: true, rivalries: [], total: 0 }),
        getRivalryMetrics: async () => ({ metrics: [] }),
        getRivalryStats: async () => ({ stats: {} }),
        getPublicResults: async () => ({ results: [] }),
        getHomepageStats: async () => ({}),
    };
    (globalThis as any).window.router = { navigate: vi.fn() };
}

async function boot(all: any[]) {
    document.body.innerHTML = renderActiveContracts();
    install(all);
    initActiveContracts();
    // let the feed walk + progress pool settle
    for (let i = 0; i < 40; i++) await new Promise((r) => setTimeout(r, 0));
}

const cards = () => document.querySelectorAll('.mb-grid .mb-card:not(.mb-skel)').length;
const count = () => document.getElementById('mb-count')!.textContent;

describe('market grid renders every rivalry', () => {
    it('one contract -> exactly one card', async () => {
        await boot([mkRivalry(0)]);
        expect(cards()).toBe(1);
        expect(count()).toBe('1');
    });

    it('twenty contracts -> first page plus load more, then all twenty', async () => {
        const data = Array.from({ length: 20 }, (_, i) => mkRivalry(i));
        await boot(data);
        expect(count()).toBe('20');
        expect(cards()).toBe(12);
        const more = document.querySelector('.mb-more-btn') as HTMLButtonElement;
        expect(more).toBeTruthy();
        more.click();
        expect(cards()).toBe(20);
        expect(document.querySelector('.mb-more-btn')).toBeNull();
    });

    it('pages past the 50-row API page size', async () => {
        const data = Array.from({ length: 63 }, (_, i) => mkRivalry(i));
        await boot(data);
        expect(count()).toBe('63');
    });

    it('every card carries its own receipt and operators', async () => {
        const data = Array.from({ length: 8 }, (_, i) => mkRivalry(i));
        await boot(data);
        const rcpts = [...document.querySelectorAll('.mb-c-rcpt')].map((n) => n.textContent);
        expect(new Set(rcpts).size).toBe(8);
        const handles = [...document.querySelectorAll('.mb-op .nm')].map((n) => n.textContent);
        expect(handles).toContain('@chal0');
        expect(handles).toContain('Open slot');
    });

    it('settled rivalries stay off the board', async () => {
        const data = [mkRivalry(0), mkRivalry(1, { state: 'SETTLED' }), mkRivalry(2, { state: 'DRAW' })];
        await boot(data);
        expect(cards()).toBe(1);
        expect(count()).toBe('1');
    });

    it('a filter changes the cards and the count together', async () => {
        const data = [
            mkRivalry(0, { platform: 'STRIPE', state: 'ACTIVE' }),
            mkRivalry(1, { platform: 'SHOPIFY', state: 'ACTIVE' }),
            mkRivalry(2, { platform: 'X', state: 'ACTIVE' }),
        ];
        await boot(data);
        expect(cards()).toBe(3);
        (document.querySelector('.mb-chip[data-category="social"]') as HTMLElement).click();
        expect(cards()).toBe(1);
        expect(count()).toBe('1');
        (document.querySelector('.mb-chip[data-category="commerce"]') as HTMLElement).click();
        expect(count()).toBe('1');
        (document.querySelector('.mb-chip[data-category="all"]') as HTMLElement).click();
        expect(count()).toBe('3');
    });

    it('empty filter result shows an empty state, not a stale card', async () => {
        await boot([mkRivalry(0, { platform: 'STRIPE', state: 'ACTIVE' })]);
        (document.querySelector('.mb-chip[data-category="social"]') as HTMLElement).click();
        expect(cards()).toBe(0);
        expect(count()).toBe('0');
        expect(document.querySelector('.mb-empty')).toBeTruthy();
    });

    it('sort reorders the same set without changing the count', async () => {
        const data = Array.from({ length: 5 }, (_, i) => mkRivalry(i, { state: 'ACTIVE' }));
        await boot(data);
        const before = [...document.querySelectorAll('.mb-c-rcpt')].map((n) => n.textContent);
        const sel = document.getElementById('mb-sort') as HTMLSelectElement;
        sel.value = 'closing';
        sel.dispatchEvent(new Event('change'));
        const after = [...document.querySelectorAll('.mb-c-rcpt')].map((n) => n.textContent);
        expect(after.length).toBe(before.length);
        expect(new Set(after)).toEqual(new Set(before));
        sel.value = 'volume';
        sel.dispatchEvent(new Event('change'));
        const pools = [...document.querySelectorAll('.mb-c-stake .k')].map((n) =>
            Number(String(n.textContent).replace(/[^0-9]/g, '')));
        expect([...pools].sort((a, b) => b - a)).toEqual(pools);
    });

    it('a failed fetch shows retry, never a fallback card', async () => {
        document.body.innerHTML = renderActiveContracts();
        install([]);
        (globalThis as any).window.api.getRivalries = async () => { throw new Error('boom'); };
        initActiveContracts();
        for (let i = 0; i < 40; i++) await new Promise((r) => setTimeout(r, 0));
        expect(cards()).toBe(0);
        expect(document.querySelector('.mb-retry')).toBeTruthy();
        expect(count()).toBe('—');
    });

    it('card action opens that card\'s own contract', async () => {
        await boot([mkRivalry(0), mkRivalry(1)]);
        const acts = document.querySelectorAll('.mb-c-act');
        (acts[0] as HTMLElement).click();
        (acts[1] as HTMLElement).click();
        const calls = (window as any).router.navigate.mock.calls.map((c: any[]) => c[0]);
        expect(new Set(calls).size).toBe(2);
        calls.forEach((p: string) => expect(p).toMatch(/^\/rivalry\/riv-\d$/));
    });
});
