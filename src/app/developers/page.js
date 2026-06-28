import React from 'react';
import FreelancersDirectory from '../freelancers/page';

export const metadata = {
  title: 'Hire Verified Next.js & React Developers | Corvioz',
  description: 'Find premium freelance Next.js, React, and full-stack software developers in the US and Canada. Request quotes, view availability, and get started instantly.',
  alternates: { canonical: '/developers' },
  openGraph: {
    title: 'Hire Verified Next.js & React Developers | Corvioz',
    description: 'Find premium freelance Next.js, React, and full-stack software developers in the US and Canada.',
    url: '/developers',
    type: 'website'
  }
};

export default function DevelopersPage() {
  return <FreelancersDirectory defaultRole="Developer" />;
}
