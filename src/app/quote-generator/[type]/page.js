import { notFound } from 'next/navigation';
import ProgrammaticSeoPage from '../../components/ProgrammaticSeoPage';
import { buildProgrammaticSeoPage, programmaticSeoSlugs } from '../../lib/seo-data';
import { getSiteUrl } from '../../lib/config';

export const dynamicParams = true;

export function generateStaticParams() {
  return programmaticSeoSlugs.map((type) => ({ type }));
}

export async function generateMetadata({ params }) {
  const { type } = await params;
  const page = buildProgrammaticSeoPage('quote', type);
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

export default async function QuoteProgrammaticSeoPage({ params }) {
  const { type } = await params;
  const page = buildProgrammaticSeoPage('quote', type);
  if (!page) notFound();

  return <ProgrammaticSeoPage page={page} siteUrl={getSiteUrl()} />;
}
