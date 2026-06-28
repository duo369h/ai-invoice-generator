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
  cover_banner: 'linear-gradient(135deg, #111827 0%, #4f46e5 45%, #06b6d4 100%)',
};

async function getPublicProfile(username) {
  const safeUsername = String(username || '').toLowerCase().trim();
  if (!/^[a-z0-9_-]{3,40}$/.test(safeUsername)) return null;
  if (safeUsername === 'demo') return demoProfile;

  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('card_profiles')
    .select('*')
    .eq('username', safeUsername)
    .eq('is_public', true)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch profile metadata:', error);
    return null;
  }
  if (!data) return null;

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

  return { ...data, plan };
}

export async function generateMetadata({ params }) {
  const { username } = await params;
  const safeUsername = String(username || '').toLowerCase().trim();
  const profile = await getPublicProfile(safeUsername);
  const canIndex = isPublicIndexableProfile(profile);
  const title = canIndex
    ? `${profile.name} | Corvioz Freelancer Profile`
    : 'Freelancer Profile | Corvioz';
  const description = canIndex
    ? `${profile.bio.slice(0, 150)}${profile.bio.length > 150 ? '...' : ''}`
    : 'This Corvioz freelancer profile is not publicly available.';

  return {
    title,
    description,
    keywords: [
      `${safeUsername || 'freelancer'} profile`,
      'freelancer profile',
      'freelancer services',
      'request freelancer quote',
      'hire freelancer on Corvioz',
      'project quote request',
    ],
    alternates: { canonical: `/card/${safeUsername || username}` },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `/card/${safeUsername || username}`,
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

export default async function Page({ params }) {
  const { username } = await params;
  const safeUsername = String(username || '').toLowerCase().trim();
  const profile = safeUsername === 'demo' ? demoProfile : null;
  const faqItems = profile ? buildProfileFaqItems(profile) : [];

  return (
    <ProfileCardClient
      username={safeUsername || username}
      profile={profile}
      faqItems={faqItems}
    />
  );
}
