export type RevenueSimulation = {
  simulatedEarnings: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  clientGrowth: string;
  collectionSignal: string;
};

export function getRevenueSimulation(): RevenueSimulation {
  return {
    simulatedEarnings: 3200,
    invoiceCount: 2,
    paidInvoiceCount: 1,
    clientGrowth: '+1 repeat client opportunity',
    collectionSignal: '50% collected, final milestone ready for follow-up',
  };
}

export function getPlanRevenueSignal(planId: string): string {
  if (planId === 'free') return 'Preview the workflow before client delivery.';
  if (planId === 'starter') return 'Organize early client work with a consistent process.';
  if (planId === 'pro') return 'Manage repeat clients and follow-up moments.';
  if (planId === 'studio') return 'Prepare higher-volume delivery operations.';
  return 'Understand the workflow before choosing a plan.';
}
