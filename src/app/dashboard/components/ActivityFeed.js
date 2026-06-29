'use client';

import React, { useState, useEffect } from 'react';
// Telemetry layer purged - UI is pure render only
const trackEvent = () => {};

export default function ActivityFeed({ invoices = [], quotes = [] }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setEvents([]);
    setIsLoading(false);
  }, [invoices, quotes]);

  const getFriendlyTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay === 1) return 'yesterday';
    return `${diffDay}d ago`;
  };

  const getDerivedEvents = () => {
    const list = [...events];

    // Derive events from actual invoice records
    invoices.forEach(inv => {
      const hasSent = list.some(e => e.event_name === 'invoice_sent' && e.properties?.invoice_number === inv.invoice_number);
      if (!hasSent) {
        list.push({
          event_name: 'invoice_sent',
          created_at: inv.created_at || inv.due_date || new Date().toISOString(),
          properties: {
            invoice_number: inv.invoice_number,
            client_name: inv.client_name,
            total: inv.total
          }
        });
      }
      if (['sent', 'paid', 'overdue'].includes(inv.status)) {
        const hasViewed = list.some(e => e.event_name === 'invoice_viewed' && e.properties?.invoice_number === inv.invoice_number);
        if (!hasViewed) {
          list.push({
            event_name: 'invoice_viewed',
            created_at: inv.updated_at || inv.due_date || new Date().toISOString(),
            properties: {
              invoice_number: inv.invoice_number,
              client_name: inv.client_name,
              total: inv.total
            }
          });
        }
      }
      if (inv.status === 'paid') {
        const hasResponse = list.some(e => e.event_name === 'client_response_received' && e.properties?.invoice_number === inv.invoice_number);
        if (!hasResponse) {
          list.push({
            event_name: 'client_response_received',
            created_at: inv.updated_at || new Date().toISOString(),
            properties: {
              invoice_number: inv.invoice_number,
              client_name: inv.client_name,
              action: 'paid'
            }
          });
        }
      }
    });

    // Derive events from actual quote records
    quotes.forEach(q => {
      const hasSent = list.some(e => e.event_name === 'quote_sent' && e.properties?.quote_number === q.quote_number);
      if (!hasSent) {
        list.push({
          event_name: 'quote_sent',
          created_at: q.created_at || new Date().toISOString(),
          properties: {
            quote_number: q.quote_number,
            client_name: q.client_name,
            total: q.total
          }
        });
      }
      if (q.status === 'approved') {
        const hasAccepted = list.some(e => e.event_name === 'quote_accepted' && e.properties?.quote_number === q.quote_number);
        if (!hasAccepted) {
          list.push({
            event_name: 'quote_accepted',
            created_at: q.updated_at || new Date().toISOString(),
            properties: {
              quote_number: q.quote_number,
              client_name: q.client_name,
              total: q.total
            }
          });
        }
      } else if (q.status === 'declined' || q.status === 'rejected') {
        const hasRejected = list.some(e => e.event_name === 'quote_rejected' && e.properties?.quote_number === q.quote_number);
        if (!hasRejected) {
          list.push({
            event_name: 'quote_rejected',
            created_at: q.updated_at || new Date().toISOString(),
            properties: {
              quote_number: q.quote_number,
              client_name: q.client_name,
              total: q.total
            }
          });
        }
      }
    });

    // Filter to display only the requested reality events
    const allowedEvents = ['invoice_sent', 'invoice_viewed', 'quote_accepted', 'quote_rejected', 'reminder_sent'];
    return list
      .filter(e => allowedEvents.includes(e.event_name))
      .sort((a, b) => new Date(b.created_at || b.properties?.received_at || 0) - new Date(a.created_at || a.properties?.received_at || 0));
  };

  const filteredEvents = getDerivedEvents();

  return (
    <section className="card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Business Operations Feed</h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Real customer portal events & status history.</p>
        </div>
        <span style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '4px', 
          fontSize: '0.7rem', 
          color: 'var(--success, #10B981)', 
          fontWeight: 700 
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success, #10B981)' }} />
          Live
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
        {isLoading ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading live feed...</div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ padding: '24px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', border: '1px dashed var(--border)', borderRadius: '8px' }}>
            No portal events logged. Create and share invoices/quotes to populate.
          </div>
        ) : (
          filteredEvents.map((act, index) => {
            let label = '';
            let color = 'var(--text-muted)';
            let icon = '🔔';

            if (act.event_name === 'invoice_sent') {
              label = `Invoice Sent`;
              color = 'var(--primary, #4F46E5)';
              icon = '📬';
            } else if (act.event_name === 'invoice_viewed') {
              label = `Invoice Viewed`;
              color = 'var(--accent, #6366F1)';
              icon = '👁️';
            } else if (act.event_name === 'quote_accepted') {
              label = `Quote Accepted`;
              color = 'var(--success, #10B981)';
              icon = '✅';
            } else if (act.event_name === 'quote_rejected') {
              label = `Quote Rejected`;
              color = 'var(--danger, #EF4444)';
              icon = '❌';
            } else if (act.event_name === 'reminder_sent') {
              label = `Reminder Sent`;
              color = 'var(--warning, #F59E0B)';
              icon = '⏰';
            }

            return (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                gap: '12px',
                paddingBottom: index === filteredEvents.length - 1 ? 0 : '12px',
                borderBottom: index === filteredEvents.length - 1 ? 'none' : '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'start' }}>
                  <span style={{ fontSize: '1rem', marginTop: '2px' }}>{icon}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{label}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {act.event_name === 'invoice_sent' && `Sent to ${act.properties?.client_name || ''}`}
                      {act.event_name === 'invoice_viewed' && `Viewed by ${act.properties?.client_name || ''}`}
                      {act.event_name === 'quote_accepted' && `Approved by ${act.properties?.client_name || ''}`}
                      {act.event_name === 'quote_rejected' && `Declined by ${act.properties?.client_name || ''}`}
                      {act.event_name === 'reminder_sent' && `Reminder sent to ${act.properties?.client_name || ''}`}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-soft)', marginTop: '2px' }}>
                      {getFriendlyTimeAgo(act.created_at || act.properties?.received_at)}
                    </span>
                  </div>
                </div>
                {act.properties?.total !== undefined && (
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-soft)' }}>
                    ${(act.properties.total / 100).toFixed(2)}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
