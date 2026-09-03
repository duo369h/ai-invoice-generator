# Portal / Approval Correction

Free, Starter, Pro, and legacy Studio compatibility entitlements now return `client_portal=false`, `client_approval=false`, and `approval_scope=none`. Studio remains compatibility-only and is not surfaced as a current marketed Portal/Approval capability.

Dashboard navigation and current Portal/Approval CTAs were removed. The existing Portal backend foundation remains present but is unavailable through the current contract.

The entitlements API normalizes stale stored Portal/Approval fields to the current contract. The Portal token generation route returns neutral `FEATURE_NOT_AVAILABLE` with HTTP 403 and does not return `requiredPlan=pro`.
