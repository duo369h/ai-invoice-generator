# CORVIOZ Authority Map

Discovery and scoped reconciliation record for `CORVIOZ_PUBLIC_AUTHORITY_RECONCILIATION_R1`.

## Baseline

| Field | Value |
|---|---|
| BASE_MAIN_SHA | `5a7263762e8566e092c1e4eea2f630499557b677` |
| BASE_MAIN_MATCH | PASS (`origin/main`) |
| Worktree | `/private/tmp/corvioz-public-authority-r1-20260822` |
| Branch | `codex/public-authority-reconciliation-r1-20260822` |
| Reconciliation commit | Created after verification; see final handoff |

## Authority inventory

Fields use the requested meanings. `LOCAL_PATH` identifies the source of truth or the current implementation under audit. Design directories are local artifact authorities, not Git worktrees; their branch and commit are therefore `N/A`.

### Public shell and brand

| NAME | LOCAL_PATH | GIT_BRANCH | COMMIT_SHA | STATUS | FROZEN | COMPLETE | MAIN | PRODUCTION | CLASSIFICATION |
|---|---|---|---|---|---|---|---|---|---|
| Public shell raw authority | `/Users/duo/Documents/Corvioz-Design/public-shell-v2-freeze/raw` | N/A | N/A | FROZEN | YES | YES | PARTIAL | UNKNOWN | FROZEN_AUTHORITY |
| PublicHeader implementation | `/private/tmp/corvioz-public-authority-r1-20260822/src/app/components/PublicHeader.js` | `codex/public-authority-reconciliation-r1-20260822` | UNCOMMITTED; base `5a726376...` | scoped reconciliation | YES (source authority) | PARTIAL | YES | UNKNOWN | PARTIALLY_INTEGRATED |
| SharedFooter implementation | `/private/tmp/corvioz-public-authority-r1-20260822/src/app/components/SharedFooter.js` | `codex/public-authority-reconciliation-r1-20260822` | UNCOMMITTED; base `5a726376...` | scoped reconciliation | YES (source authority) | PARTIAL | YES | UNKNOWN | PARTIALLY_INTEGRATED |
| Logo / favicon / app icons | `/private/tmp/corvioz-public-authority-r1-20260822/public/{logo-dark.svg,logo-light.svg,logo-symbol.svg,logo-wordmark.svg,favicon.ico,favicon.svg,apple-touch-icon.png}` | `codex/public-authority-reconciliation-r1-20260822` | base `5a726376...` | present and referenced | UNKNOWN | YES (source presence) | YES | UNKNOWN | COMPLETED_AUTHORITY |
| Metadata / OG / Twitter / manifest | `/private/tmp/corvioz-public-authority-r1-20260822/src/app/layout.js` and `/private/tmp/corvioz-public-authority-r1-20260822/public/{og-image.png,twitter-image.png,manifest.webmanifest}` | `codex/public-authority-reconciliation-r1-20260822` | base `5a726376...` | present and referenced | UNKNOWN | YES (source presence) | YES | UNKNOWN | COMPLETED_AUTHORITY |

### Public pages

