'use client';

/**
 * Corvioz v1 — Activation Dashboard Page
 *
 * The guided first-action surface. Shown to users who have NOT yet completed
 * their first success event. Maximum 3 primary actions. No analytics widgets.
 * No revenue charts. No AI suggestions. No multi-CTA confusion.
 *
 * SUCCESS CRITERIA:
 *   ✓ User can reach first invoice in < 60 seconds
 *   ✓ ≤ 3 primary actions on first screen
 *   ✓ No multi-step decision confusion
 *   ✓ No AI interference
 */

import { useRouter } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActivationAction {
  id:          string;
  label:       string;
  description: string;
  route:       string;
  primary:     boolean;
}

// ── The ONLY 3 actions shown on this surface ──────────────────────────────────

const ACTIVATION_ACTIONS: ActivationAction[] = [
  {
    id:          'create-invoice',
    label:       'Create Document',
    description: 'Prepare a client-ready document.',
    route:       '/dashboard?tool=invoice&mode=create',
    primary:     true,
  },
  {
    id:          'create-quote',
    label:       'Send Quote',
    description: 'Pitch a project with a clear price.',
    route:       '/dashboard?tool=quote&mode=create',
    primary:     false,
  },
  {
    id:          'add-client',
    label:       'Add Client',
    description: 'Save a client to your dashboard.',
    route:       '/dashboard?tool=client',
    primary:     false,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function ActivationDashboard() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight:       '100vh',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        background:      '#0a0a0a',
        fontFamily:      'Inter, system-ui, sans-serif',
        padding:         '2rem',
      }}
    >
      {/* Header — single clear prompt */}
      <div style={{ textAlign: 'center', marginBottom: '3rem', maxWidth: '480px' }}>
        <h1 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          What would you like to do first?
        </h1>
        <p style={{ color: '#888', fontSize: '1rem', lineHeight: 1.6 }}>
          Pick one action below. You can always do the others later.
        </p>
      </div>

      {/* ≤ 3 primary actions — maximum enforced by ACTIVATION_ACTIONS constant */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap:                 '1rem',
          width:               '100%',
          maxWidth:            '680px',
        }}
      >
        {ACTIVATION_ACTIONS.map((action) => (
          <button
            key={action.id}
            id={`activation-${action.id}`}
            onClick={() => router.push(action.route)}
            style={{
              display:         'flex',
              flexDirection:   'column',
              alignItems:      'flex-start',
              padding:         '1.5rem',
              borderRadius:    '12px',
              border:          action.primary ? '2px solid #6366f1' : '1px solid #222',
              background:      action.primary ? '#6366f115' : '#111',
              cursor:          'pointer',
              textAlign:       'left',
              transition:      'border-color 0.15s, background 0.15s',
              color:           '#fff',
            }}
          >
            <span
              style={{
                fontSize:   '1rem',
                fontWeight: 600,
                marginBottom: '0.4rem',
                color: action.primary ? '#818cf8' : '#ccc',
              }}
            >
              {action.label}
            </span>
            <span style={{ fontSize: '0.875rem', color: '#666', lineHeight: 1.5 }}>
              {action.description}
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
