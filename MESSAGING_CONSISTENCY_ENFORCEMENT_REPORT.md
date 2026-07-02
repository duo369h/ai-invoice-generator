# A. Inconsistency Report

Scope scanned: `src/app`, `src/components`, `lib`, and `src/core` frontend-facing surfaces, with focus on homepage, pricing page, FAQ, feature components, CTA buttons, footer, dashboard labels, modals, SEO content generators, and shared UI copy. Internal comments, telemetry names, backend route code, and non-visible implementation identifiers are not treated as user-facing copy unless they are rendered into UI.

## Current Messaging Model

Approved model:

- Product identity: Freelancer Workflow System
- Supporting identity: client delivery workspace
- Product objects: quotes, proposals, invoices, client records, documents
- Paddle wording: Secure checkout provider: Paddle

## Main Alignment Status

The homepage and pricing page are mostly aligned with the approved model. The remaining inconsistencies are concentrated in:

- Dashboard quote and invoice labels
- Studio dashboard panels
- SEO generator copy in `src/app/lib/seo-data.js`
- Upgrade and upsell modals
- Footer and FAQ payment wording
- Proposal creation component AI/payment upgrade language

## Inconsistency Groups

| Group | Current wording pattern | Why inconsistent | Severity |
|---|---|---|---|
| Revenue-oriented language | `Revenue`, `Revenue (Total Paid)`, `Revenue Flow Insight`, `Revenue change`, `revenue workspace`, `revenue capture`, `revenue increase`, `Revenue Autopilot` | Conflicts with Freelancer Workflow System positioning and implies financial/income optimization. | High |
| Financial system language | `Financial Total`, `Financial Summary`, `Cash Flow Overview`, `Pipeline Value`, `Ledger`, `Aggregated Ledger`, `LTV`, `Outstanding` | Makes Corvioz read like a finance, ledger, accounting, or billing system instead of a document workflow workspace. | High |
| Payment-processing language | `Pay Link`, `Online Checkout URL`, `accept credit card/bank payments`, `payment-linked emails`, `submit payment securely`, `processed transaction` | Can imply Corvioz processes payments or moves money. | High |
| Accounting/tax positioning | `tax-compliant professional invoices`, `accounting software`, `ledger reconciliation`, `professional accountants`, `tax-ready records` | Creates accounting-system expectations and Paddle compliance sensitivity. | High |
| AI pricing/income optimization | `AI Scope Expansion`, `AI Writer`, `Generate Scope`, `AI creations`, `AI pricing`, pricing optimization engines in visible/dashboard-adjacent surfaces | Adds AI capability/optimization claims outside the approved Product Truth Model. | Medium-High |
| Paid/subscription wording drift | `Paid plan checkout via Paddle`, `paid tiers`, `paid upgrades`, `Secure paid-plan checkout` | Acceptable only as subscription support copy, but should be standardized. | Medium |
| Unsupported outcome claims | `boosting client acceptance and alignment by 30%`, `Clients usually respond within 24h`, `Build Stable Freelance Income`, `secure recurring freelance income` | Adds performance or income promises not allowed by the model. | High |
| Payment/document confusion | `Payment Terms`, `Payment Notes`, `Payment Reminder`, `payment instructions`, `payment status tracking` | Invoice document terms are acceptable only as secondary document fields; current wording over-centers payment. | Medium-High |

## User-Facing Hotspots

