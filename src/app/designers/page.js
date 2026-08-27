import React from 'react';
import FreelancersDirectory from '../freelancers/page';
import { CANONICAL_OG_IMAGE_URL } from '../lib/config';

export const metadata = {
  title: 'Hire Top Brand, Graphic & Web Designers | Corvioz',
  description: 'Collaborate with verified freelance brand designers, web designers, and product design experts. Send brief details, get quotes, and manage deliverables.',
  alternates: { canonical: '/designers' },
  openGraph: {
    images: [CANONICAL_OG_IMAGE_URL],
    title: 'Hire Top Brand, Graphic & Web Designers | Corvioz',
    description: 'Collaborate with verified freelance brand designers, web designers, and product design experts.',
    url: '/designers',
    type: 'website'
  }
};

export default function DesignersPage() {
  return <FreelancersDirectory defaultRole="Designer" />;
}
