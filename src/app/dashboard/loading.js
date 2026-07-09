export default function DashboardLoading() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg-page)',
      color: 'var(--text-main)',
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
    }}>
      <aside style={{
        borderRight: '1px solid var(--border)',
        padding: '24px',
        background: 'var(--background-card)',
      }}>
        <div style={{ fontWeight: 900, marginBottom: '28px' }}>Corvioz</div>
        <div style={{ display: 'grid', gap: '14px' }}>
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="skeleton animate-pulse"
              style={{ height: '36px', borderRadius: '8px' }}
            />
          ))}
        </div>
      </aside>
      <section style={{ padding: '40px', display: 'grid', gap: '24px', alignContent: 'start' }}>
        <div>
          <p style={{
            margin: '0 0 8px',
            color: 'var(--primary)',
            fontSize: '0.74rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            Loading dashboard
          </p>
          <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 900 }}>
            Preparing your workspace...
          </h1>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="skeleton animate-pulse"
              style={{ height: '96px', borderRadius: '8px' }}
            />
          ))}
        </div>
        <div className="skeleton animate-pulse" style={{ height: '280px', borderRadius: '8px' }} />
      </section>
    </main>
  );
}
