import Link from 'next/link';

export default function HomeForPhotographers() {
  return (
    <section className="section-photographers-wrapper" id="for-photographers">
      <div className="section-container">
        <div className="photographers-grid fp-reveal-item" id="fp-section-reveal">
          <div className="photographers-content-left">
            <div className="section-kicker">FOR PHOTOGRAPHERS</div>
            <h2 className="photographers-headline">Know what’s included before you price the job.</h2>
            <p className="photographers-body">Keep the job details, quote, and invoice together, so you can see what was agreed and what comes next.</p>
            <Link href="/for-photographers" className="photographers-link">Explore Corvioz for photographers →</Link>
          </div>
          <div className="photography-job-surface">
            <div className="job-surface-header">
              <div><div className="job-title">Spring Brand Shoot</div><div className="job-client">Northline Goods</div></div>
              <div className="job-category-badge">Commercial Photography</div>
            </div>
            <div className="job-surface-body">
              <div className="job-section-block">
                <div className="job-section-label">SCOPE</div>
                <div className="job-scope-list">
                  <div className="job-scope-row"><span>Photography</span><span className="job-scope-detail">1 day</span></div>
                  <div className="job-scope-row"><span>Post-production</span><span className="job-scope-detail">20 final images</span></div>
                  <div className="job-scope-row"><span>Additional retouching</span><span className="job-scope-detail">Optional</span></div>
                  <div className="job-scope-total"><span>Total</span><span>$4,800</span></div>
                </div>
              </div>
              <div className="job-section-block">
                <div className="job-section-label">QUOTE</div>
                <div className="job-row-flex"><div><strong style={{ color: 'var(--text-main)' }}>Quote Q-1048</strong><span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>$4,800</span></div><span className="status-badge-approved">Approved</span></div>
              </div>
              <div className="job-section-block">
                <div className="job-section-label">CLIENT PORTAL</div>
                <div className="portal-access-list">
                  <div className="portal-access-item"><span className="portal-dot"/><span>Quote: <strong>Available</strong></span></div>
                  <div className="portal-access-item"><span className="portal-dot"/><span>Invoice: <strong>Available</strong></span></div>
                </div>
              </div>
              <div className="job-section-block">
                <div className="job-section-label">INVOICE</div>
                <div className="job-row-flex"><div><strong style={{ color: 'var(--text-main)' }}>Invoice INV-2094</strong><span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>$4,800</span></div><span className="status-badge-paid">Paid</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
