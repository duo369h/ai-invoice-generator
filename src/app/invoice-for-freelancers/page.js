import GrowthLandingPage from '../components/GrowthLandingPage';
import { getGrowthLandingPage } from '../../core/growth/landingExpansion';

export default function InvoiceForFreelancersPage() {
  return <GrowthLandingPage spec={getGrowthLandingPage('freelance-invoice')} />;
}
