// @vitest-environment happy-dom
/**
 * Source Matrix Tests (step 02 on /market)
 *
 * The availability column used to be a plain text link whose wording the
 * source-state code rewrote with `go.textContent = '...'`. It now carries a
 * platform mark and an arrow beside the label, and textContent replaces ALL of
 * it — so the mark would be wiped by the first paint on load, which is the one
 * failure mode of this design that would ship looking fine locally.
 *
 * Hence the relabelling case below: every path that rewords a row must go
 * through setGoLabel and leave the mark standing.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderActiveContracts, initActiveContracts } from '../FRONTEND/src/views/ActiveContracts.js';

function boot() {
    document.body.innerHTML = renderActiveContracts();
    (globalThis as any).window.api = {
        hasAuthToken: () => false,
        getRivalries: async () => ({ rivalries: [], total: 0 }),
        getMyRivalries: async () => ({ rivalries: [], total: 0 }),
        getRivalryMetrics: async () => ({ metrics: [] }),
        getRivalryStats: async () => ({ stats: {} }),
        getPublicResults: async () => ({ results: [] }),
    };
    (globalThis as any).window.router = { navigate: vi.fn() };
    initActiveContracts();
}

const settle = () => new Promise((r) => setTimeout(r, 30));

describe('source matrix', () => {
    it('renders four metric rows, the legend, the bank band and the platform marks', async () => {
        boot();
        await settle();
        expect(document.querySelectorAll('.mb-matrix .mb-mx-r').length).toBe(4);
        expect(document.querySelectorAll('.mb-mx-legend .mb-lg').length).toBe(3);

        // The band runs the full height: the header cell plus one cell per row.
        expect(document.querySelectorAll('.mb-bankcol').length).toBe(5);

        // Bank has no platform mark — the other three do.
        const glyphs = document.querySelectorAll('.mb-mx-avail .ss-go svg.glyph');
        expect(glyphs.length).toBe(3);
        // Decorative: the label beside each already names the platform.
        glyphs.forEach((g) => expect(g.getAttribute('aria-hidden')).toBe('true'));

        expect(document.querySelector('.mb-mx-note')).toBeTruthy();
        const labels = [...document.querySelectorAll('.ss-go .lbl')].map((n) => n.textContent);
        expect(labels).toEqual(['Connect bank', 'Connect Stripe', 'Connect Shopify', 'Connect YouTube']);
    });

    it('relabelling a row keeps its platform mark and arrow', async () => {
        boot();
        await settle();
        const go = document.querySelector('.ss-metric[data-metric="mrr"] .ss-go')!;
        (window as any).app.setMetricHistoryState('mrr', 6, 6, 'March');
        expect(go.querySelector('svg.glyph')).toBeTruthy();
        expect(go.querySelector('.arw')).toBeTruthy();
        expect(go.querySelector('.lbl')!.textContent).toBe('Write this contract →');
    });

    it('each metric row carries its own descriptor', async () => {
        boot();
        await settle();
        const d = [...document.querySelectorAll('.mb-mx-r .mb-md')].map((n) => n.textContent);
        expect(d).toEqual(['Income · in dollars', 'Recurring revenue', 'Order count', 'View count']);
    });
});
