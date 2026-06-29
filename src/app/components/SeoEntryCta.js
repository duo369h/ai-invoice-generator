'use client';

import Link from 'next/link';
// Telemetry layer purged - UI is pure render only
const trackEvent = () => {};
import { captureSignupIntent, saveIntendedRoute } from '../lib/intent-store';

export default function SeoEntryCta({
  href,
  children,
  variant = 'primary',
  size = '',
  eventProps = {},
  style = {},
}) {
  const className = ['btn', `btn-${variant}`, size ? `btn-${size}` : ''].filter(Boolean).join(' ');
  const ctaName = typeof children === 'string' ? children : 'SEO entry CTA';
  const lowerCta = ctaName.toLowerCase();
  const clickedFeature = href.includes('invoice') || lowerCta.includes('invoice')
    ? 'invoice'
    : href.includes('quote') || lowerCta.includes('quote')
      ? 'quote'
      : href.includes('pricing') || lowerCta.includes('pricing')
        ? 'pricing'
        : 'explore';

  return (
    <Link
      href={href}
      className={className}
      style={style}
      onClick={() => {
        if (ctaName === 'Start Free' || clickedFeature !== 'explore') {
          captureSignupIntent({
            clicked_feature: clickedFeature,
            source_page: eventProps.page_slug || 'seo_entry',
            cta_clicked: ctaName,
            intended_route: clickedFeature === 'invoice' ? '/dashboard?tool=invoice' : clickedFeature === 'quote' ? '/dashboard?tool=quote' : href,
          });
          saveIntendedRoute(clickedFeature === 'invoice' ? '/dashboard?tool=invoice' : clickedFeature === 'quote' ? '/dashboard?tool=quote' : href, eventProps.page_slug || 'seo_entry', ctaName);
          trackEvent('signup_click', {
            destination: href,
            clicked_feature: clickedFeature,
            cta_clicked: ctaName,
            ...eventProps,
          });
        }
        trackEvent('cta_click', {
          cta_name: ctaName,
          destination: href,
          ...eventProps,
        });
      }}
    >
      {children}
    </Link>
  );
}
