import { notFound } from 'next/navigation';
import MatrixSeoPage from '../../../../components/MatrixSeoPage';
import { buildMatrixSeoPage, matrixSeoParams } from '../../../../lib/seo-data';
import { getSiteUrl } from '../../../../lib/config';

export const dynamicParams = true;

export function generateStaticParams() {
  return matrixSeoParams;
}

export async function generateMetadata({ params }) {
  const page = buildMatrixSeoPage('invoice', await params);
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
      title: page.title,
      description: page.description,
      url: page.canonicalPath,
      type: 'website',
    },
  };
}

export default async function InvoiceMatrixSeoPage({ params }) {
  const page = buildMatrixSeoPage('invoice', await params);
  if (!page) notFound();

  return <MatrixSeoPage page={page} siteUrl={getSiteUrl()} />;
}
