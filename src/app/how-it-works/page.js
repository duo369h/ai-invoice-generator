import PublicHeader from '../components/PublicHeader';
import SharedFooter from '../components/SharedFooter';
import HowItWorksBody from './HowItWorksBody';
import './how-it-works.css';
import { CANONICAL_OG_IMAGE_URL, CANONICAL_TWITTER_IMAGE_URL } from '../lib/config';

export const metadata = {
  title: 'How Corvioz Works — From Quote to Invoice & Payment Records',
  description: 'See how client work moves through Corvioz from quote to client response, invoice, and recorded payment status.',
  alternates: { canonical: '/how-it-works' },
  openGraph: {
    images: [CANONICAL_OG_IMAGE_URL],
    title: 'How Corvioz Works — From Quote to Invoice & Payment Records',
    description: 'See how client work moves through Corvioz from quote to client response, invoice, and recorded payment status.',
    url: '/how-it-works',
  },
  twitter: {
    images: [CANONICAL_TWITTER_IMAGE_URL],
    card: 'summary',
    title: 'How Corvioz Works — From Quote to Invoice & Payment Records',
    description: 'See how client work moves through Corvioz from quote to client response, invoice, and recorded payment status.',
  },
};

export default function HowItWorksPage() {
  return (
    <div className="how-it-works-page">
      <PublicHeader route="/how-it-works" />
      <HowItWorksBody />
      <SharedFooter />
    </div>
  );
}
