import Link from 'next/link';

export default function HomeFounderTrust() {
  return (
    <section className="section-founder-trust" id="founder-trust">
      <div className="section-container">
        <div className="founder-trust-grid founder-trust-reveal-item" id="founder-trust-reveal">
          <div className="founder-trust-left">
            <div className="founder-trust-eyebrow">BUILT WITH CLEAR BOUNDARIES</div>
            <h2 className="founder-trust-headline">Focused on the client workflow that needs to stay connected.</h2>
            <p className="founder-trust-intro">Corvioz is built around quotes, invoices, client records, and recorded payment status, with a deliberately focused workflow.</p>
            <div className="founder-note-block">
              <p className="founder-note-text">Corvioz is being built as a focused workspace for independent professionals to keep quotes, invoices, client documents, and client records easier to follow in one place.</p>
              <div className="founder-attribution"><span className="attribution-label">From the founder</span><span className="attribution-name">Duo, Founder of Corvioz</span></div>
            </div>
          </div>
          <div className="founder-trust-right">
            <div className="trust-fact-row"><h3 className="trust-fact-title">Your content remains yours.</h3><p className="trust-fact-desc">Documents, profile assets, and portfolio content you host on Corvioz remain your property.</p><Link href="/terms" className="trust-fact-link">Read the Terms →</Link></div>
            <div className="trust-fact-row" id="trust-fact-security"><h3 className="trust-fact-title">Security information is public.</h3><p className="trust-fact-desc">Review how Corvioz approaches account and product security.</p><Link href="/security" className="trust-fact-link" id="link-security">View security →</Link></div>
            <div className="trust-fact-row"><h3 className="trust-fact-title">Subscriptions are handled through Paddle.</h3><p className="trust-fact-desc">Corvioz uses Paddle for its subscription plans and billing options.</p><Link href="/pricing" className="trust-fact-link">View pricing →</Link></div>
          </div>
        </div>
      </div>
    </section>
  );
}
