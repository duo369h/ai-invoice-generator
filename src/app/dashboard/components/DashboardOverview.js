import React, { useState } from 'react';
import Link from 'next/link';
import { color, dashboardTokens } from '../../design-system/tokens';
import { getDashboardUI } from '../../../core/ui/GET_DASHBOARD_UI.ts';
import { RevenueDecisionCard } from './RevenueDecisionCard';

const cardStyle = {
  padding: dashboardTokens.cardPadding,
  background: color.card,
  border: dashboardTokens.cardBorder,
  borderRadius: dashboardTokens.cardRadius,
};

const emptyTextStyle = {
  fontSize: '0.8rem',
  color: color.muted,
};

function resolveAction(actionHandlers, action, payload) {
  const handler = actionHandlers?.[action];
  if (handler) handler(payload);
}

export function DashboardHeader({ ui }) {
  return (
    <header className="dashboard-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span>{ui.title}</span>
          {ui.badge && (
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '99px',
              background: ui.badge === 'Business Mode' ? 'linear-gradient(135deg, #9333EA 0%, #4F46E5 100%)' : 'var(--btn-secondary-bg)',
              color: ui.badge === 'Business Mode' ? '#fff' : 'var(--text-muted)',
              border: '1px solid var(--border)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {ui.badge}
            </span>
          )}
        </h1>
        {ui.description ? <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>{ui.description}</p> : null}
      </div>
    </header>
  );
}

export function StatusBadge({ ui }) {
  if (!ui) return null;
  return (
    <span style={{
      fontSize: '0.7rem',
      fontWeight: 700,
      padding: '3px 8px',
      borderRadius: '6px',
      textTransform: 'uppercase',
      backgroundColor: ui.bg,
      color: ui.color,
      border: `1px solid ${ui.color}22`
    }}>
      {ui.label}
    </span>
  );
}

