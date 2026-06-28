// Studio World — Corvioz v10
// Plan: 'studio' ($29/mo) — "Client Growth Pack"
// Independent tier experience. No cross-tier logic allowed.

import StudioDashboard from '../../../components/dashboard/StudioDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function StudioDashboardPage() {
  return <StudioDashboard />;
}
