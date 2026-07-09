'use client';

import Link from 'next/link';
import { sendEvent } from '../../core/analytics/eventRouter';
import { captureSignupIntent, saveIntendedRoute } from '../lib/intent-store';

const CTA_LABEL = 'Start quoting for free';
const INTENDED_ROUTE = '/dashboard?tool=quote&mode=create&flow=first-quote';
const CTA_HREF = `/signup?redirect=${encodeURIComponent(INTENDED_ROUTE)}`;

export default function ForPhotographersCta({
  position,
  className = 'btn btn-primary btn-lg',
  style = {},
}) {
  return (
    <Link
      href={CTA_HREF}
      className={className}
      style={style}
      onClick={() => {
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
          position,
          source: 'for_photographers',
          destination: CTA_HREF,
        });
      }}
    >
      {CTA_LABEL}
    </Link>
  );
}
