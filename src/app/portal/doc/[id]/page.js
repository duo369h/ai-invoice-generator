import PortalClientView from '../../../components/PortalClientView';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata = {
  title: 'Private Client Document | Corvioz',
  description: 'Private Corvioz client document link for a quote or invoice.',
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

export default async function DocumentPortal({ params }) {
  const { id } = await params;

  return (
    <PortalClientView
      fetchUrl={`/api/portal/doc/${id}`}
      postCommentUrl={`/api/portal/doc/${id}`}
      identifier={id}
    />
  );
}
