import { getSiteUrl } from "./lib/config";
import { getCardProfiles } from "./lib/db";
import { createClient } from "@supabase/supabase-js";

async function getProfileUsernames() {
  const usernames = [];
  
  // Fetch from Supabase if configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data } = await supabase.from('card_profiles').select('username');
      if (data) {
        data.forEach(p => {
          if (p.username) usernames.push(p.username.toLowerCase().trim());
        });
      }
    } catch (err) {
      console.error("Sitemap failed to fetch from Supabase:", err);
    }
  }
  
  // Fetch from Local DB
  try {
    const localProfiles = getCardProfiles();
    localProfiles.forEach(p => {
      if (p.username) {
        const lower = p.username.toLowerCase().trim();
        if (!usernames.includes(lower)) {
          usernames.push(lower);
        }
      }
    });
  } catch (err) {
    console.error("Sitemap failed to fetch local profiles:", err);
  }

  return usernames;
}

export default async function sitemap() {
  const baseUrl = getSiteUrl();

  const seoPages = [
    "how-to-invoice-clients-as-freelancer",
    "freelance-contract-template-guide",
    "how-to-get-paid-faster-as-freelancer",
    "invoice-vs-quote-vs-receipt",
    "freelance-pricing-guide",
    "invoice-template-for-freelancer",
    "invoice-template-for-consultant",
    "invoice-template-for-agency",
    "invoice-template-for-designer",
    "invoice-template-for-developer",
    "freelancers-in-new-york",
    "freelancers-in-los-angeles",
    "freelancers-in-toronto",
    "freelancers-in-vancouver",
    "best-freelance-designers",
    "best-freelance-developers",
    "best-freelance-consultants"
  ];

  const roles = [
    'developer', 'designer', 'consultant', 'marketer', 'copywriter', 'photographer', 
    'videographer', 'seo-specialist', 'virtual-assistant', 'writer', 'illustrator', 
    'social-media-manager', 'product-manager', 'architect', 'voice-actor', 
    'translator', 'editor', 'animator', 'accountant', 'coach', 'tutor', 'lawyer', 
    'recruiter', 'content-writer', 'web-designer', 'mobile-developer', 'brand-designer',
    'ui-ux-designer', 'interior-designer', 'strategy-consultant', 'bookkeeper',
    'ui-designer', 'webflow-designer', 'framer-designer'
  ];

  const types = [
    'invoice-template-for-',
    'proposal-template-for-',
    'quote-template-for-',
    'contract-template-for-',
    'pricing-guide-for-',
    'billing-guide-for-',
    'freelance-guide-for-'
  ];

  const dynamicSeoPages = [...seoPages];
  types.forEach(type => {
    roles.forEach(role => {
      dynamicSeoPages.push(`${type}${role}`);
    });
  });

  roles.forEach(role => {
    dynamicSeoPages.push(`how-to-price-${role}-projects`);
    dynamicSeoPages.push(`how-to-get-freelance-${role}-clients`);
    dynamicSeoPages.push(`best-invoice-software-for-${role}s`);
    dynamicSeoPages.push(`best-${role}-crm`);
  });

  const seoUrls = dynamicSeoPages.map((page) => ({
    url: `${baseUrl}/${page}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const usernames = await getProfileUsernames();
  const cardUrls = usernames.map((username) => ({
    url: `${baseUrl}/card/${username}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...seoUrls,
    ...cardUrls,
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/payment-instructions`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}
