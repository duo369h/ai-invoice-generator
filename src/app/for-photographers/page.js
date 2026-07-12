import ForPhotographersCta from './ForPhotographersCta';
import ForPhotographersHeader from './ForPhotographersHeader';

const pageTitle = 'Corvioz for Independent Photographers';
const pageDescription = "Quote, invoice, and track deposits and final payments in your own currency, built around how a shoot actually gets booked and paid.";

const assumptions = [
  {
    common: 'Invoices and quotes default to USD-first templates',
    corvioz: 'Set your own currency as the default for every quote and invoice',
  },
  {
    common: "Contracts follow one region's legal norms and templates",
    corvioz: 'Editable photography agreement templates for deposits, delivery timelines, usage rights, and payment terms',
  },
  {
    common: 'Payments are tracked through card-first workflows',
    corvioz: 'Track card, bank transfer, cash, and other offline payments — deposits and final balances — in one client record',
  },
  {
    common: "Pricing tiers assume one market's average freelance income",
    corvioz: "Plans built for independent photography businesses, wherever you're based",
  },
];

const workflowSteps = [
  {
    title: 'Inquiry to Quote',
    body: 'A client asks about availability and pricing. Turn it into a professional quote in minutes — packages, add-ons, your pricing, without rebuilding a document from scratch each time.',
  },
  {
    title: 'Quote to Deposit & Agreement',
    body: 'Once they confirm, the quote becomes an agreement with deposit terms, delivery timeline, and usage rights attached — no copying details between separate documents.',
  },
  {
    title: 'Shoot to Delivery',
    body: 'Track the job through to delivery — attach your gallery link and move the client record forward when the work is done.',
  },
  {
    title: 'Final Payment & Record',
    body: 'Trigger the final invoice, log the payment however it comes in — card, transfer, or cash — and keep a clean record for every job.',
  },
];

const useCases = [
  {
    title: 'Wedding Shoot',
    body: 'Quote 8-hour coverage with a second shooter and an album add-on as optional line items. Collect a deposit to reserve the date, then invoice the remaining balance once galleries are delivered.',
  },
  {
    title: 'Portrait Session',
    body: 'Quote a session fee with retouching add-ons priced separately. Confirm the booking with a deposit, then send the final invoice with the balance due on delivery.',
  },
  {
    title: 'Event Photography',
    body: 'Quote coverage for a corporate event or private function by the hour or as a package, with add-ons like extended coverage or same-day highlights. Collect a deposit to hold the date, then invoice the balance once photos are delivered.',
  },
  {
    title: 'Commercial Shoot',
    body: 'Break a brand or campaign shoot into staged payments tied to deliverables, with usage rights and revision limits spelled out in the agreement — invoice each stage as work is completed and signed off.',
  },
  {
    title: 'Product Photography',
    body: 'Quote a batch of product shots by SKU or set size, with a deposit to begin and the balance due on final delivery — usage rights and revision limits included in the agreement, same as any commercial job.',
  },
];

const pricingLines = [
  'Start free',
  'No card required',
  'Upgrade only when you need to',
  'Plan details are clear before you upgrade — no surprises',
];

const faqs = [
  {
    question: 'Does Corvioz process payments for me?',
    answer: 'No — Corvioz is built for tracking payments, not processing them. You record card, bank transfer, cash, or other payments as they happen, so you always have a clear history of deposits and final balances per client.',
  },
  {
    question: 'Can I quote and invoice in my own currency?',
    answer: 'Yes. Set your default currency once, and every quote, invoice, and payment record uses it.',
  },
  {
    question: 'Are the contract templates legally valid in my country?',
    answer: 'Corvioz provides editable photography agreement templates covering deposits, delivery timelines, usage rights, and payment terms as a starting point. This is not legal advice — always review templates with a local professional before relying on them.',
  },
  {
    question: 'What if my clients pay by bank transfer or cash instead of card?',
    answer: "You can log any payment method — card, bank transfer, cash, or other offline payments — against a client's deposit or final balance.",
  },
  {
    question: "I don't only shoot weddings — does this still work for me?",
    answer: 'Yes. The quote-to-payment flow works for weddings, portrait sessions, events, commercial shoots, and product photography, and templates can be customized for each type of work.',
  },
];

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: '/for-photographers',
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: '/for-photographers',
    type: 'website',
  },
  twitter: {
    title: pageTitle,
    description: pageDescription,
  },
};