| File | Current phrase / pattern | Required normalization |
|---|---|---|
| `src/components/dashboard/Dashboard.js` | `Financial Total` | `Document Total` |
| `src/components/dashboard/Dashboard.js` | `Financial Summary` | `Document Summary` |
| `src/components/dashboard/Dashboard.js` | `Generate tax-compliant professional invoices, track payments automatically, and accept credit card/bank payments from your clients.` | Replace with invoice document / client record workflow language. |
| `src/components/dashboard/Dashboard.js` | `Pay Link` | `Client Link` or `Document Link` |
| `src/components/dashboard/Dashboard.js` | `Online Checkout URL` | `Client Document Link` |
| `src/components/dashboard/Dashboard.js` | `Payment Terms` | `Invoice Terms` |
| `src/components/dashboard/Dashboard.js` | `Payment Notes` | `Invoice Notes` |
| `src/components/dashboard/Dashboard.js` | `Bank details, wire instructions...` | `Document notes for the client...` |
| `src/components/dashboard/Dashboard.js` | `AI Scope Expansion & Design Presets` | Remove AI claim; use scope/document presets language. |
| `src/components/dashboard/Dashboard.js` | `AI Writer` | Remove AI claim; use `Scope Helper` or `Document Helper`. |
| `src/components/dashboard/Dashboard.js` | `Generate Scope` | `Prepare Scope` |
| `src/components/dashboard/Dashboard.js` | `boosting client acceptance and alignment by 30%` | Remove quantified outcome claim. |
| `src/components/dashboard/Dashboard.js` | `Clients usually respond within 24h after invoice delivery.` | Remove time-based outcome claim. |
| `src/app/dashboard/components/StudioSpace.js` | `Agency Operating System` | `Studio Client Workspace` |
| `src/app/dashboard/components/StudioSpace.js` | `payment reminders` | `client follow-up reminders` |
| `src/app/dashboard/components/StudioSpace.js` | `Revenue (Total Paid)` | `Completed Document Total` |
| `src/app/dashboard/components/StudioSpace.js` | `Cash Flow Overview` | `Document Status Overview` |
| `src/app/dashboard/components/StudioSpace.js` | `Upcoming Payments Ledger` | `Upcoming Invoice Documents` |
| `src/app/dashboard/components/StudioSpace.js` | `Collections Calendar` | `Due Date Calendar` |
| `src/app/dashboard/components/StudioSpace.js` | `Paid & Settled` | `Completed` |
| `src/app/dashboard/components/StudioSpace.js` | `No payments processed yet.` | `No completed invoice documents yet.` |
| `src/app/dashboard/components/StudioSpace.js` | `Payment Reminder Template Composer` | `Client Follow-up Template Composer` |
| `src/app/dashboard/components/StudioSpace.js` | `payment-linked emails` | `client follow-up emails` |
| `src/app/dashboard/components/StudioSpace.js` | `Aggregated Ledger` | `Document Overview` |
| `src/app/dashboard/components/StudioSpace.js` | `Primary Billing Email` | `Primary Client Email` |
| `src/app/lib/seo-data.js` | `payment links`, `payment status tracking`, `paid and overdue balances` | Reframe as invoice document links, review status, due dates, and document records. |
| `src/app/lib/seo-data.js` | `billing workflow`, `billing scenarios`, `billing model` | Reframe as client document workflow, invoice document scenarios, document structure. |
| `src/app/lib/seo-data.js` | `AI ... generator`, `optimized for ... billing` | Remove AI and billing optimization claims. |
| `src/app/lib/seo-data.js` | `reduce payment friction`, `path from scope to payment`, `request payment` | Reframe as document handoff and client review workflow. |
| `src/components/ui/UpgradeModal.js` | `roiAnchor` rendered in modal | Replace ROI/value wording with workflow capacity wording. |
| `src/components/ui/UpgradeModal.js` | `Secure checkout • Cancel or downgrade anytime` | `Secure checkout provider: Paddle • Cancel anytime` |
| `src/components/ui/PricingUpsellModal.js` | `Secure paid-plan checkout` | `Secure checkout provider: Paddle` |
| `src/components/ui/PricingUpsellModal.js` | `Smart automated reminders` | `Client follow-up reminders` |
| `src/components/proposal/ProposalCreationFlow.js` | `First Payment Moment Optimization` | Remove from user-facing/comment-adjacent copy if surfaced; not approved positioning. |
| `src/components/proposal/ProposalCreationFlow.js` | `Deliver clean, watermark-free proposals. Upgrade to Pro...` | Acceptable if framed as document export; avoid payment moment language. |
| `src/app/page.js` | `Paid plan checkout is handled securely by Paddle.` | `Secure checkout provider: Paddle.` |
| `src/app/page.js` | `Paid upgrades include...` | `Subscription plans include...` |
| `src/app/page.js` | `paid tiers` | `subscription plans` |
| `src/app/pricing/page.js` | `Paid plan checkout is handled securely by Paddle` | `Secure checkout provider: Paddle` |
| `src/app/pricing/page.js` | `paid tiers`, `paid plan` | `subscription plan` |
| `src/app/components/SharedFooter.js` | `Paid plan checkout via Paddle` | `Secure checkout provider: Paddle` |

