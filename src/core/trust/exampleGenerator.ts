export type TrustDocumentStatus = 'draft' | 'sent' | 'approved' | 'paid';

export type TrustLineItem = {
  label: string;
  amount: number;
};

export type TrustQuoteExample = {
  id: string;
  title: string;
  client: string;
  service: string;
  status: TrustDocumentStatus;
  total: number;
  timeline: string[];
  lineItems: TrustLineItem[];
};

export type TrustInvoiceExample = {
  id: string;
  title: string;
  client: string;
  dueDate: string;
  status: TrustDocumentStatus;
  total: number;
  paidAmount: number;
  lineItems: TrustLineItem[];
};

export type TrustProposalExample = {
  id: string;
  title: string;
  client: string;
  outcome: string;
  milestones: string[];
  approvalSignal: string;
};

export type TrustClientRecordExample = {
  id: string;
  client: string;
  project: string;
  lifecycle: 'quoted' | 'invoiced' | 'paid';
  nextAction: string;
  value: number;
};

export type TrustLayerExamples = {
  quote: TrustQuoteExample;
  invoice: TrustInvoiceExample;
  proposal: TrustProposalExample;
  clientRecord: TrustClientRecordExample;
};

const quoteExample: TrustQuoteExample = {
  id: 'quote-web-redesign-001',
  title: 'Website redesign quote',
  client: 'Northstar Studio',
  service: 'Landing page redesign',
  status: 'approved',
  total: 3200,
  timeline: ['Quote drafted', 'Client approved scope', 'Invoice ready'],
  lineItems: [
    { label: 'Discovery and page strategy', amount: 600 },
    { label: 'Homepage design system', amount: 1400 },
    { label: 'Responsive implementation support', amount: 1200 },
  ],
};

const invoiceExample: TrustInvoiceExample = {
  id: 'invoice-web-redesign-001',
  title: 'Invoice from approved quote',
  client: 'Northstar Studio',
  dueDate: 'Net 7',
  status: 'sent',
  total: 3200,
  paidAmount: 1600,
  lineItems: [
    { label: 'Approved redesign milestone', amount: 1600 },
    { label: 'Final delivery milestone', amount: 1600 },
  ],
};

const proposalExample: TrustProposalExample = {
  id: 'proposal-web-redesign-001',
  title: 'Client-ready proposal',
  client: 'Northstar Studio',
  outcome: 'Launch a clearer homepage that converts inbound leads into booked calls.',
  milestones: ['Strategy and wireframe', 'Visual direction', 'Final responsive handoff'],
  approvalSignal: 'Scope confirmed before invoice creation',
};

const clientRecordExample: TrustClientRecordExample = {
  id: 'client-record-northstar',
  client: 'Northstar Studio',
  project: 'Landing page redesign',
  lifecycle: 'invoiced',
  nextAction: 'Follow up on final milestone payment',
  value: 3200,
};

export function getTrustLayerExamples(): TrustLayerExamples {
  return {
    quote: quoteExample,
    invoice: invoiceExample,
    proposal: proposalExample,
    clientRecord: clientRecordExample,
  };
}

export function getPlanOutputExample(planId: string): string {
  if (planId === 'free') return 'Watermarked quote preview and sample client workflow';
  if (planId === 'starter') return 'Clean invoice delivery with payment status tracking';
  if (planId === 'pro') return 'Quote, invoice, client portal, and follow-up workspace';
  if (planId === 'studio') return 'White-label client delivery and studio operation previews';
  return 'Quote-to-invoice workflow preview';
}
