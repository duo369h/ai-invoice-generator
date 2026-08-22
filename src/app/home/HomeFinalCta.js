import Link from 'next/link';

const SIGNUP_URL = '/signup?redirect=%2Fdashboard%3Ftool%3Dquote%26mode%3Dcreate%26flow%3Dfirst-quote';

export default function HomeFinalCta() {
  return (
    <section className="section-final-cta" id="final-cta">
      <div className="section-container">
        <div className="final-cta-container final-cta-reveal-item" id="final-cta-reveal">
          <h2 className="final-cta-headline">Ready to create your next client quote?</h2>
          <p className="final-cta-body">Start with a clear quote, then keep the client workflow connected as the work moves forward.</p>
          <div className="final-cta-actions">
            <Link href={SIGNUP_URL} className="btn-final-cta-primary" id="btn-final-cta-main" data-home-telemetry="create-quote" data-home-telemetry-position="final_cta">Create Quote</Link>
            <span className="final-cta-microcopy">Free plan available.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
