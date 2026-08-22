'use client';

import Link from 'next/link';

const columns = [
  ['Product', [['How It Works', '/#how-corvioz-works'], ['For Photographers', '/for-photographers'], ['Pricing', '/pricing'], ['Security', '/security']]],
  ['Resources', [['Blog', '/blog'], ['Client Document Guide', '/blog/invoice-vs-quote-vs-receipt'], ['Photographer Template', '/invoice-template/photographer'], ['Help Center', '/help']]],
  ['Legal', [['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Refund Policy', '/refund-policy'], ['support@corvioz.com', 'mailto:support@corvioz.com']]],
];

export default function SharedFooter() {
  return (
    <footer className="site-footer" id="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <Link href="/" className="footer-wordmark" aria-label="Corvioz home">Corvioz</Link>
            <p>A focused workspace for quotes, invoices, client records, and recorded payment status.</p>
            <Link href="/dashboard" className="footer-signin-link">Sign in <span aria-hidden="true">→</span></Link>
          </div>
          {columns.map(([title, links]) => (
            <div className="footer-nav-col" key={title}>
              <h2>{title}</h2>
              <ul>{links.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="footer-trust-strip" aria-label="Product and policy information">
          <span>Subscriptions are handled through Paddle. Corvioz does not store card details.</span>
          <span>Documents, profile assets, and portfolio content you host on Corvioz are your exclusive property.</span>
          <Link href="/security">Security information <span aria-hidden="true">→</span></Link>
        </div>
        <div className="footer-bottom-row">
          <span>© 2026 Corvioz</span>
          <nav aria-label="Legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link></nav>
        </div>
      </div>
    </footer>
  );
}
