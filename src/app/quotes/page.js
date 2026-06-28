import Dashboard from '../../components/dashboard/Dashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function QuotesPage() {
  return <Dashboard mode="live" initialTool="quote" />;
}