# B. Required Replacements List

Use this as the normalization checklist before Paddle submission.

| Disallowed / inconsistent term | Required replacement | Notes |
|---|---|---|
| Revenue OS | Freelancer Workflow System | Do not use revenue as product identity. |
| Revenue | Workflow / Client workflow / Document workflow | Use `revenue` only in internal code, not visible UI. |
| Revenue (Total Paid) | Completed Document Total | If a numeric total must remain visible, frame it as document status. |
| Revenue Flow Insight | Client Workflow Insight | Avoid payment/revenue funnel framing. |
| Revenue change | Workflow activity | Remove money outcome implication. |
| Revenue Autopilot | Workflow Overview | Autopilot/income optimization is not approved. |
| Financial | Document / Workflow / Client | Applies to table headers and panels. |
| Financial Total | Document Total | Quote/invoice amounts are document totals, not financial-system totals. |
| Financial Summary | Document Summary | Use in quote/invoice builders. |
| Cash Flow Overview | Document Status Overview | Studio panel should be workflow-first. |
| Ledger | Document Overview / Document Record | Avoid accounting/ledger positioning. |
| Aggregated Ledger | Document Overview | Avoid accounting system signal. |
| Pipeline Value | Active Document Total | Avoid sales/revenue pipeline language. |
| LTV | Client Record Total | Avoid finance metric framing. |
| Outstanding | Pending / Needs Review / Due | Use document state instead of balance framing. |
| Payment | Subscription Checkout (Paddle) | For Corvioz plan purchase context only. |
| Payment Terms | Invoice Terms | Invoice document field only. |
| Payment Notes | Invoice Notes | Invoice document field only. |
| Payment Link | Client Document Link | Do not imply Corvioz processes payment. |
| Pay Link | Client Link | Dashboard action label. |
| Online Checkout URL | Client Document Link | Avoid hosted checkout implication. |
| Payment Reminder | Client Follow-up Reminder | Follow-up is workflow/document language. |
| Payment-linked emails | Client follow-up emails | Avoid money movement signal. |
| payment instructions | invoice notes / client document notes | Only acceptable as user-authored invoice note context. |
| paid plan checkout via Paddle | Secure checkout provider: Paddle | Exact standardized Paddle wording. |
| paid plan / paid tiers / paid upgrades | subscription plan / subscription plans | Use `paid` sparingly only in legal/support copy. |
| payment processor | Secure checkout provider | Never describe Corvioz or Paddle this way in product copy. |
| billing platform | client delivery workspace | Forbidden positioning. |
| billing workflow | invoice document workflow | Avoid product identity drift. |
| billable invoices | invoice documents | Avoid billing-system framing. |
| accounting software | bookkeeping or tax software only in FAQ disclaimers | Do not position Corvioz as accounting-adjacent. |
| tax-compliant professional invoices | invoice documents | Do not claim tax compliance. |
| credit card/bank payments | subscription checkout handled by Paddle | Do not imply Corvioz accepts client payments. |
| bank details / wire instructions | document notes for the client | Avoid money movement language in default UI. |
| AI pricing | Remove | Not in approved model. |
| AI Scope Expansion | Scope presets | Remove AI capability claim. |
| AI Writer | Document helper / Scope helper | Only if the capability is already visible and needs a neutral label. |
| Generate Scope | Prepare Scope | Avoid AI generation claim. |
| income | client workflow / client work | No income claims. |
| Build Stable Freelance Income | Keep client follow-up organized | No income promise. |
| secure recurring freelance income | organize repeat client work | No income promise. |
| win clients | client review / client approval | No conversion promise. |
| boost revenue | organize workflow / improve structure | No revenue promise. |
| boosting client acceptance by 30% | clear scope breakdown | Remove metric. |
| respond within 24h | client review status | Remove time guarantee. |

