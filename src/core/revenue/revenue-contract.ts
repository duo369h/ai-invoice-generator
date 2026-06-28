export const REVENUE_EVENT_CONTRACT = {
  invoice_created: {
    state: 'engagement',
    monetization_stage: 'early_interest',
  },
  invoice_sent: {
    state: 'conversion_intent',
    monetization_stage: 'mid_funnel',
  },
  invoice_paid: {
    state: 'revenue_realized',
    monetization_stage: 'cash_in',
  },
};
