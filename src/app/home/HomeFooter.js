import Link from 'next/link';

export default function HomeFooter() {
  return (
    <footer className="site-footer" id="site-footer" role="contentinfo">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <Link href="/" className="footer-wordmark" aria-label="Corvioz home">Corvioz</Link>
            <p className="footer-brand-desc">A focused workspace for quotes, invoices, client records, and recorded payment status.</p>
            <Link href="/dashboard" className="footer-signin-link">Sign in →</Link>
          </div>
          <div className="footer-nav-col">
            <h3 className="footer-col-label">Product</h3>
            <ul className="footer-link-list"><li><Link href="/#how-corvioz-works" className="footer-link">How It Works</Link></li><li><Link href="/for-photographers" className="footer-link">For Photographers</Link></li><li><Link href="/pricing" className="footer-link">Pricing</Link></li><li><Link href="/security" className="footer-link">Security</Link></li></ul>
          </div>
          <div className="footer-nav-col">
            <h3 className="footer-col-label">Resources</h3>
            <ul className="footer-link-list"><li><Link href="/blog" className="footer-link">Blog</Link></li><li><Link href="/blog/invoice-vs-quote-vs-receipt" className="footer-link">Client Document Guide</Link></li><li><Link href="/invoice-template/photographer" className="footer-link">Photographer Template</Link></li><li><Link href="/help" className="footer-link">Help Center</Link></li></ul>
          </div>
          <div className="footer-nav-col">
            <h3 className="footer-col-label">Legal</h3>
            <ul className="footer-link-list"><li><Link href="/privacy" className="footer-link">Privacy Policy</Link></li><li><Link href="/terms" className="footer-link">Terms of Service</Link></li><li><Link href="/refund-policy" className="footer-link">Refund Policy</Link></li><li><a href="mailto:support@corvioz.com" className="footer-link">support@corvioz.com</a></li></ul>
          </div>
        </div>
        <div className="footer-trust-strip" role="complementary" aria-label="Compliance information">
          <span className="footer-trust-item">Subscriptions are handled through Paddle. Corvioz does not store card details.</span>
          <span className="footer-trust-sep" aria-hidden="true"/>
          <span className="footer-trust-item">Documents, profile assets, and portfolio content you host on Corvioz are your exclusive property.</span>
          <span className="footer-trust-sep" aria-hidden="true"/>
          <span className="footer-trust-item"><Link href="/security" className="footer-trust-link">Security information →</Link></span>
        </div>
        <div className="footer-bottom-row"><span className="footer-copyright">© 2026 Corvioz</span><div className="footer-bottom-links"><Link href="/privacy" className="footer-bottom-link">Privacy</Link><Link href="/terms" className="footer-bottom-link">Terms</Link><Link href="/security" className="footer-bottom-link">Security</Link></div></div>
      </div>
    </footer>
  );
}
