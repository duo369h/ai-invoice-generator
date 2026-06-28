'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
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
        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🔍</div>
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 900,
          marginBottom: '12px',
          background: 'linear-gradient(135deg, #ffffff 40%, #818cf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em'
        }}>
          Page Not Found
        </h1>
        <p style={{
          fontSize: '0.88rem',
          color: '#9ca3af',
          lineHeight: '1.6',
          marginBottom: '28px'
        }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#818cf8',
          color: '#ffffff',
          textDecoration: 'none',
          padding: '12px 24px',
          borderRadius: '10px',
          fontSize: '0.88rem',
          fontWeight: 650,
          boxShadow: '0 4px 12px rgba(129, 140, 248, 0.3)',
          transition: 'transform 0.2s ease, background-color 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#6366f1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#818cf8'; }}
        >
          Return Home
        </Link>
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