# C. Final Unified Term Dictionary

| Concept | Approved term | Allowed supporting terms | Do not use |
|---|---|---|---|
| Product identity | Freelancer Workflow System | client delivery workspace; focused workspace | Revenue OS; financial OS; payment tool; billing platform |
| Product category | Client delivery workspace | Professional Proposal & Document System; Structured Client Management Layer | accounting system; payment infrastructure; revenue platform |
| Primary workflow | client workflow | client delivery workflow; document workflow | money movement; payment flow; revenue funnel |
| Quote | Quote | estimate; proposal estimate; milestone estimate | billable quote; payment quote |
| Proposal | Proposal | client-ready proposal; proposal document | sales funnel; close-deal system |
| Invoice | Invoice Document | invoice; completed-work document | payment request platform; tax-compliant invoice product |
| Client | Client | recipient client; client record; client details | customer balance; payer |
| Client record | Client record | project record; document record | financial ledger; account balance |
| Document | Client document | quote document; proposal document; invoice document | payment artifact; billing artifact |
| Total | Document Total | quote total; invoice total; estimated total | Financial Total; revenue total |
| Summary | Document Summary | workflow summary; client summary | Financial Summary; cash flow summary |
| Status | Draft / Sent / Approved / Declined / Completed | Pending until sent; Waiting for client review; Needs review | Paid; Settled; Collected, unless strictly internal/non-public |
| Invoice terms | Invoice Terms | due date; issue date; document notes | Payment Terms as primary label |
| Invoice notes | Invoice Notes | client document notes | Payment Notes as primary label |
| Client link | Client Link | review link; private client link; client document link | Pay Link; payment portal; checkout URL |
| Follow-up | Client follow-up | document follow-up; review reminder | payment reminder; collection reminder |
| Pricing | Pricing | plan; subscription plan; Monthly; Yearly; billed annually | revenue model; payment tier |
| Checkout | Subscription Checkout (Paddle) | Secure checkout provider: Paddle | payment processor; Corvioz processes payments |
| Paddle | Secure checkout provider: Paddle | Paddle handles Corvioz subscription checkout | Paddle as product identity; payment processor framing |
| Free plan | Free | try the core workflow | free payment tier |
| Starter plan | Starter | simple client delivery workspace | starter revenue tier |
| Pro plan | Pro | multiple client projects; stronger delivery controls | income growth plan |
| Studio plan | Studio | broader client operations; studio client workspaces | enterprise financial infrastructure |
| Export | PDF export | clean PDF export; watermarked PDF preview | payment export; ledger export |
| Security | data protection | encrypted data; does not store card details | payment security platform |
| Analytics | product analytics | workflow analytics, if visible and supported | revenue validation; revenue autopilot; payment-rate dashboard |

## Enforcement Result

Not yet fully consistent. The public homepage/pricing narrative is close to the approved model, but Paddle submission copy still has material inconsistency risk until the dashboard, Studio, SEO generator, modal, and footer language listed above is normalized.

No UI copy was rewritten in this pass. This is a language consistency enforcement report and replacement checklist only.
