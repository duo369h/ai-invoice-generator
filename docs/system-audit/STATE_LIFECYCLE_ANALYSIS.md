# STATE_LIFECYCLE_ANALYSIS.md — Corvioz Final Snapshot

## 1. User Lifecycle Flow
```
[Guest Mode] -> Local usage stats mapped in localStorage
      |
      v
[Active Free] -> Authenticated profile binds. Local metrics persist.
      |
      v
[Paying User] -> Paddle hooks update database plan.
      |
      v
[Upgrade Phase] -> Client triggers modals based on usage checkpoints.
      |
      v
[Paywall Intercept] -> Control plane gates actions.
```

## 2. State Divergence & Duplication
*   **Plan Resolution Race:** `Dashboard.js` updates user-specific plan keys in localStorage, while the orchestrator reads generic keys.
*   **Stale Local Cache:** After checking out, client-side views persist showing the old tier layout because local variables are not refreshed concurrently with database updates.
*   **Supabase Auth Hydration:** During route transitions, server-side cookies mismatch client local storage keys.
