import GrowthLandingPage from '../components/GrowthLandingPage';
import { getGrowthLandingPage } from '../../core/growth/landingExpansion';

export default function ClientManagementPage() {
  return <GrowthLandingPage spec={getGrowthLandingPage('client-management')} />;
}