| NAME | LOCAL_PATH | GIT_BRANCH | COMMIT_SHA | STATUS | FROZEN | COMPLETE | MAIN | PRODUCTION | CLASSIFICATION |
|---|---|---|---|---|---|---|---|---|---|
| Home visual authority (V1C) | `/Users/duo/Documents/corvioz-home-01-desktop-cohesion-prototypes/final-qa-v1c/final-home-01-qa.html` + `styles.css` | N/A | HTML `e373bdf800c95c9b3a91b5c06ec16858841883e9f46d2260b43310871dc290c2`; CSS `ea9779ed34b2ffc2a20d68942b9d3a3dc02919dc4864e4865b56e3a120e5ed58` | DESIGN_STATUS=FROZEN; V1C evidence bundle | YES | YES | PARTIAL (candidate integration) | UNKNOWN | FROZEN_AUTHORITY |
| Home implementation lineage | `/Users/duo/Documents/想做个网站/corvioz-home-01` | N/A | historical lineage; not visual authority | retained as implementation lineage only | UNKNOWN | PARTIAL | PARTIAL | UNKNOWN | LEGACY |
| Home current implementation | `/private/tmp/corvioz-public-authority-r1-20260822/src/app/page.js` plus `src/app/home` and `public/home-v1c.css` | `codex/public-authority-reconciliation-r1-20260822` | uncommitted; base `a4fc27465b56c69bddcf8af0a7077ca08734d3d4` | full-page V1C adaptation with current Main product truth | NO | YES (source-level) | YES (candidate) | UNKNOWN | COMPLETED_AUTHORITY |
| For Photographers design authority | `/Users/duo/Documents/Corvioz-Design/for-photographers-v2/codex-10-1-accessibility-remediation` | N/A | N/A; registry hashes available | DESIGN_STATUS=FROZEN | YES | YES (design artifact) | PARTIAL | UNKNOWN | FROZEN_AUTHORITY |
| For Photographers implementation | `/private/tmp/corvioz-public-authority-r1-20260822/src/app/for-photographers/page.js` | `codex/public-authority-reconciliation-r1-20260822` | reconciliation commit | full page sections, shared shell, responsive styles, and product-boundary copy reconciled | YES (design source) | YES (source-level) | YES | UNKNOWN | COMPLETED_AUTHORITY |
| Pricing V2 design authority | `/Users/duo/Documents/Corvioz-Design/pricing-v2/full-page-visual-assembly-08-final` | N/A | N/A; registry hashes available | APPROVED_DESIGN_AUTHORITY / FROZEN | YES | YES (design artifact) | PARTIAL | UNKNOWN | FROZEN_AUTHORITY |
| Pricing V2 implementation | `/private/tmp/corvioz-public-authority-r1-20260822/src/app/pricing/page.js` | `codex/public-authority-reconciliation-r1-20260822` | reconciliation commit | existing V2 page retained; full-page styles and runtime truth preserved | YES (design source) | YES (source-level) | YES | UNKNOWN | COMPLETED_AUTHORITY |
| How It Works | `/Users/duo/Documents/Corvioz-Design/how-it-works-freeze-v1/source/candidate-a` | N/A | N/A | FROZEN_CANDIDATE; not integrated by R1 | UNKNOWN | NO | NO | UNKNOWN | CANDIDATE |
| Why Corvioz | No separate accepted frozen implementation located; Home sections are the accepted lineage | N/A | N/A | no standalone authority | UNKNOWN | NO | PARTIAL as Home section | UNKNOWN | UNKNOWN |
| Resources | No separate accepted frozen implementation located; Home sections are the accepted lineage | N/A | N/A | no standalone authority | UNKNOWN | NO | PARTIAL as Home section | UNKNOWN | UNKNOWN |
| FAQ | No separate accepted frozen route authority located; Home FAQ is the accepted lineage | N/A | N/A | no standalone route authority | UNKNOWN | PARTIAL as Home section | PARTIAL | UNKNOWN | UNKNOWN |
| Sign In / auth public surface | `/private/tmp/corvioz-public-authority-r1-20260822/src/app/auth/page.js` and `/private/tmp/corvioz-public-authority-r1-20260822/src/app/components/PublicHeader.js` | `codex/public-authority-reconciliation-r1-20260822` | base `5a726376...` | functional Main authority retained; no visual replacement claimed | UNKNOWN | PARTIAL | YES | UNKNOWN | COMPLETED_AUTHORITY |

### Dashboard inventory — explicitly out of scope for R1

