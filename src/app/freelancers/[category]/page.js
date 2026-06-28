import React from 'react';
import { notFound } from 'next/navigation';
import FreelancersDirectory from '../page';

const allowedCategories = {
  designers: 'Designer',
  designer: 'Designer',
  developers: 'Developer',
  developer: 'Developer',
  writers: 'Writer',
  writer: 'Writer',
  consultants: 'Consultant',
  consultant: 'Consultant',
  marketers: 'Marketer',
  marketer: 'Marketer',
  marketing: 'Marketer'
};

export function generateStaticParams() {
  return [
    { category: 'designers' },
    { category: 'developers' },
    { category: 'writers' },
    { category: 'consultants' },
    { category: 'marketers' }
  ];
}

export async function generateMetadata({ params }) {
  const { category } = await params;
  const clean = String(category || '').toLowerCase().trim();
  const role = allowedCategories[clean];

  if (!role) return {};

  const title = `Hire Top Freelance ${role}s | Corvioz Directory`;
  const description = `Find, collaborate with, and hire verified freelance ${role}s in the US and Canada. Review portfolios, verify timezone matching, and request custom quotes.`;
  const canonicalPath = `/freelancers/${clean}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: 'website'
    }
  };
}

export default async function FreelancerCategoryPage({ params }) {
  const { category } = await params;
  const clean = String(category || '').toLowerCase().trim();
  const role = allowedCategories[clean];

  if (!role) notFound();

  return <FreelancersDirectory defaultRole={role} />;
}
