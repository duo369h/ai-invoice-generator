# Corvioz Client Detection Logic v1.5

This document details the frontend hooks, telemetry events, and state changes triggered when client profiles are created or updated.

---

## 1. Context Trigger Rules

We track the size of the user's active client roster to evaluate business growth milestones:

```javascript
const currentClientCount = clients ? clients.length : 0;
const res = await saveClient(payload, session?.access_token);
if (res.success) {
  // Check count prior to insertion
  if (currentClientCount === 0) {
    setShowBusinessModeModal(true);
    trackEvent('business_mode_activated', { source: 'first_client_creation' });
  } else if (currentClientCount === 1) {
    setShowStudioPreviewModal(true);
    setStudioPreviewActive(true);
    trackEvent('studio_preview_triggered', { source: 'second_client_creation' });
  }
}
```

---

## 2. Onboarding Milestones

### Milestone A: Freelancer Transition (1st Client)
- **Goal**: Reframe the user's perception of Corvioz from an utility document tool to a client relations platform.
- **Visual Trigger**: `BusinessModeModal` overlays the screen upon saving the client.
- **Value Position**:
  - Highlights shifting from "one-off freelancer tasks" to "organized business relationships".
  - Recommends the **Pro plan ($9/mo)** as a mechanism for upgrading communication standards (custom portal, signature approvals, and watermark-free delivery).

### Milestone B: Scaling Studio Operations (2nd Client)
- **Goal**: Introduce the Studio tier as the central command center for multi-client workflows.
- **Visual Trigger**: `StudioPreviewWelcomeModal` overlays the screen upon saving the client.
- **Access Granted**: Sets `studioPreviewActive(true)`. This unlocks:
  - Sidebar access: The locked "Studio Space" menu item is unlocked.
  - A visually distinct, glowing **"Preview"** badge renders next to the Studio Space menu option.
  - Passes `isStudioPreview={true}` to the `StudioSpace` component, displaying a glass-morphic upgrade top-banner inside the workspace.
- **Value Position**: Reframes the Studio tier as a "scale operations hub" (Client Status Board, Overdue Invoice logs, automated email reminder tools) rather than just functional feature upgrades.