export default function ForPhotographersPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <main className="photographers-page">
      <style>{`
        .photographers-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 84% 8%, rgba(79, 70, 229, 0.08), transparent 28%),
            radial-gradient(circle at 12% 18%, rgba(6, 182, 212, 0.07), transparent 25%),
            var(--bg-page);
          color: var(--text-main);
        }
        .photo-section {
          padding: 82px 24px;
        }
        .photo-container {
          width: min(1120px, 100%);
          margin: 0 auto;
        }
        .photo-container-narrow {
          width: min(860px, 100%);
          margin: 0 auto;
        }
        .photo-hero {
          padding: 64px 24px 34px;
        }
        .photo-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
          gap: 36px;
          align-items: center;
        }
        .photo-eyebrow {
          color: var(--primary);
          font-size: 0.78rem;
          font-weight: 850;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .photo-hero h1 {
          font-size: clamp(2.35rem, 5vw, 4.25rem);
          line-height: 1.01;
          letter-spacing: 0;
          margin: 0 0 18px;
          max-width: 820px;
          font-weight: 930;
        }
        .photo-lede {
          color: var(--text-muted);
          font-size: 1.08rem;
          line-height: 1.62;
          max-width: 720px;
          margin: 0 0 22px;
        }
        .photo-microcopy {
          color: var(--text-soft);
          font-size: 0.86rem;
          margin-top: 12px;
        }
        .photo-mockup {
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }
        .photo-mockup-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
          color: var(--text-soft);
          font-size: 0.78rem;
          font-weight: 700;
        }
        .photo-mockup-body {
          padding: 22px;
          display: grid;
          gap: 14px;
        }
        .photo-doc-row {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 13px 0;
          border-bottom: 1px solid var(--border);
          color: var(--text-muted);
          font-size: 0.86rem;
        }
        .photo-doc-row strong {
          color: var(--text-main);
        }
        .photo-stage-rail {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
          margin-top: 8px;
        }
        .photo-stage-rail span {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 8px;
          border-radius: 8px;
          background: var(--btn-secondary-bg);
          border: 1px solid var(--border);
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 750;
        }
        .photo-section-title {
          font-size: clamp(2rem, 4vw, 3.3rem);
          line-height: 1.04;
          letter-spacing: 0;
          margin: 0 0 18px;
          font-weight: 900;
        }
        .photo-section-copy {
          color: var(--text-muted);
          font-size: 1rem;
          line-height: 1.75;
          margin: 0;
        }
        .assumption-table {
          margin-top: 34px;
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-card);
        }
        .assumption-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-top: 1px solid var(--border);
        }
        .assumption-row:first-child {
          border-top: none;
        }
        .assumption-cell {
          padding: 20px 22px;
          color: var(--text-muted);
          line-height: 1.6;
          border-left: 1px solid var(--border);
        }
        .assumption-cell:first-child {
          border-left: none;
        }
        .assumption-head {
          color: var(--text-main);
          font-weight: 850;
          background: var(--btn-secondary-bg);
        }
        .workflow-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-top: 34px;
        }
        .workflow-card,
        .use-case-card,
        .faq-card {
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }
        .workflow-card span {
          color: var(--primary);
          font-size: 0.76rem;
          font-weight: 850;
        }
        .workflow-card h3,
        .use-case-card h3,
        .faq-card h3 {
          margin: 12px 0 10px;
          font-size: 1rem;
          font-weight: 850;
        }
        .workflow-card p,
        .use-case-card p,
        .faq-card p {
          color: var(--text-muted);
          line-height: 1.65;
          margin: 0;
          font-size: 0.92rem;
        }
        .founder-panel {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 32px;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          padding: 28px;
        }
        .founder-visual {
          min-height: 300px;
          border-radius: 8px;
          background:
            linear-gradient(135deg, rgba(79, 70, 229, 0.14), rgba(6, 182, 212, 0.08)),
            var(--btn-secondary-bg);
          border: 1px solid var(--border);
          padding: 22px;
          display: grid;
          align-content: end;
          gap: 10px;
        }
        .founder-visual-line {
          height: 10px;
          border-radius: 999px;
          background: rgba(79, 70, 229, 0.16);
        }
        .use-case-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
          margin-top: 34px;
        }
        .pricing-lines {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 28px;
        }
        .pricing-line {
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          padding: 18px;
          font-weight: 800;
          color: var(--text-main);
        }
        .faq-grid {
          display: grid;
          gap: 14px;
          margin-top: 34px;
        }
        .photo-final {
          text-align: center;
          border-top: 1px solid var(--border);
          background: var(--bg-card);
          padding-bottom: 132px;
        }
        .photo-footer {
          border-top: 1px solid var(--border);
          padding: 34px 24px;
          color: var(--text-muted);
          font-size: 0.84rem;
          background: var(--bg-card);
        }
        .photo-footer-inner {
          width: min(1120px, 100%);
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
        }
        .photo-footer a {
          color: var(--text-muted);
          margin-left: 18px;
        }
        @media (max-width: 980px) {
          .photo-hero-grid,
          .founder-panel {
            grid-template-columns: 1fr;
          }
          .workflow-grid,
          .use-case-grid,
          .pricing-lines {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .photo-section,
          .photo-hero {
            padding-left: 18px;
            padding-right: 18px;
          }
          .photo-hero {
            padding-top: 44px;
            padding-bottom: 26px;
          }
          .photo-hero h1 {
            font-size: 2.45rem;
          }
          .photo-final {
            padding-bottom: 164px;
          }
          .photo-mockup {
            display: none;
          }
          .photo-mockup-body {
            padding: 16px;
          }
          .workflow-grid,
          .use-case-grid,
          .pricing-lines,
          .assumption-row {
            grid-template-columns: 1fr;
          }
          .assumption-cell {
            border-left: none;
            border-top: 1px solid var(--border);
          }
          .assumption-cell:first-child {
            border-top: none;
          }
          .photo-stage-rail {
            grid-template-columns: 1fr;
          }
          .photo-footer a {
            margin-left: 0;
            margin-right: 14px;
          }
        }
      `}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <ForPhotographersHeader />

      <section className="photo-hero">
        <div className="photo-container photo-hero-grid">
          <div>
            <p className="photo-eyebrow">For Independent Photographers</p>
            <h1>From quote to final payment — without squeezing into someone else's workflow.</h1>
            <p className="photo-lede">
              Corvioz helps independent photographers quote, invoice, and track deposits and final payments in their own currency — built around how a shoot actually gets booked and paid, not around one market's assumptions.
            </p>
            <ForPhotographersCta position="hero" />
            <p className="photo-microcopy">No credit card required. Set up your first quote in under 10 minutes.</p>
          </div>

          <div className="photo-mockup" aria-label="Quote workflow preview">
            <div className="photo-mockup-top">
              <span>Photography quote</span>
              <span>Deposit + final balance</span>
            </div>
            <div className="photo-mockup-body">
              <div className="photo-doc-row"><strong>Client</strong><span>Portrait session</span></div>
              <div className="photo-doc-row"><strong>Currency</strong><span>Your default currency</span></div>
              <div className="photo-doc-row"><strong>Terms</strong><span>Deposit, delivery, usage rights</span></div>
              <div className="photo-stage-rail">
                <span>Quote</span>
                <span>Deposit</span>
                <span>Shoot</span>
                <span>Delivery</span>
                <span>Final payment</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="photo-section" id="common-assumptions">
        <div className="photo-container-narrow">
          <h2 className="photo-section-title">Most client-management tools are built around one market's assumptions.</h2>
          <p className="photo-section-copy">
            Many generic client-management tools default to USD-first templates, card-first workflows, and one region's contract norms — because that's the market they were originally built for. If your business runs on a different currency, different payment habits, or different contract norms, you end up adapting your business to the tool instead of the other way around.
          </p>
          <div className="assumption-table">
            <div className="assumption-row">
              <div className="assumption-cell assumption-head">A common assumption</div>
              <div className="assumption-cell assumption-head">What Corvioz does instead</div>
            </div>
            {assumptions.map((item) => (
              <div className="assumption-row" key={item.common}>
                <div className="assumption-cell">{item.common}</div>
                <div className="assumption-cell">{item.corvioz}</div>
              </div>
            ))}
          </div>
          <p className="photo-section-copy" style={{ marginTop: '24px', fontWeight: 750, color: 'var(--text-main)' }}>
            You shouldn't have to bend your business around assumptions that were never made with you in mind.
          </p>
        </div>
      </section>

      <section className="photo-section" id="photography-workflow">
        <div className="photo-container">
          <div className="photo-container-narrow" style={{ marginLeft: 0 }}>
            <h2 className="photo-section-title">Built around how a shoot actually gets booked.</h2>
          </div>
          <div className="workflow-grid">
            {workflowSteps.map((step, index) => (
              <article className="workflow-card" key={step.title}>
                <span>Step {index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="photo-section">
        <div className="photo-container founder-panel">
          <div className="founder-visual" aria-hidden="true">
            <div className="founder-visual-line" style={{ width: '70%' }} />
            <div className="founder-visual-line" style={{ width: '48%' }} />
            <div className="founder-visual-line" style={{ width: '86%' }} />
          </div>
          <div>
            <h2 className="photo-section-title">Built by a photographer, for photographers.</h2>
            <p className="photo-section-copy">
              Corvioz started from a simple frustration: most quoting and invoicing tools are built around one market's assumptions about currency, contracts, and payments. Corvioz was built around the actual sequence of booking, shooting, and getting paid — deposit first, delivery next, balance on completion — not a generic template for unrelated service businesses in general.
            </p>
          </div>
        </div>
      </section>

      <section className="photo-section" id="photography-use-cases">
        <div className="photo-container">
          <h2 className="photo-section-title">A few ways photographers use Corvioz</h2>
          <div className="use-case-grid">
            {useCases.map((item) => (
              <article className="use-case-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="photo-section" id="pricing-transition">
        <div className="photo-container-narrow">
          <h2 className="photo-section-title">Straightforward pricing, wherever you're based.</h2>
          <p className="photo-section-copy">
            Corvioz is priced for independent photography businesses — not scaled around one market's average project budget.
          </p>
          <div className="pricing-lines">
            {pricingLines.map((line) => (
              <div className="pricing-line" key={line}>{line}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="photo-section" id="photographer-faq">
        <div className="photo-container-narrow">
          <h2 className="photo-section-title">Photographer FAQ</h2>
          <div className="faq-grid">
            {faqs.map((faq) => (
              <article className="faq-card" key={faq.question}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="photo-section photo-final">
        <div className="photo-container-narrow">
          <h2 className="photo-section-title">Send your next quote in minutes.</h2>
          <p className="photo-section-copy" style={{ marginBottom: '28px' }}>
            Set up your first quoting template — free, no card required.
          </p>
          <ForPhotographersCta position="final_cta" />
        </div>
      </section>

      <footer className="photo-footer">
        <div className="photo-footer-inner">
          <p>Corvioz helps independent photographers organize quotes, invoices, client records, deposits, delivery terms, and final payment tracking.</p>
          <nav aria-label="For photographers footer links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/security">Security & Data</a>
            <a href="mailto:support@corvioz.com">support@corvioz.com</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
