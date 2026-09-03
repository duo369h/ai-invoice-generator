# Proposal Runtime

Authenticated local production-mode compatibility checks passed:

- `/proposal` -> 307 `/dashboard?tool=quotes`
- `/proposals` -> 307 `/dashboard?tool=quotes`
- `POST /api/proposals/generate` -> HTTP 410 with `code=LEGACY_SURFACE_UNAVAILABLE`

PROPOSAL_RUNTIME=PASS
PROPOSAL_OUTPUT=NONE
