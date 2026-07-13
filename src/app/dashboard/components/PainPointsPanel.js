'use client';

import React, { useState, useEffect } from 'react';

export default function PainPointsPanel({ triggerRefresh }) {
  const [feedbackList, setFeedbackList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await fetch('/api/feedback');
        if (res.ok) {
          const data = await res.json();
          setFeedbackList(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch feedback logs:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeedback();
  }, [triggerRefresh]);

  const categories = [
    { key: 'Proposal', label: 'Quote', color: '#3B82F6' },
    { key: 'Invoice', label: 'Invoice', color: '#10B981' },
    { key: 'Pricing', label: 'Pricing', color: '#EF4444' },
    { key: 'Client Portal', label: 'Client Portal', color: '#8B5CF6' },
    { key: 'Dashboard', label: 'Dashboard', color: '#F59E0B' },
    { key: 'AI', label: 'AI', color: '#6366F1' },
    { key: 'Feature Request', label: 'Feature Request', color: '#14B8A6' },
    { key: 'Bug', label: 'Bug', color: '#DC2626' }
  ];

  // Aggregate stats
  const aggregated = categories.map(cat => {
    const count = feedbackList.filter(fb => fb.category === cat.key).length;
    return {
      ...cat,
      count
    };
  }).sort((a, b) => b.count - a.count);

  const totalCount = aggregated.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Top User Pain Points</h3>
        <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Aggregated feedback categorization & recent issues.</p>
      </div>

      {isLoading ? (
        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading pain points data...</div>
      ) : feedbackList.length === 0 ? (
        <div style={{ padding: '24px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', border: '1px dashed var(--border)', borderRadius: '8px' }}>
          No feedback entries recorded. Submit beta feedback to view aggregate charts.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Progress Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {aggregated.map(item => {
              const percentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
              return (
                <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-soft)' }}>{item.label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{item.count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percentage}%`, backgroundColor: item.color, borderRadius: '4px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent feedback list */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Recent Submissions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {feedbackList.slice(0, 3).map((fb, idx) => (
                <div key={idx} style={{ padding: '8px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: categories.find(c => c.key === fb.category)?.color + '22',
                      color: categories.find(c => c.key === fb.category)?.color || 'var(--text-muted)'
                    }}>
                      {fb.category}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {fb.created_at ? fb.created_at.substring(0, 10) : ''}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-soft)', lineHeight: 1.35 }}>
                    "{fb.message}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
