export default function HomeWhy() {
  return (
    <section className="section-why-wrapper" id="why-corvioz">
      <div className="section-container">
        <div className="why-header">
          <div className="section-kicker" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }}>WHY CORVIOZ</div>
        </div>
        <div className="why-pillars-grid">
          <div className="why-pillar-card">
            <h3 className="pillar-title">Keep the work connected</h3>
            <p className="pillar-text">Keep quotes, invoices, client details, and payment status in one connected workflow.</p>
          </div>
          <div className="why-pillar-card">
            <h3 className="pillar-title">Know what happens next</h3>
            <p className="pillar-text">See the next practical step as work moves from quote to invoice and payment tracking.</p>
          </div>
          <div className="why-pillar-card">
            <h3 className="pillar-title">Keep a usable record</h3>
            <p className="pillar-text">Maintain a clear client history of quotes, invoices, and recorded payment status.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
