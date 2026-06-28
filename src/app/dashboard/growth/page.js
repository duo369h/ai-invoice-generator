// Growth World — Corvioz v10
// Plan: 'growth' ($19/mo) — "Income Engine"
// Independent tier experience. No cross-tier logic allowed.

import GrowthDashboard from '../../../components/dashboard/GrowthDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function GrowthDashboardPage() {
  return <GrowthDashboard />;
}
