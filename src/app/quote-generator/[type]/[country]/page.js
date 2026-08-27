import { notFound } from 'next/navigation';
import MatrixCountryPage from '../../../components/MatrixCountryPage';
import { buildMatrixCountryPage, matrixCountryParams } from '../../../lib/seo-data';
import { getCanonicalSiteUrl, CANONICAL_OG_IMAGE_URL } from '../../../lib/config';

export const dynamicParams = true;

export function generateStaticParams() {
  return matrixCountryParams;
}

export async function generateMetadata({ params }) {
  const page = buildMatrixCountryPage('quote', await params);
  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.canonicalPath },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      images: [CANONICAL_OG_IMAGE_URL],
      title: page.title,
      description: page.description,
      url: page.canonicalPath,
      type: 'website',
    },
  };
}

export default async function QuoteMatrixCountryPage({ params }) {
  const page = buildMatrixCountryPage('quote', await params);
  if (!page) notFound();

  return <MatrixCountryPage page={page} siteUrl={getCanonicalSiteUrl()} />;
}
