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
  const page = buildTemplatePageData('invoice', industry);

  return {
    title: page.seoTitle,
    description: page.description,
    alternates: { canonical: `/invoice-template/${slug}` },
    openGraph: {
      title: page.seoTitle,
      description: page.description,
      url: `/invoice-template/${slug}`,
      type: 'article',
    },
  };
}

export default async function InvoiceTemplatePage({ params }) {
  const { industry: slug } = await params;
  const industry = getTemplateIndustry(slug);
  if (!industry) notFound();

  return <TemplateSeoPage page={buildTemplatePageData('invoice', industry)} />;
}
