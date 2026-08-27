import React from 'react';
import FreelancersDirectory from '../freelancers/page';
import { CANONICAL_OG_IMAGE_URL } from '../lib/config';

export const metadata = {
  title: 'Hire Verified Growth & Performance Marketers | Corvioz',
  description: 'Hire freelance marketing directors, performance marketing consultants, and content writers. Request briefs, track timelines, and pay directly.',
  alternates: { canonical: '/marketers' },
  openGraph: {
    images: [CANONICAL_OG_IMAGE_URL],
    title: 'Hire Verified Growth & Performance Marketers | Corvioz',
    description: 'Hire freelance marketing directors, performance marketing consultants, and content writers.',
    url: '/marketers',
    type: 'website'
  }
};

export default function MarketersPage() {
  return <FreelancersDirectory defaultRole="Marketer" />;
}
