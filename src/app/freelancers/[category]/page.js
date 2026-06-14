'use client';

import React from 'react';
import FreelancersDirectory from '../page';

export default function FreelancerCategoryPage({ params }) {
  const unwrappedParams = React.use(params);
  const category = unwrappedParams.category || '';
  
  let role = 'All';
  const clean = category.toLowerCase().trim();
  if (clean === 'designers' || clean === 'designer') role = 'Designer';
  if (clean === 'developers' || clean === 'developer') role = 'Developer';
  if (clean === 'writers' || clean === 'writer') role = 'Writer';
  if (clean === 'consultants' || clean === 'consultant') role = 'Consultant';
  if (clean === 'marketers' || clean === 'marketer' || clean === 'marketing') role = 'Marketer';

  return <FreelancersDirectory defaultRole={role} />;
}
