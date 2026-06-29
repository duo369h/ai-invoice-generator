import { redirect } from 'next/navigation';

export default function ProposalPage() {
  redirect('/dashboard?tool=proposal');
}