| NAME | LOCAL_PATH | GIT_BRANCH | COMMIT_SHA | STATUS | FROZEN | COMPLETE | MAIN | PRODUCTION | CLASSIFICATION |
|---|---|---|---|---|---|---|---|---|---|
| Dashboard historical candidate | `/Users/duo/Corvioz-Validation/dashboard-ui-integration-20260729` | `integration/dashboard-ui-20260729` | `e59344756956ba8884ad169141843f3c73c8a269` | historical candidate; not assumed final | NO | PARTIAL | NO | UNKNOWN | CANDIDATE |
| Dashboard current functional implementation | `/private/tmp/corvioz-public-authority-r1-20260822/src/components/dashboard/Dashboard.js` | `codex/public-authority-reconciliation-r1-20260822` | base `5a726376...` | preserved unchanged | UNKNOWN | UNKNOWN | YES | UNKNOWN | COMPLETED_AUTHORITY |
| Dashboard shell/sidebar/Quotes/Invoices/Clients/Account/Settings | `/private/tmp/corvioz-public-authority-r1-20260822/src/components/dashboard` and `src/app/{dashboard,quotes,invoices,client}` | `codex/public-authority-reconciliation-r1-20260822` | base `5a726376...` | not reconciled in R1 | UNKNOWN | UNKNOWN | YES | UNKNOWN | FROZEN_AUTHORITY |
| Client Portal surfaces and loading/empty/error states | `/private/tmp/corvioz-public-authority-r1-20260822/src/app/portal` and `src/app/client-portal` | `codex/public-authority-reconciliation-r1-20260822` | base `5a726376...` | preserved; not reconciled in R1 | UNKNOWN | UNKNOWN | YES | UNKNOWN | FROZEN_AUTHORITY |
| Mobile/responsive Dashboard | Current Main dashboard responsive implementation; no newer frozen authority proven | `integration/dashboard-ui-20260729` is only known historical candidate | see candidate row | unresolved; intentionally out of scope | UNKNOWN | UNKNOWN | PARTIAL | UNKNOWN | UNKNOWN |

## Reconciliation evidence

- `git fetch origin` completed; `origin/main` equals the required Main SHA.
- Clean isolated worktree began at the required SHA with no pre-existing changes.
- Only five public files are modified; no API, auth, entitlement, dashboard, payment, revenue, email, Supabase, migration, or database files changed.
- `npm run build`: PASS. `npm run lint`: PASS, 0 errors and 83 existing warnings.
- UI Guard: PASS. Pricing V2 suite: 22 passed, 0 failed. Invoice route: 5 passed, 0 failed. Invoice/payment state: 88 passed, 0 failed. Payment write/read guardrails: 82/74 passed, 0 failed. Production PDF runtime: PASS. Portal approval idempotency: PASS. Pricing CTA: PASS.
- `git diff --check`: PASS.
- `verify-pricing-contract.mjs`: its two static checks target an unchanged Main pricing-page pattern; runtime/view-model checks pass. No pricing runtime file changed.
- `verify-entitlements.mjs`: local Chromium/macOS permission prevented this optional browser harness; entitlement source was unchanged and the non-browser runtime suite passed.
- Fresh browser evidence: no Home console errors; all required V1C viewports captured; mobile menu open state, footer views, favicon resources, normal in-view autoplay, and reduced-motion no-autoplay verified locally.

## Required summary

```text
PUBLIC_SHELL_AUTHORITY=/Users/duo/Documents/Corvioz-Design/public-shell-v2-freeze/raw
HOME_AUTHORITY=/Users/duo/Documents/corvioz-home-01-desktop-cohesion-prototypes/final-qa-v1c (visual); implementation lineage=/Users/duo/Documents/想做个网站/corvioz-home-01
FOR_PHOTOGRAPHERS_AUTHORITY=/Users/duo/Documents/Corvioz-Design/for-photographers-v2/codex-10-1-accessibility-remediation
PRICING_AUTHORITY=/Users/duo/Documents/Corvioz-Design/pricing-v2/full-page-visual-assembly-08-final
HOW_IT_WORKS_AUTHORITY=/Users/duo/Documents/Corvioz-Design/how-it-works-freeze-v1/source/candidate-a (CANDIDATE ONLY; NOT INTEGRATED)
WHY_CORVIOZ_AUTHORITY=No standalone frozen authority; accepted Home section only
RESOURCES_AUTHORITY=No standalone frozen authority; accepted Home section only
AUTH_UI_AUTHORITY=Current Main at 5a7263762e8566e092c1e4eea2f630499557b677
DASHBOARD_AUTHORITY=Current Main at 5a7263762e8566e092c1e4eea2f630499557b677; historical candidate e59344756956ba8884ad169141843f3c73c8a269 is not final
MISSING_AUTHORITIES=Standalone Why Corvioz, Resources, FAQ, newer frozen Dashboard, independent review acceptance
AMBIGUOUS_AUTHORITIES=Dashboard newer/frozen status; standalone public auth visual authority
SAFE_TO_BEGIN_RECONCILIATION=YES
REAL_BLOCKER=NONE
```