export function MetricGrid({ ui }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
      {ui.items.map((item) => (
        <div key={item.label} style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{item.label}</div>
          <div style={{ marginTop: '8px', fontSize: '1.25rem', fontWeight: 900, color: item.tone === 'success' ? 'var(--success)' : item.tone === 'primary' ? 'var(--primary)' : 'var(--text-main)' }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function OnboardingChecklist({ ui, actionHandlers }) {
  return (
    <section className="card animate-fade-in" style={{ ...cardStyle, background: 'var(--bg-surface)', marginBottom: '24px' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-main)' }}>{ui.title}</h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: 1.5 }}>{ui.description}</p>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-soft)', marginBottom: '6px' }}>
          <span>Onboarding Progress ({ui.doneCount} of {ui.totalCount} steps completed)</span>
          <span style={{ color: ui.percentComplete === 100 ? 'var(--success)' : 'var(--primary)' }}>{ui.percentComplete}%</span>
        </div>
        <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${ui.percentComplete}%`, height: '100%', background: ui.percentComplete === 100 ? 'var(--success)' : 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {ui.nextStep && (
        <div style={{ background: 'var(--primary-glow)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '0.78rem', color: 'var(--text-soft)', fontWeight: 600 }}>
          Next Action: {ui.nextStep.title}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {ui.steps.map((step) => (
          <div key={step.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '16px', background: 'var(--bg-card)', border: step.id === ui.nextStep?.id ? '1.5px solid var(--primary)' : '1px solid var(--border)', borderRadius: '8px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: step.done ? 'var(--success-glow)' : 'var(--primary-glow)', color: step.done ? 'var(--success)' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
              {step.done ? '✓' : '•'}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: step.done ? 'var(--text-muted)' : 'var(--text-main)' }}>{step.title}</h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>{step.description}</p>
              {!step.done && (
                <button type="button" onClick={() => resolveAction(actionHandlers, step.action)} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.7rem', alignSelf: 'flex-start', marginTop: '4px', fontWeight: 700 }}>
                  {step.actionLabel}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FirstValueCard({ ui, actionHandlers }) {
  const isQuoteAction = ui.action === 'createQuote';
  const labelText = isQuoteAction ? 'QUOTE' : 'INVOICE';
  const docNumber = isQuoteAction ? 'QT-1001' : 'INV-1001';
  const termLabel = isQuoteAction ? 'STATUS' : 'DUE';
  const termValue = isQuoteAction ? 'Draft' : 'Net 30';

  return (
    <section className="card animate-fade-in" style={{ ...cardStyle, background: 'var(--bg-surface)', display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(220px, 0.8fr)', gap: '20px', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center' }}>
        <span style={{ alignSelf: 'flex-start', padding: '4px 10px', borderRadius: '999px', background: 'var(--primary-glow)', color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>
          Ready to start
        </span>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>{ui.title}</h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{ui.description}</p>
        </div>
        <button type="button" onClick={() => resolveAction(actionHandlers, ui.action)} className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontWeight: 800 }}>
          {ui.actionLabel}
        </button>
        <p style={{ margin: 0, color: 'var(--success)', fontSize: '0.82rem', fontWeight: 750 }}>{ui.outcome}</p>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', minHeight: '190px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{labelText}</div>
            <div style={{ marginTop: '4px', fontSize: '1rem', color: 'var(--text-main)', fontWeight: 850 }}>{docNumber}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{termLabel}</div>
            <div style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 750 }}>{termValue}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gap: '8px' }}>
          {ui.previewLines.map((line) => (
            <div key={line.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '0.82rem', color: 'var(--text-soft)' }}>
              <span>{line.label}</span>
              <strong style={{ color: 'var(--text-main)' }}>{line.amount}</strong>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total</span>
          <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{ui.previewTotal}</strong>
        </div>
      </div>
    </section>
  );
}

export function RevenueSystemCard({ ui }) {
  return (
    <section className="card animate-fade-in" style={{ ...cardStyle, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '18px', background: 'var(--bg-surface)' }}>
      <div>
        <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: 'var(--success-glow)', color: 'var(--success)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>{ui.eyebrow}</span>
        <h2 style={{ margin: '10px 0 6px 0', fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)' }}>{ui.title}</h2>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{ui.description}</p>
      </div>
      <MetricGrid ui={{ items: ui.metrics }} />
    </section>
  );
}

export function RevenueFlowInsight({ ui }) {
  return (
    <section className="card animate-fade-in" style={{ ...cardStyle, background: 'var(--bg-surface)' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 6px 0', color: 'var(--text-main)' }}>{ui.title}</h2>
      <p style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.5 }}>{ui.description}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        {ui.steps.map((step) => (
          <span key={step} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 800 }}>
            {step}
          </span>
        ))}
      </div>
    </section>
  );
}

export function RevenueImpactCard({ ui }) {
  return (
    <section className="card animate-fade-in" style={{ ...cardStyle, background: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 6px 0', color: 'var(--text-main)' }}>{ui.title}</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.5 }}>{ui.description}</p>
        </div>
        {ui.proofBadge && (
          <span style={{ padding: '4px 10px', borderRadius: '999px', background: 'var(--success-glow)', color: 'var(--success)', fontSize: '0.72rem', fontWeight: 850, textTransform: 'uppercase' }}>
            {ui.proofBadge}
          </span>
        )}
      </div>
      <MetricGrid ui={{ items: ui.metrics }} />
      {ui.monetization && (
        <div style={{ marginTop: '14px', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: ui.monetization.action === 'show_paywall' ? 'var(--primary-glow)' : 'var(--bg-card)', color: 'var(--text-main)' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 850 }}>{ui.monetization.label}</div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{ui.monetization.reason}</p>
        </div>
      )}
    </section>
  );
}

export function LeadsInbox({ ui, actionHandlers }) {
  return (
    <section className="card" style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="dashboard-card-title" style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>{ui.title}</h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ui.description}</p>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-soft)', fontWeight: 600 }}>Total Pipeline: {ui.totalPipeline}</span>
      </div>

      {ui.items.length === 0 ? (
        <EmptyBlock ui={ui.empty} actionHandlers={actionHandlers} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ui.items.map((item) => (
            <div key={item.id} style={{ padding: '16px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{item.title}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.subtitle}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.value && <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--success)' }}>{item.value}</span>}
                  <StatusBadge ui={item.badge} />
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>Received: {item.received}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {item.actions.map((action) => (
                    <button key={action.label} type="button" onClick={() => resolveAction(actionHandlers, action.action, action.payload)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.7rem', padding: '4px 10px' }}>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyBlock({ ui, actionHandlers }) {
  return (
    <div style={{ padding: '36px 20px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
      <p style={{ ...emptyTextStyle, margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{ui.title}</p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '6px 0 16px 0', lineHeight: 1.4 }}>{ui.description}</p>
      <button type="button" onClick={() => resolveAction(actionHandlers, ui.action)} className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
        {ui.actionLabel}
      </button>
    </div>
  );
}

function RecordTable({ ui, actionHandlers }) {
  return (
    <section className="card" style={cardStyle}>
      <h2 className="dashboard-card-title" style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 16px 0' }}>{ui.title}</h2>
      {ui.rows.length === 0 ? (
        <EmptyBlock ui={ui.empty} actionHandlers={actionHandlers} />
      ) : (
        <div className="dashboard-table-wrap">
          <table className="dashboard-compact-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="align-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {ui.rows.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.number}</strong></td>
                  <td>{row.client}</td>
                  <td><strong>{row.amount}</strong></td>
                  <td><StatusBadge ui={row.badge} /></td>
                  <td className="align-right">
                    {row.actions.map((action) => (
                      <button key={action.label} type="button" onClick={() => resolveAction(actionHandlers, action.action, action.payload)} className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                        {action.label}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function RecentQuotes({ ui, actionHandlers }) {
  return <RecordTable ui={ui} actionHandlers={actionHandlers} />;
}

export function RecentInvoices({ ui, actionHandlers }) {
  return <RecordTable ui={ui} actionHandlers={actionHandlers} />;
}

export function ActivityFeed({ ui }) {
  const [localOutcomes, setLocalOutcomes] = useState({});

  const handleUpdateOutcome = async (proposalId, status, finalPrice = null) => {
    try {
      const body = {
        proposal_id: proposalId,
        outcome: status,
      };
      if (finalPrice !== null) {
        body.price_accepted = finalPrice;
      }

      const response = await fetch("/api/revenue/outcomes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Outcomes PATCH failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setLocalOutcomes(prev => ({
          ...prev,
          [proposalId]: { outcome: status, price: finalPrice }
        }));
        alert(`Outcome updated: ${status}`);
      } else {
        alert(`Error updating outcome: ${data.error}`);
      }
    } catch (err) {
      console.error("Failed to update outcome:", err);
      alert("Failed to connect to outcome service.");
    }
  };

  const handleNegotiate = (proposalId, currentRevenue) => {
    const cleanRevenue = currentRevenue ? String(currentRevenue).replace(/[^0-9.]/g, '') : "0";
    const newPriceStr = prompt("Enter negotiated price:", cleanRevenue);
    if (newPriceStr) {
      const price = parseFloat(newPriceStr.replace(/[^0-9.]/g, ''));
      if (!isNaN(price) && price > 0) {
        handleUpdateOutcome(proposalId, "REVISED", price);
      }
    }
  };

  // Priority 5: Transform feed items into a clean timeline
  const timelineItems = (ui.items || []).map((item, idx) => {
    const isQuote = item.text.toLowerCase().includes("quote") || item.text.toLowerCase().includes("proposal");
    
    // Fallback proposal ID
    const proposalId = item.id || `proposal-mock-${idx}`;
    const local = localOutcomes[proposalId];

    // Determine status / final outcome
    let statusLabel = local ? local.outcome : (item.badge?.label || "Pending");
    if (statusLabel === "Draft") statusLabel = "Sent";
    if (statusLabel === "Paid") statusLabel = "Won";
    
    // Strategy used
    let strategyUsed = "Recommended";
    if (idx % 3 === 0) strategyUsed = "High Profit";
    if (idx % 3 === 2) strategyUsed = "Fast Close";

    return {
      id: proposalId,
      event: isQuote ? "Quote sent to client" : "Client responded (Invoice created)",
      time: item.time || "Recently",
      strategy: isQuote ? strategyUsed : null,
      outcome: statusLabel,
      revenue: local && local.price ? `$${local.price.toFixed(2)}` : (item.amount || "$0.00"),
      isQuote,
    };
  });

  return (
    <section className="card" style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
          📋 Recent Quote Timeline
        </h3>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-soft)', fontWeight: 600 }}>
          {timelineItems.length} events logged
        </span>
      </div>

      {timelineItems.length === 0 ? (
        <p style={{ ...emptyTextStyle, margin: 0 }}>No recent quote history found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {timelineItems.map((item) => (
            <div key={item.id} style={{
              padding: "12px",
              background: "rgba(255, 255, 255, 0.01)",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              fontSize: "0.8rem",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ color: "var(--text-main)" }}>{item.event}</strong>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{item.time}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "0.74rem", color: "var(--text-soft)" }}>
                {item.strategy && (
                  <span>
                    Strategy: <strong style={{ color: "var(--primary)" }}>{item.strategy}</strong>
                  </span>
                )}
                <span>
                  Outcome: <strong style={{ color: item.outcome === "Won" || item.outcome === "WON" || item.outcome === "Paid" ? "#10b981" : "var(--text-soft)" }}>{item.outcome}</strong>
                </span>
                <span>
                  Document Total: <strong style={{ color: "var(--text-main)" }}>{item.revenue}</strong>
                </span>
              </div>

              {item.isQuote && (item.outcome === "Sent" || item.outcome === "Pending" || item.outcome === "Draft") && (
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button
                    onClick={() => handleUpdateOutcome(item.id, "WON")}
                    style={{
                      padding: "4px 10px",
                      background: "#10b981",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Won
                  </button>
                  <button
                    onClick={() => handleUpdateOutcome(item.id, "LOST")}
                    style={{
                      padding: "4px 10px",
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Lost
                  </button>
                  <button
                    onClick={() => handleNegotiate(item.id, item.revenue)}
                    style={{
                      padding: "4px 10px",
                      background: "var(--primary, #6366f1)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Negotiate
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function QuickActions({ ui, actionHandlers }) {
  const action = ui.nextAction;
  return (
    <section className="card" style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h2 className="dashboard-card-title" style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>{ui.title}</h2>
      <div style={{ padding: '14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 850, color: 'var(--text-main)' }}>{action.title}</h3>
        <p style={{ margin: '0 0 12px 0', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>{action.message}</p>
        {action.href ? (
          <Link href={action.href} className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>{action.cta}</Link>
        ) : (
          <button type="button" onClick={() => resolveAction(actionHandlers, action.action, action.payload)} className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
            {action.cta}
          </button>
        )}
      </div>
    </section>
  );
}

function RevenueFocusCard({ ui }) {
  return (
    <section style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.06) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary, #6366f1)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Workflow Focus</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>Conversion Probability: {(ui.metric.probability * 100).toFixed(0)}%</p>
        </div>
        <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(99,102,241,0.12)', borderRadius: '20px', fontWeight: 600, color: 'var(--primary, #6366f1)' }}>{ui.metric.label}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-soft)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next Best Action</p>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>{ui.highlight.title}</p>
        </div>
        <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-soft)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pricing Suggestion</p>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>{ui.pricing.display}</p>
        </div>
      </div>
      <Link href={ui.primaryCTA.href} style={{ display: 'inline-block', padding: '9px 20px', background: 'var(--primary, #6366f1)', color: '#ffffff', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
        {ui.primaryCTA.label} →
      </Link>
    </section>
  );
}

function DemoCard({ ui }) {
  if (!ui.showDemoCard) return null;
  return (
    <section style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.08)', border: '1px dashed rgba(99, 102, 241, 0.3)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Try a sample quote</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-soft)', marginTop: '4px' }}>See how AI organizes quote structure and client-ready details in real time.</p>
      </div>
      <Link href="/demo/proposal-preview" style={{ padding: '8px 16px', background: 'var(--primary, #6366f1)', color: '#ffffff', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
        View Demo →
      </Link>
    </section>
  );
}



function SafeModeLockCard({ ui }) {
  return (
    <div style={{ padding: '24px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-surface)', fontWeight: 600, color: 'var(--text-soft)', marginTop: '20px', textAlign: 'center' }}>
      {ui.message}
    </div>
  );
}

const SECTION_REGISTRY = {
  HEADER: DashboardHeader,
  SAFE_MODE: SafeModeLockCard,
  EMPTY_STATE: FirstValueCard,
  SYSTEM: RevenueSystemCard,
  IMPACT: RevenueImpactCard,
  FLOW: RevenueFlowInsight,
  FOCUS: RevenueFocusCard,
  DEMO: DemoCard,
  ONBOARDING: OnboardingChecklist,
  LEADS: LeadsInbox,
  QUOTES: RecentQuotes,
  INVOICES: RecentInvoices,
  ACTIVITY: ActivityFeed,
  ACTIONS: QuickActions,
  REVENUE_DECISION: RevenueDecisionCard,
};

function renderSection(section, actionHandlers) {
  const Component = SECTION_REGISTRY[section.type];
  if (!Component) return null;
  return <Component ui={section.props} actionHandlers={actionHandlers} />;
}

export default function DashboardOverview({
  data = {},
  actionHandlers = {},
}) {
  const ui = getDashboardUI(data);
  const rawSections = ui.sections || [];
  const allowedSectionTypes = [
    'HEADER',
    'EMPTY_STATE',
    'REVENUE_DECISION',
    'ACTIONS',
    'ACTIVITY',
    'ONBOARDING'
  ];
  const sections = [];
  for (const s of rawSections) {
    if (allowedSectionTypes.includes(s.type)) {
      if (s.type === 'EMPTY_STATE') {
        sections.push({
          ...s,
          props: {
            ...s.props,
            title: "Create your first Quote",
            description: "Prepare a clear milestone-based quote for your client. Once accepted, turn it into an invoice in one click.",
            actionLabel: "Create your first Quote",
            action: "createQuote",
            outcome: "Win clients with professional pricing",
            previewLines: [
              { label: "Phase 1: Design Drafts", amount: "$1,200.00" },
              { label: "Phase 2: Development", amount: "$2,000.00" },
            ],
            previewTotal: "$3,200.00",
          }
        });
      } else {
        sections.push(s);
      }
    }
  }

  const enhancedActionHandlers = {
    ...actionHandlers,
    onAcceptDecision: async (payload) => {
      let strategy_used = "BALANCED";
      if (payload.selectedOption === "HIGH") strategy_used = "MAX_REVENUE";
      if (payload.selectedOption === "FAST") strategy_used = "FAST_DEAL";

      const latestQuote = data['quotes']?.[0] || {};
      const proposal_id = latestQuote.id;

      if (!proposal_id) {
        console.warn("[Outcome Recording] Skipped POST: No active quote/proposal ID available.");
        if (actionHandlers.onAcceptDecision) {
          actionHandlers.onAcceptDecision(payload);
        }
        return;
      }

      try {
        const response = await fetch("/api/revenue/outcomes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proposal_id,
            strategy_used,
            price_offered: payload.finalPrice,
            outcome: "PENDING",
            client_type: latestQuote.client_type || "startup",
            service_type: latestQuote.service_type || "web_design",
            urgency: latestQuote.urgency || "medium",
          }),
        });

        if (!response.ok) {
          throw new Error(`Outcomes POST failed with status ${response.status}`);
        }
      } catch (err) {
        console.error("Error saving loop decision:", err);
      }

      if (actionHandlers.onAcceptDecision) {
        actionHandlers.onAcceptDecision(payload);
      }
    },
    onModifyDecision: async (payload) => {
      const latestQuote = data['quotes']?.[0] || {};
      const proposal_id = latestQuote.id;

      if (!proposal_id) {
        console.warn("[Outcome Recording] Skipped POST on modify: No active quote/proposal ID available.");
        if (actionHandlers.onModifyDecision) {
          actionHandlers.onModifyDecision(payload);
        }
        return;
      }

      try {
        const response = await fetch("/api/revenue/outcomes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proposal_id,
            strategy_used: "BALANCED",
            price_offered: payload.finalPrice,
            outcome: "PENDING",
            client_type: latestQuote.client_type || "startup",
            service_type: latestQuote.service_type || "web_design",
            urgency: latestQuote.urgency || "medium",
          }),
        });

        if (!response.ok) {
          throw new Error(`Outcomes custom POST failed with status ${response.status}`);
        }
      } catch (err) {
        console.error("Error saving custom decision:", err);
      }

      if (actionHandlers.onModifyDecision) {
        actionHandlers.onModifyDecision(payload);
      }
    },
    onRejectDecision: async (payload) => {
      if (actionHandlers.onRejectDecision) {
        actionHandlers.onRejectDecision(payload);
      }
    }
  };

  return (
    <div className="animate-fade-in dashboard-overview" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {sections.map(section => {
        const rendered = renderSection(section, enhancedActionHandlers);
        if (!rendered) return null;

        const isTop = section?.uiDecision?.placement === 'TOP';
        const isHigh = section?.uiDecision?.urgency === 'HIGH';

        const wrapperStyle = {
          borderLeft: isHigh ? '4px solid #ef4444' : isTop ? '3px solid var(--primary, #6366f1)' : 'none',
          boxShadow: isHigh ? '0 10px 15px -3px rgba(239, 68, 68, 0.1), 0 4px 6px -2px rgba(239, 68, 68, 0.05)' : 'none',
          paddingLeft: isHigh || isTop ? '12px' : '0',
          transition: 'all 0.3s ease',
        };

        return (
          <div key={section.id} style={wrapperStyle}>
            {rendered}
          </div>
        );
      })}
    </div>
  );
}
