import React from 'react';
import { getCardProfileByUsername } from '../../lib/db';
import { isSupabaseConfigured } from '../../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import ProfileCardClient from '../../components/ProfileCardClient';

async function getProfileData(username) {
  const lowerUsername = String(username || '').toLowerCase().trim();
  if (!lowerUsername) return null;

  // Check if Supabase is configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const { data, error } = await supabase
        .from('card_profiles')
        .select('*')
        .eq('username', lowerUsername)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.error('Failed to query card profile in Supabase:', err);
    }
  }

  // Local / Mock fallback
  return getCardProfileByUsername(lowerUsername);
}

export async function generateMetadata({ params }) {
  const { username } = await params;
  const profile = await getProfileData(username);

  if (!profile) {
    return {
      title: 'Profile Not Found | Freelancer Business OS',
      description: 'The requested freelancer card profile was not found on our platform.',
      robots: {
        index: false,
        follow: true
      }
    };
  }

  const siteTitle = `${profile.name || username} — ${profile.title || 'Independent Professional'} | Business Profile`;
  const siteDesc = profile.bio || `Hire ${profile.name || username} on Freelancer Business OS. View services, rates, portfolios, and request project quotes directly.`;

  return {
    title: siteTitle,
    description: siteDesc,
    keywords: [
      `${profile.name || username} profile`,
      `${profile.title || 'freelancer'} quote`,
      'hire freelancer',
      'freelancer profile card',
      'project quote request'
    ],
    openGraph: {
      title: siteTitle,
      description: siteDesc,
      type: 'profile',
      username: profile.username
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDesc
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

export default async function Page({ params }) {
  const { username } = await params;
  const profile = await getProfileData(username);
  
  return <ProfileCardClient profile={profile} />;
}
