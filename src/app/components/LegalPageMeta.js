export const LEGAL_LAST_UPDATED = 'July 2026';

export default function LegalPageMeta({ badge = 'Legal', title, description }) {
  return (
    <>
      <span className="badge" style={{ marginBottom: '16px' }}>{badge}</span>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-1px' }}>
        {title}
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: description ? '16px' : '40px', fontSize: '0.95rem' }}>
        Last updated: {LEGAL_LAST_UPDATED}
      </p>
      {description && (
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '1rem', lineHeight: 1.7 }}>
          {description}
        </p>
      )}
    </>
  );
}
