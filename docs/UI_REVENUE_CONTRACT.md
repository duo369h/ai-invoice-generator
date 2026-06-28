# UI Revenue Contract

> **Stripe-grade UI access boundary for Revenue Intelligence.**
> This contract is enforced by the CI gate and architecture review.

---

## Final System Rule

> **Revenue Intelligence is NOT a UI provider.**
> **It is a signal generator only.**
> **All UI interpretation must go through the Adapter Layer.**

---

## What UI Is Allowed to Read

UI components may **only** consume the following fields, accessed via `systemView.uiHints.revenueUI`:

| Field | Type | Description |
|-------|------|-------------|
| `uiHints.revenueUI.badge.label` | `string` | Human-readable stage label (e.g., "Awareness") |
| `uiHints.revenueUI.badge.color` | `string` | Display color for the badge |
| `uiHints.revenueUI.cta.label` | `string` | CTA button text (e.g., "Start Proposal") |
| `uiHints.revenueUI.cta.href` | `string` | CTA destination URL |
| `uiHints.revenueUI.cta.action` | `string` | Machine-readable action name |
| `uiHints.revenueUI.insight.headline` | `string` | Primary insight message |
| `uiHints.revenueUI.insight.subtext` | `string` | Supporting insight message |
| `uiHints.revenueUI.pricingTag.price` | `string` | Formatted price (e.g., "$19/mo") |
| `uiHints.revenueUI.pricingTag.description` | `string` | Price tier description |

---

## What UI Must NOT Access

UI components must **never** access the following fields directly:

| Forbidden Field | Reason |
|----------------|--------|
| `revenueIntelligence.revenueStrategy` | Raw strategy enum — use `revenueUI.badge.label` |
| `revenueIntelligence.funnelBottleneck` | Raw bottleneck signal — use `revenueUI.insight.subtext` |
| `revenueIntelligence.pricingSuggestion` | Raw price string — use `revenueUI.pricingTag.price` |
| `revenueIntelligence.revenueProbability` | Raw probability — not for UI display |
| `revenueIntelligence.userSegment` | Internal segment — not for UI display |

---

## Access Pattern (Correct)

```javascript
// ✅ CORRECT — UI reads only from Adapter output
const systemView = getSystemView(userContext);
const uiRevenue = systemView.uiHints.revenueUI;

// Render
uiRevenue.badge.label       // "Conversion"
uiRevenue.cta.label         // "Start Proposal"
uiRevenue.insight.headline  // "You're ready to create your first proposal"
uiRevenue.pricingTag.price  // "$19/mo"
```

---

## Access Pattern (Forbidden)

```javascript
// ❌ FORBIDDEN — UI reads raw Revenue Intelligence fields
const intel = getRevenueIntelligence(userState);
intel.revenueStrategy    // NEVER
intel.funnelBottleneck   // NEVER
intel.pricingSuggestion  // NEVER
```

---

## Adapter Layer

All translation from raw signals to UI values is performed exclusively in:

```
src/core/revenue/REVENUE_ADAPTER_LAYER.ts
```

This is the **only** place where `RevenueIntelligence` fields are read and converted to UI-safe values.

---

## CI Enforcement

The following checks are enforced automatically:

```bash
node scripts/validate-launch-system.ts
```

- `uiHints.revenueUI` must be present in `SystemView`
- `revenueUI.badge`, `cta`, `insight`, `pricingTag` must all be non-null
- UI files must not contain `.revenueStrategy`, `.funnelBottleneck`, `.pricingSuggestion`, or `.revenueProbability`
- `REVENUE_ADAPTER_LAYER.ts` must export `adaptRevenueToUI`
