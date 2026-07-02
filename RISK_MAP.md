# Risk Map

Date: 2026-07-01
Goal: Classify visible Corvioz copy for Paddle merchant/domain approval risk.

## Classification Rules Used

- SAFE: freelancer workflow, proposals, quotes, client management, productivity, document delivery.
- BORDERLINE: invoice, billing, payment, revenue tracking, subscription checkout, pricing automation.
- HIGH RISK: payment infrastructure, money movement, primary "get paid" framing, financial system/OS framing, processor-like language.

## Green / Safe Copy

| Phrase | Location | Classification | Notes |
| --- | --- | --- | --- |
| `Early Access for Freelancers` | Landing hero | SAFE | Freelancer identity is clear. |
| `Create Quote` | Header / CTA | SAFE | Quote workflow. |
| `Explore Example` | Hero CTA | SAFE | Generic product exploration. |
| `No credit card required` | Hero proof | SAFE | Standard SaaS trial language. |
| `Built with real freelancer feedback` | Hero proof | SAFE | Product feedback framing. |
| `workspace / quotes` | Product preview | SAFE | Quote workflow. |
| `Live workflow preview` | Product preview | SAFE | Product workflow framing. |
| `Quote` | Product preview | SAFE | Proposal/quote domain. |
| `Client approval captured` | Product preview | SAFE | Client workflow. |
| `How Corvioz Works` | Section heading | SAFE | Workflow framing. |
| `Create Quote` | Workflow step | SAFE | Quote workflow. |
| `Generate Proposal` | Workflow step | SAFE | Proposal workflow. |
| `Built for Independent Freelancers` | Landing section | SAFE | Good primary identity. |
| `Work more professionally` | Feature card | SAFE | Productivity framing. |
| `Stay in control` | Feature card | SAFE | General product safety. |
| `Your projects, your clients, your data. No lock-in.` | Feature card | SAFE | Data ownership. |
| `Verified Visual Previews` | Trust section | SAFE | Product preview framing. |
| `Built for real freelancers` | Trust card | SAFE | Good Paddle-safe identity. |
| `A focused, lightweight workspace built specifically for independent professionals, sole proprietors, and consultants.` | Trust card | SAFE | Strong safe definition. |
| `Milestone Proposals` | Preview card | SAFE | Proposal workflow. |
| `Turn project scope, milestone pricing, and client approval into a clean proposal flow.` | Preview card | SAFE | Mostly safe; "pricing" is minor but service pricing, not payment infra. |
| `Client Portal` | Preview card | SAFE | Client management. |
| `Give clients a direct place to review proposals, invoices, approvals, and payment updates.` | Preview card | BORDERLINE | Safe portal framing but includes payment updates. |
| `Choose how you want to work.` | Pricing | SAFE | Workflow framing. |
| `Draft quotes and estimates` | Pricing card | SAFE | Quote workflow. |
| `Basic profile creation` | Pricing card | SAFE | Productivity/profile. |
| `Client-ready proposals` | Fallback plan feature | SAFE | Proposal workflow. |
| `Unlimited proposals & profiles` | Pricing card | SAFE | Proposal/profile. |
| `Share client links instantly` | Pricing card | SAFE | Client delivery. |
| `Scale client operations` | Pricing / CTA | SAFE | Client operations. |
| `Brand client workspaces under your custom domain` | Pricing card | SAFE | Workspace/domain feature. |
| `Qualify inbound inquiries with budget filters` | Pricing card | SAFE | Lead qualification. |
| `Practical Guides for Client Work` | Resources | SAFE | Client work. |
| `Freelance Pricing Guide` | Resources | SAFE | Service pricing guidance. |
| `Create your account or Sign in` | Auth | SAFE | Auth UI. |
| `Enter your email to receive a secure sign-in magic link. No password required.` | Auth | SAFE | Auth flow. |
| `Continue with Google` | Auth | SAFE | OAuth UI. |
| `Email address` | Auth | SAFE | Auth form. |
| `Send magic link` | Auth | SAFE | Auth form. |
| `Client workflow active` | Value message | SAFE | Good framing. |
| `You have client work worth keeping organized.` | Value message | SAFE | Productivity framing. |
| `Unlock client-ready workflow` | Modal CTA | SAFE | Good replacement direction. |
| `Continue with preview` | Modal CTA | SAFE | Product state. |
| `Built for freelancers` | Footer | SAFE | Safe identity. |
| `We never sell personal data` | Footer | SAFE | Privacy/trust. |
| `Protected with industry-standard security practices` | Footer | SAFE | Security posture. |
| `Something went wrong` | Error page | SAFE | Generic error. |
| `Page Not Found` | 404 | SAFE | Generic 404. |

## Yellow / Borderline Copy

