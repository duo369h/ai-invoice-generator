import React from 'react';
import FreelancersDirectory from '../freelancers/page';
import { CANONICAL_OG_IMAGE_URL } from '../lib/config';

export const metadata = {
  title: 'Hire Premium Freelance Business Consultants | Corvioz',
  description: 'Find experienced freelance consultants, fractional executives, and advisors. Verify timezone settings, request estimates, and pay securely.',
  alternates: { canonical: '/consultants' },
  openGraph: {
    images: [CANONICAL_OG_IMAGE_URL],
    title: 'Hire Premium Freelance Business Consultants | Corvioz',
    description: 'Find experienced freelance consultants, fractional executives, and advisors.',
    url: '/consultants',
    type: 'website'
  }
};

export default function ConsultantsPage() {
  return <FreelancersDirectory defaultRole="Consultant" />;
}
