'use client';

import Dashboard from '../../components/dashboard/Dashboard';
import TierRouter from './TierRouter';

export default function DashboardPage() {
  return (
    <TierRouter>
      <Dashboard mode="live" />
    </TierRouter>
  );
}
