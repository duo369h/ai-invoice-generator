# Proposal compatibility boundary

`/proposal` and `/proposals` now redirect to `/dashboard?tool=quotes`. `/api/proposals/generate` returns neutral HTTP 410 `LEGACY_SURFACE_UNAVAILABLE` before its historical implementation, so no new Proposal output is generated. Current core navigation and upsell remain Quote-only.

PROPOSAL_CURRENT_NAVIGATION=NO
PROPOSAL_UPSELL_COPY=NONE
