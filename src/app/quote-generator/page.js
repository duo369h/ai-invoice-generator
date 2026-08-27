import SeoMoneyPage from '../components/SeoMoneyPage';
import { coreMoneyPages } from '../lib/seo-data';
import { CANONICAL_OG_IMAGE_URL } from '../lib/config';

const page = coreMoneyPages['/quote-generator'];

export const metadata = {
  title: 'Free Quote Generator for Freelancers',
  description: 'Create client-ready freelance quotes with project scope, milestones, optional add-ons, pricing, terms, and a clean path from estimate to invoice.',
  alternates: { canonical: '/quote-generator' },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    images: [CANONICAL_OG_IMAGE_URL],
    title: 'Free Quote Generator for Freelancers',
    description: 'Create client-ready freelance quotes with project scope, milestones, optional add-ons, pricing, terms, and a clean path from estimate to invoice.',
    url: '/quote-generator',
    type: 'website',
  },
};

export default function QuoteGeneratorPage() {
  return <SeoMoneyPage page={page} />;
}
