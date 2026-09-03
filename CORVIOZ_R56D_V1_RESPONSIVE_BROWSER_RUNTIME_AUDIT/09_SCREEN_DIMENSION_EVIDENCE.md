# Screen Dimension Evidence

The machine-readable measurement record is `browser-artifacts/responsive-evidence.json`. It records body/document scroll widths, card clipping checks, action bounds, long-content bounds, and modal controls for each run.

Observed final page widths:

- 320 viewport: body/document scroll width 320; no overflow
- 375 viewport: body/document scroll width 375; no overflow
- 390 viewport: body/document scroll width 390; no overflow
- 768 viewport: body/document scroll width 768; no overflow
- 1280 viewport: body/document scroll width 1280; no overflow

Final action-button bounds remained inside the viewport, including mobile invoice actions. Modal cards and their close/primary controls remained reachable; the 320px modal run had vertical content exceeding the card's visible height and therefore demonstrated scroll availability.
