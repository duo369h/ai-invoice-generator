/*
 * B+ sidebar icon set — Quote, Invoice, Clients, Client Portal.
 *
 * Source of truth: design/icon-direction-exploration/candidates-bplus/
 *   quote-16.svg, invoice-16.svg, clients-16.svg, portal-16.svg
 * (see HANDOFF.md in that folder for the full design rationale/history).
 *
 * These components transcribe those approved 16x16 SVGs path-for-path.
 * Geometry must not be edited here — if the design changes, regenerate
 * from the approved source files instead of hand-editing paths in place.
 *
 * Conventions:
 *   - viewBox is always "0 0 16 16", matching the hand-tuned 16px source
 *     (not a scaled-down 20px variant).
 *   - stroke="currentColor" so color is controlled entirely by the
 *     consumer via CSS/inline style color, matching how the rest of the
 *     sidebar icon set (lucide-react) already behaves.
 *   - strokeWidth defaults to 1.7 (default state). Pass 1.8 for the active
 *     state. This is the ONLY prop that should differ between default and
 *     active — path data is identical in both cases by construction.
 *   - fill is always "none".
 */
import React from 'react';

export function QuoteIcon({ size = 16, strokeWidth = 1.7, style, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={style} {...rest}>
      <g fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="butt" strokeLinejoin="round">
        <path d="M10.8457 2.9H4.7a1.2 1.2 0 0 0 -1.2 1.2v7.6a0.9 0.9 0 0 0 0.9 0.9h8.45a0.25 0.25 0 0 0 0.25 -0.25V6.5" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="butt" strokeLinejoin="round">
        <path d="M4.7 8.3h6.0" />
        <path d="M4.7 10.4h3.4" />
      </g>
    </svg>
  );
}

export function InvoiceIcon({ size = 16, strokeWidth = 1.7, style, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={style} {...rest}>
      <g fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="butt" strokeLinejoin="miter">
        <path d="M9.7 2.9H4.5a1 1 0 0 0 -1 1v5.7a0.3 0.3 0 0 0 0.3 0.3l2.1 1.1l2.1 -1.1l2.1 1.1l2.1 -1.1V6.5" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="butt" strokeLinejoin="round">
        <path d="M4.5 7.5h5.9" />
      </g>
    </svg>
  );
}

export function ClientsIcon({ size = 16, strokeWidth = 1.7, style, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={style} {...rest}>
      <g fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M1.88 12.34C2.34 11.52 3.82 10.29 4.95 10.29S7.56 11.52 8.03 12.34" />
        <circle cx="4.95" cy="8.55" r="2.05" />
        <path d="M10.17 6.88C10.44 6.40 11.28 5.67 11.99 5.67S13.54 6.40 13.81 6.88" />
        <circle cx="11.99" cy="4.58" r="1.28" />
      </g>
    </svg>
  );
}

export function ClientPortalIcon({ size = 16, strokeWidth = 1.7, style, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={style} {...rest}>
      <g fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="butt" strokeLinejoin="round">
        <path d="M5.367 2.95H3.75a1.1 1.1 0 0 0 -1.1 1.1v7.1a0.7 0.7 0 0 0 0.7 0.7h3.85" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="butt" strokeLinejoin="miter">
        <path d="M7.3 7.4h3.7m-1.6-1.6 1.6 1.6-1.6 1.6" />
      </g>
    </svg>
  );
}
