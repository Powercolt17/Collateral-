/**
 * Collateral Branded Loader - Global Consistent Spinner
 * Returns inline HTML for loading states.
 * Minimalist, Stripe-style single-arc spinner.
 *
 * @param {number} size - Pixel size of the loader (default 32)
 * @returns {string} HTML string
 */
export function collateralSpinner(size = 32) {
    return `
        <div class="cl-premium-spinner" style="position:relative; width:${size}px; height:${size}px; display:inline-block; vertical-align:middle; box-sizing:border-box;">
            <div style="position:absolute; inset:0; border:1.5px solid rgba(139, 32, 32, 0.1); border-top-color:#8B2020; border-radius:50%; animation:cl-spin-clockwise 0.75s cubic-bezier(0.4, 0.1, 0.2, 1) infinite; box-sizing:border-box;"></div>
        </div>`;
}

/**
 * Full-page loading block with centered Collateral loader
 * @param {string} [message] - Optional loading message
 * @param {number} [size] - Loader size
 * @returns {string} HTML string
 */
export function collateralFullLoader(message = '', size = 32) {
    return `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 0;gap:12px;">
            ${collateralSpinner(size)}
            ${message ? `<div style="font-family:var(--font-data);font-size:10px;color:#888;letter-spacing:0.12em;text-transform:uppercase;margin:0;">${message}</div>` : ''}
        </div>`;
}
