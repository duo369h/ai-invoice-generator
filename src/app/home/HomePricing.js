import Link from 'next/link';

const SIGNUP_URL = '/signup?redirect=%2Fdashboard%3Ftool%3Dquote%26mode%3Dcreate%26flow%3Dfirst-quote';

function CheckIcon() {
  return <svg className="pricing-check-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function Feature({ children }) {
  return <li className="pricing-feature-item"><CheckIcon/><span>{children}</span></li>;
}

export default function HomePricing() {
  return (
    <section className="section-pricing-wrapper" id="pricing">
      <div className="section-container">
        <div className="pricing-header">
          <div className="section-kicker">PRICING</div>
          <h2 className="section-title">Start free. Upgrade when you need more.</h2>
          <p className="section-intro">Start with the core workflow, then choose a plan as your client work grows.</p>
        </div>
        <div className="pricing-unified-surface">
          <div className="pricing-grid-four">
            <div className="pricing-plan-col col-interactive">
              <div className="pricing-plan-header">
                <h3 className="pricing-plan-title">FREE</h3>
                <div className="pricing-price-slot"><div className="price-numeral-row"><span className="price-currency-val">$0</span></div></div>
                <p className="pricing-plan-positioning">Try the core workflow.</p>
              </div>
              <ul className="pricing-feature-list"><Feature>5 quotes &amp; invoices per billing cycle</Feature><Feature>Branded PDF export</Feature><Feature>Up to 50 stored documents</Feature></ul>
              <div className="pricing-plan-footer"><Link href={SIGNUP_URL} className="btn-action-start-free">Start free</Link></div>
            </div>
            <div className="pricing-plan-col col-interactive">
              <div className="pricing-plan-header">
                <h3 className="pricing-plan-title">STARTER</h3>
                <div className="pricing-price-slot"><div className="price-numeral-row"><span className="price-currency-val">$9</span><span className="price-period-label">/ month</span></div><div className="price-yearly-subline">Yearly option available</div></div>
                <p className="pricing-plan-positioning">For regular client work.</p>
              </div>
              <ul className="pricing-feature-list"><Feature>30 quotes &amp; invoices per billing cycle</Feature><Feature>Clean PDF export</Feature><Feature>Quote &amp; invoice workflow</Feature></ul>
              <div className="pricing-plan-footer"><Link href="/pricing" className="btn-action-view-plan">View Starter</Link></div>
            </div>
            <div className="pricing-plan-col col-interactive col-pro">
              <div className="pricing-plan-header">
                <h3 className="pricing-plan-title">PRO</h3>
                <div className="pricing-price-slot"><div className="price-numeral-row"><span className="price-currency-val">$19</span><span className="price-period-label">/ month</span></div><div className="price-yearly-subline">Yearly option available</div></div>
                <p className="pricing-plan-positioning">For more active client work.</p>
              </div>
              <ul className="pricing-feature-list"><Feature>Unlimited quotes &amp; invoices</Feature><Feature>Clean PDF export</Feature><Feature>Client Portal &amp; quote approval</Feature></ul>
              <div className="pricing-plan-footer"><Link href="/pricing" className="btn-action-view-plan">View Pro</Link></div>
            </div>
            <div className="pricing-plan-col col-studio">
              <div className="pricing-plan-header">
                <div className="pricing-plan-title"><span>STUDIO</span><span className="badge-coming-soon">COMING SOON</span></div>
                <div className="pricing-price-slot"><div className="price-numeral-row"><span className="price-period-label" style={{ fontWeight: 600, color: 'var(--text-soft)', fontSize: '0.95rem' }}>Coming soon</span></div></div>
                <p className="pricing-plan-positioning" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>For studio workflows.</p>
              </div>
              <div className="studio-empty-body"><p className="studio-status-note">Pricing and features are still being shaped.</p></div>
              <div className="pricing-plan-footer"/>
            </div>
          </div>
        </div>
        <div className="pricing-full-link-container"><Link href="/pricing" className="pricing-full-link">See full pricing →</Link></div>
        <div className="paddle-note-line">Corvioz subscriptions are handled through Paddle.</div>
      </div>
    </section>
  );
}
