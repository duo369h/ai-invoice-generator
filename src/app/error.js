'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090b13',
      color: '#e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, -apple-system, sans-serif',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        padding: '40px 32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>⚠️</div>
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 900,
          marginBottom: '12px',
          background: 'linear-gradient(135deg, #ffffff 40%, #fb7171 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em'
        }}>
          Something went wrong
        </h1>
        <p style={{
          fontSize: '0.88rem',
          color: '#9ca3af',
          lineHeight: '1.6',
          marginBottom: '28px'
        }}>
          An unexpected error occurred. Our team has been notified.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              padding: '12px 20px',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: 650,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}
          >
            Try again
          </button>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            color: '#e5e7eb',
            textDecoration: 'none',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '0.88rem',
            fontWeight: 650,
          }}>
            Return Home
          </Link>
        </div>

        {error && (
          <details style={{ marginTop: '24px', textAlign: 'left' }}>
            <summary style={{ fontSize: '0.72rem', color: '#6b7280', cursor: 'pointer', userSelect: 'none' }}>
              Error details
            </summary>
            <pre style={{
              marginTop: '8px',
              padding: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              fontSize: '0.72rem',
              color: '#f87171',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              {error.message || error.toString()}
            </pre>
          </details>
        )}
      </div>
      <p style={{
        marginTop: '32px',
        fontSize: '0.72rem',
        color: '#4b5563',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        fontWeight: 700
      }}>
        Corvioz Beta
      </p>
    </div>
  );
}
