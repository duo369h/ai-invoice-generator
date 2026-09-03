# Browser Runtime Method

Used the existing Playwright Chromium runtime against a locally built Next production server. A temporary local HTTP Supabase fixture supplied an authenticated session and deterministic long-content records; API responses were intercepted in the browser context. The fixture values were synthetic and ephemeral.

Required widths and heights:

- 320x700
- 375x812
- 390x844
- 768x1024
- 1280x900

At each width the harness measured document/body scroll width, visible card client/scroll widths, action-button bounds, long-content text boxes, and modal bounds. It also exercised Overview, Invoices, Clients, Quotes, empty state, error state, Record Payment, and Export Purpose. Lead CRM is not reachable from the current authorized Dashboard navigation, so no Lead modal claim is made.
