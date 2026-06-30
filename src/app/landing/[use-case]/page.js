import GrowthLandingPage from '../../components/GrowthLandingPage';
import { GROWTH_LANDING_PAGES, getGrowthLandingPage } from '../../../core/growth/landingExpansion';

export function generateStaticParams() {
  return GROWTH_LANDING_PAGES
    .filter((page) => page.path.startsWith('/landing/'))
    .map((page) => ({ 'use-case': page.path.replace('/landing/', '') }));
}

export default function UseCaseLandingPage({ params }) {
  const spec = getGrowthLandingPage(params['use-case']);
  return <GrowthLandingPage spec={spec} />;
}
