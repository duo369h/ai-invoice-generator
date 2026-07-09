'use client';

import PublicHeader from '../components/PublicHeader';
import { sendEvent } from '../../core/analytics/eventRouter';
import { captureSignupIntent, saveIntendedRoute } from '../lib/intent-store';

const CTA_LABEL = 'Start quoting for free';
const INTENDED_ROUTE = '/dashboard?tool=quote&mode=create&flow=first-quote';
const CTA_HREF = `/signup?redirect=${encodeURIComponent(INTENDED_ROUTE)}`;

export default function ForPhotographersHeader() {
  return (
    <PublicHeader
      route="/for-photographers"
      surfaceId="for-photographers-public-header"
      className="navbar landing-nav"
      navLinks={[
        { label: 'Workflow', href: '#photography-workflow' },
        { label: 'Use Cases', href: '#photography-use-cases' },
        { label: 'FAQ', href: '#photographer-faq' },
        { label: 'Pricing', href: '#pricing-transition' },
      ]}
      accountAction={null}
      primaryAction={{
        label: CTA_LABEL,
        href: CTA_HREF,
        variant: 'primary',
        onClick: () => {
          captureSignupIntent({
            clicked_feature: 'quote',
            source_page: 'for_photographers',
            cta_clicked: CTA_LABEL,
            intended_route: INTENDED_ROUTE,
          });
          saveIntendedRoute(INTENDED_ROUTE, 'for_photographers', CTA_LABEL);
          sendEvent('CTA_CLICK', {
            cta_name: CTA_LABEL,
            label: CTA_LABEL,
            position: 'navbar',
            source: 'for_photographers',
            destination: CTA_HREF,
          });
        },
      }}
    />
  );
}
