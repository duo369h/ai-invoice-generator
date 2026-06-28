// Starter World — Corvioz v10
// Plan: 'pro' ($9/mo) — "First Client Closure Engine"
// Independent tier experience. No cross-tier logic allowed.

import StarterDashboard from '../../../components/dashboard/StarterDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function StarterDashboardPage() {
  return <StarterDashboard />;
}
