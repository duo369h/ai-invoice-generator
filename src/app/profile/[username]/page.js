import ProfileCardClient from '../../components/ProfileCardClient';
import { buildProfileFaqItems, isPublicIndexableProfile } from '../../lib/seo-data';
import { createPublicSupabaseClient } from '../../lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const demoProfile = {
  username: 'demo',
  name: 'Alex Morgan',
  title: 'Independent Brand Designer',
  bio: 'Alex helps early-stage companies turn unclear positioning into polished brand systems, landing pages, and launch assets. This demo Corvioz profile shows how a public freelancer page can present services, proof, pricing context, and quote requests in one client-ready place.',
  contact_email: 'demo@corvioz.com',
  is_public: true,
  tags: ['brand design', 'landing pages', 'startup launch', 'visual identity'],
  services: [
    {
      name: 'Brand Identity Sprint',
      description: 'A focused brand system with direction, logo usage, colors, typography, and launch-ready visual assets.',
      price: '$1,800',
    },
    {
      name: 'Landing Page Design',
      description: 'Conversion-focused landing page design with responsive sections, CTA hierarchy, and handoff notes.',
      price: '$2,400',
    },
  ],
  portfolio: [
    {
      title: 'SaaS Launch Identity',
      description: 'Positioning, identity, and landing page visuals for a B2B SaaS launch.',
      url: 'https://www.corvioz.com',
    },
  ],
  testimonials: [
    {
      name: 'Demo Client',
      role: 'Founder',
      quote: 'The project scope, quote, invoice, and public profile all felt connected and easy to review.',
    },
  ],
  social_links: {
    website: 'https://www.corvioz.com',
  },
  starting_price: '$1,800',
  location: 'Remote / US & Canada',
  timezone: 'ET / PT overlap',
  languages: 'English',
  availability_status: 'Available for new projects',
  response_time: '< 24 hours',
  verified_badge: true,
  top_rated_badge: true,
  fast_response_badge: true,
  cover_banner: 'linear-gradient(135deg, var(--gray-900) 0%, var(--primary) 45%, var(--accent) 100%)',
};

function ensureKeywordRichBio(profile) {
  if (profile.bio && profile.bio.trim().length > 15) {
    return profile.bio;
  }
  const name = profile.name || 'Freelancer';
  const title = profile.title || 'Independent Digital Consultant';
  const location = profile.location ? ` based in ${profile.location}` : '';
  
  let servicesText = '';
  if (profile.services && Array.isArray(profile.services) && profile.services.length > 0) {
    servicesText = profile.services.map(s => s.name).join(', ');
  } else if (profile.tags && Array.isArray(profile.tags) && profile.tags.length > 0) {
    servicesText = profile.tags.join(', ');
  } else {
    servicesText = 'expert digital services';
  }
  
  return `${name} is an experienced ${title}${location}, specializing in end-to-end service delivery including ${servicesText}. View my public portfolio, request pricing estimates, and draft secure project contracts directly.`;
}

async function getPublicProfile(username, overridePlan) {
  const safeUsername = String(username || '').toLowerCase().trim();
  if (!/^[a-z0-9_-]{3,40}$/.test(safeUsername)) return null;
  if (safeUsername === 'demo') {
    return {
      ...demoProfile,
      bio: ensureKeywordRichBio(demoProfile),
      plan: overridePlan || 'pro'
    };
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('card_profiles')
    .select('*')
    .eq('username', safeUsername)
    .eq('is_public', true)
    .maybeSingle();

  if (error || !data) {
    const displayName = safeUsername.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return {
      ...demoProfile,
      username: safeUsername,
      name: displayName,
      title: 'Independent Digital Consultant',
      bio: `${displayName} is an experienced freelancer specialized in end-to-end service delivery and project scoping. This page demonstrates a premium public freelancer portfolio optimized for client conversion.`,
      plan: 'free'
    };
  }

  const { createServiceSupabaseClient } = await import('../../lib/supabase');
  const adminSupabase = createServiceSupabaseClient();
  let plan = 'free';
  if (adminSupabase) {
    const { data: profileData } = await adminSupabase
      .from('profiles')
      .select('plan')
      .eq('id', data.user_id)
      .maybeSingle();
    if (profileData) {
      plan = profileData.plan || 'free';
    }
  }

  const resolvedProfile = {
    ...data,
    bio: ensureKeywordRichBio(data),
    plan
  };

  return resolvedProfile;
}

export async function generateMetadata({ params, searchParams }) {
  const { username } = await params;
  const resolvedSearchParams = await searchParams;
  const planParam = resolvedSearchParams?.plan;
  const safeUsername = String(username || '').toLowerCase().trim();
  const profile = await getPublicProfile(safeUsername, planParam);
  
  if (!profile) {
    return {
      title: 'Profile Not Found | Corvioz',
      description: 'The requested freelancer profile was not found on Corvioz.',
      robots: { index: false, follow: false }
    };
  }

  const isPaid = profile.plan && ['pro', 'growth', 'studio', 'agency'].includes(profile.plan.toLowerCase());
  const canIndex = isPaid && isPublicIndexableProfile(profile);
  
  const title = `${profile.name || safeUsername} | Freelancer Profile`;
  const description = profile.bio 
    ? `${profile.bio.slice(0, 150)}${profile.bio.length > 150 ? '...' : ''}`
    : 'Professional freelancer profile on Corvioz.';

  return {
    title,
    description,
    keywords: [
      `${safeUsername} profile`,
      'freelancer profile',
      'freelancer services',
      'request freelancer quote',
      'hire freelancer on Corvioz',
      'expert freelancer services',
      'hire freelance developer',
      'hire freelance designer',
      'contract templates',
      'freelancer client portal'
    ],
    alternates: { canonical: `/profile/${safeUsername}` },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `/profile/${safeUsername}`,
      username: safeUsername,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: canIndex,
      follow: true,
    },
  };
}

export default async function Page({ params, searchParams }) {
  const { username } = await params;
  const resolvedSearchParams = await searchParams;
  const planParam = resolvedSearchParams?.plan;
  const safeUsername = String(username || '').toLowerCase().trim();
  const profile = await getPublicProfile(safeUsername, planParam);
  const faqItems = profile ? buildProfileFaqItems(profile) : [];

  return (
    <ProfileCardClient
      username={safeUsername || username}
      profile={profile}
      faqItems={faqItems}
    />
  );
}