| Phrase | Location | Classification | Risk Reason |
| --- | --- | --- | --- |
| `send the invoice` | Landing hero body | BORDERLINE | Invoice is acceptable as secondary utility but too high in hero. |
| `Client billing flow` | Product preview | BORDERLINE | "Billing flow" can sound billing-platform-like. |
| `Quote to paid, in one workspace.` | Product preview | HIGH RISK | Primary "paid" outcome and money movement signal. |
| `Invoice` | Product preview / nav / templates | BORDERLINE | Acceptable as document type, should be secondary. |
| `Payment link delivered` | Product preview | HIGH RISK | Suggests payment-link delivery/payment system. |
| `Paid` | Product preview | HIGH RISK | Money movement completion state. |
| `Transfer recorded` | Product preview | HIGH RISK | Implies financial transfer tracking. |
| `Revenue` | Product preview | HIGH RISK | Financial-system framing. |
| `Workspace balance updated` | Product preview | HIGH RISK | Looks like money balance/accounting system. |
| `Get Paid` | Workflow step | HIGH RISK | Primary payment outcome. |
| `billing, client management, and portfolios` | Why section | BORDERLINE | Billing in core identity. |
| `Send quotes, invoices, and client updates` | Feature card | BORDERLINE | Invoice okay, but should trail workflow language. |
| `Secure subscription billing via Paddle` | Trust strip/footer | BORDERLINE | Acceptable legal/trust note, too prominent in marketing body. |
| `collect client payments worldwide` | Trust card | HIGH RISK | Payment collection/payment facilitator implication. |
| `open invoices, and revenue outcomes` | Dashboard preview | HIGH RISK | Revenue outcome/dashboard risk. |
| `Invoice & Payments` | Preview card | HIGH RISK | Payment-centric section title. |
| `track payment status` | Preview card | HIGH RISK | Payment tracking as feature. |
| `payment updates` | Client portal card | BORDERLINE | Keep secondary if needed. |
| `Get your first client faster` | Pricing Starter | SAFE/BORDERLINE | Safe if client acquisition, not payment. |
| `Start getting paid professionally` | Pricing Pro | HIGH RISK | Primary "get paid" claim. |
| `Starter pays for itself when it helps one invoice leave on time.` | Pricing anchor | BORDERLINE | ROI/invoice framing. |
| `Pro is the delivery layer after value is already created.` | Pricing anchor | SAFE | Fine. |
| `Studio is for teams where client delivery volume already justifies operations.` | Pricing anchor | SAFE | Fine. |
| `Subscription checkout handled securely via Paddle` | Pricing trust | BORDERLINE | Trust/legal note only; avoid prominent product claim. |
| `No hidden billing logic` | Pricing trust | BORDERLINE | Mentions billing logic; could imply financial logic. |
| `Safe & Secure Checkout` | Pricing trust | BORDERLINE | Acceptable near purchase area, not product identity. |
| `Paddle handles subscription checkout, receipts, tax handling, and billing records where enabled.` | Pricing trust | BORDERLINE | Accurate processor disclosure; keep legal/trust only. |
| `Your card details do not touch Corvioz servers.` | Pricing trust | BORDERLINE | Safe disclosure but should stay near checkout/legal. |
| `Money-Back Guarantee` | Pricing trust | BORDERLINE | Common SaaS but payment-adjacent. |
| `billing error` | Refund copy | BORDERLINE | Acceptable in refund policy area. |
| `Paddle receipt` | Refund copy | BORDERLINE | Acceptable in refund context. |
| `How to Invoice Clients` | Footer resource | BORDERLINE | Content/resource, not core identity. |
| `Get Paid Faster Guide` | Footer resource | HIGH RISK | "Get paid" as growth promise. |
| `get paid faster` | Footer slogan | HIGH RISK | Primary payment promise. |
| `Secure subscription billing, clear refunds, and user-owned business records.` | Footer trust | BORDERLINE | Legal/trust acceptable, reduce prominence. |
| `Your invoices and client data remain yours` | Footer trust | BORDERLINE | Fine if document/data ownership. |
| `Professional Invoice Delivery` | Transparency pledge | BORDERLINE | Invoice delivery okay but should not be monetization identity. |
| `checkout`, `paywall`, `payment follow-up`, `ROI Anchor` | Modals | HIGH RISK | Payment/conversion machinery visible in modal copy. |
| `Paddle-secure subscription checkout` | Upsell modal | BORDERLINE | Trust note, not feature. |
| `TLS Encrypted Paddle Checkout` | Modals | BORDERLINE | Keep only near purchase confirmation. |
| `One accepted invoice can cover months of Pro.` | Modal value message | HIGH RISK | Financial ROI claim. |
| `Pro is priced below the cost of one delayed follow-up.` | Modal value message | HIGH RISK | Financial pressure/ROI claim. |
| `A single approved quote can pay back the workflow.` | Modal value message | HIGH RISK | ROI/payback claim. |
| `You are using Corvioz like a paid workflow now.` | Modal value message | BORDERLINE | Paid workflow framing; better as usage limit. |
| `Authentication service is temporarily unavailable. Please configure Supabase environment variables.` | Auth config fallback | SAFE | Internal-ish but not payment risk. |

## Red / High Risk Themes

| Theme | Affected phrases | Why it matters for Paddle |
| --- | --- | --- |
| Payment completion framing | `Get Paid`, `Paid`, `Quote to paid`, `Payment link delivered`, `Transfer recorded` | Can make Corvioz appear to move, process, or facilitate payments. |
| Financial dashboard framing | `Revenue`, `Workspace balance updated`, `revenue outcomes`, `Revenue OS` comments/branding if surfaced | Can look like financial infrastructure or accounting system. |
| Processor / billing infrastructure framing | `Invoice & Payments`, `track payment status`, `billing records`, `No hidden billing logic` | Can make the product appear to compete with Paddle/Stripe/QuickBooks. |
| Strong ROI pressure | `One accepted invoice can cover months of Pro`, `pay back the workflow`, `priced below the cost...` | Can look like financial advice or aggressive payment conversion. |
| Paddle as feature claim | `Paddle-secure subscription checkout`, `Secure subscription billing via Paddle` | Acceptable as disclosure, but risky when promoted as a product feature. |

## Final Risk Summary

PRIMARY_IDENTITY_STATUS: PARTIAL_PASS

The product mostly presents as a freelancer workflow workspace, but too many high-visibility phrases still center payment, billing, revenue, and "get paid" outcomes. For Paddle approval, the top-level story should be adjusted to: quote/proposal/client workflow first; invoice/payment references as secondary document or subscription disclosures only.
