import PortalClientView from '../../components/PortalClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata = {
  title: 'Private Client Portal | Corvioz',
  description: 'Private Corvioz client portal link for quotes, invoices, comments, and payment status.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default async function ClientPortal({ params }) {
  const { token } = await params;

  return (
    <PortalClientView
      fetchUrl={`/api/portal/token/${token}`}
      postCommentUrl={`/api/portal/token/${token}`}
      identifier={token}
    />
  );
}
