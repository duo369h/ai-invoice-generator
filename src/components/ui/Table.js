'use client';

import React from 'react';

export function Table({ children, className = '', style = {}, ...props }) {
  return (
    <div className="dashboard-table-wrap" style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)' }}>
      <table className={['dashboard-compact-table', className].filter(Boolean).join(' ')} style={style} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '', style = {}, ...props }) {
  return (
    <thead className={className} style={style} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', style = {}, ...props }) {
  return (
    <tbody className={className} style={style} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', style = {}, ...props }) {
  return (
    <tr className={className} style={style} {...props}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '', style = {}, align = 'left', ...props }) {
  const alignClass = align === 'right' ? 'align-right' : '';
  return (
    <td className={[alignClass, className].filter(Boolean).join(' ')} style={style} {...props}>
      {children}
    </td>
  );
}
