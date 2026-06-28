# Corvioz Export Value Psychology & Visual Hierarchy

**Date**: 2026-06-22  
**Goal**: Design the UI/UX perception layer to highlight the difference between free and premium exports, driving upgrade conversions.

---

## 1. The Psychology of the Paywall
When paywalls feel sudden or hidden, they trigger frustration. To drive conversions, we must align the paywall with **the user's professional pride**. 
By showing the watermark early, we change the user's perception:
- **Free Export**: Framed as a *"Draft Copy"* (good for double-checking details, internal review).
- **Pro Export**: Framed as *"Client-Ready / Professional"* (clean, watermark-free, reflects high trust).

---

## 2. Recommended UI/UX Enhancements

### A. The "Client View" Preview Toggle
In the invoice and quote creation workspace, display a small visual switcher above the document preview frame:
* **Option 1**: `Draft View (Free)` — displays a subtle diagonal watermark string *"Draft &bull; Made with Corvioz Free"* overlaid across the document canvas.
* **Option 2**: `Client View (Pro)` — removes the watermark, showing a clean, high-contrast, professional template.
* **Conversion Prompt**: Selecting `Client View (Pro)` triggers a micro-toolip: *"Pro members export clean, watermark-free PDFs to their clients. [Upgrade to Pro]"*.

### B. The Export Paywall Modal Copy Structure
When a Free user clicks "Export PDF", the upgrade popup must establish a stark value contrast:

| Free Draft Export | Pro Client-Ready Export |
|:---|:---|
| ❌ diagonal Corvioz watermark | ✅ 100% clean, watermark-free document |
| ❌ Generic template branding | ✅ High-resolution layout optimization |
| ❌ Standard download limits | ✅ Unlimited exports for all clients |
| *Best for internal testing* | *Best for active billing & trust* |

---

## 3. Implementation Code References

In the preview pane component within `src/components/dashboard/Dashboard.js`, include a CSS watermark layer conditioned on the user's active plan:

```javascript
{isFreePlan && (
  <div style={{
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    opacity: 0.05,
    userSelect: 'none',
    zIndex: 10
  }}>
    <span style={{
      fontSize: '5rem',
      fontWeight: 900,
      transform: 'rotate(-45deg)',
      letterSpacing: '0.1em',
      color: 'var(--text-main)'
    }}>DRAFT &bull; FREE TIER</span>
  </div>
)}
```
Showing this watermark in the preview aligns expectations, so clicking "Export" and seeing the choice to upgrade to Pro feels like a natural path to obtaining the professional version.
