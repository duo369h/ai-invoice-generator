import { notFound } from 'next/navigation';
import TemplateSeoPage from '../../components/TemplateSeoPage';
import { buildTemplatePageData, getTemplateIndustry, templateIndustrySlugs } from '../../lib/seo-data';

export function generateStaticParams() {
  return templateIndustrySlugs.map((industry) => ({ industry }));
}

export async function generateMetadata({ params }) {
  const { industry: slug } = await params;
  const industry = getTemplateIndustry(slug);
  if (!industry) return {};
  const page = buildTemplatePageData('quote', industry);

  return {
    title: page.seoTitle,
    description: page.description,
    alternates: { canonical: `/quote-template/${slug}` },
    openGraph: {
      title: page.seoTitle,
      description: page.description,
      url: `/quote-template/${slug}`,
      type: 'article',
    },
  };
}

export default async function QuoteTemplatePage({ params }) {
  const { industry: slug } = await params;
  const industry = getTemplateIndustry(slug);
  if (!industry) notFound();

  return <TemplateSeoPage page={buildTemplatePageData('quote', industry)} />;
}
