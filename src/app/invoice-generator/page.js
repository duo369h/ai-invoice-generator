import SeoMoneyPage from '../components/SeoMoneyPage';
import { coreMoneyPages } from '../lib/seo-data';
import { CANONICAL_OG_IMAGE_URL } from '../lib/config';

const page = coreMoneyPages['/invoice-generator'];

export const metadata = {
  title: page.seoTitle,
  description: page.description,
  alternates: { canonical: '/invoice-generator' },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    images: [CANONICAL_OG_IMAGE_URL],
    title: page.seoTitle,
    description: page.description,
    url: '/invoice-generator',
    type: 'website',
  },
};

export default function InvoiceGeneratorPage() {
  return <SeoMoneyPage page={page} />;
}
