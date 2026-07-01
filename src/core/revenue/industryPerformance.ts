import type { ConversionEventName } from '../analytics/conversionEvents';

export type IndustryPerformanceEvent = {
  industry_id: string;
  industry_category: string;
  event: ConversionEventName;
  visitor_id: string;
  revenue_amount?: number;
};

export type IndustryPerformanceSummary = {
  industry_id: string;
  industry_category: string;
  visitors: number;
  templateViews: number;
  ctaClicks: number;
  signups: number;
  planSelections: number;
  checkouts: number;
  revenue: number;
  ctaClickRate: number;
  signupRate: number;
  checkoutRate: number;
  revenuePerVisitor: number;
};

const templateViewEvents = new Set<ConversionEventName>([
  'VIEW_INVOICE_TEMPLATE',
  'VIEW_QUOTE_TEMPLATE',
  'VIEW_PROPOSAL_TEMPLATE',
]);

const ctaClickEvents = new Set<ConversionEventName>([
  'CLICK_CREATE_QUOTE',
  'CLICK_CREATE_INVOICE',
  'CLICK_SIGNUP',
]);

function roundRate(value: number): number {
  return Number(value.toFixed(4));
}

function emptySummary(industry_id: string, industry_category: string): IndustryPerformanceSummary {
  return {
    industry_id,
    industry_category,
    visitors: 0,
    templateViews: 0,
    ctaClicks: 0,
    signups: 0,
    planSelections: 0,
    checkouts: 0,
    revenue: 0,
    ctaClickRate: 0,
    signupRate: 0,
    checkoutRate: 0,
    revenuePerVisitor: 0,
  };
}

export function summarizeIndustryPerformance(events: IndustryPerformanceEvent[]): IndustryPerformanceSummary[] {
  const grouped = new Map<string, {
    summary: IndustryPerformanceSummary;
    visitors: Set<string>;
  }>();

  for (const event of events) {
    const key = event.industry_id;
    const record = grouped.get(key) ?? {
      summary: emptySummary(event.industry_id, event.industry_category),
      visitors: new Set<string>(),
    };

    record.visitors.add(event.visitor_id);

    if (templateViewEvents.has(event.event)) record.summary.templateViews += 1;
    if (ctaClickEvents.has(event.event)) record.summary.ctaClicks += 1;
    if (event.event === 'CLICK_SIGNUP' || event.event === 'START_ONBOARDING') record.summary.signups += 1;
    if (event.event === 'SELECT_PLAN') record.summary.planSelections += 1;
    if (event.event === 'START_CHECKOUT') record.summary.checkouts += 1;
    if (event.revenue_amount && event.revenue_amount > 0) record.summary.revenue += event.revenue_amount;

    grouped.set(key, record);
  }

  return Array.from(grouped.values())
    .map(({ summary, visitors }) => {
      const visitorCount = visitors.size;
      return {
        ...summary,
        visitors: visitorCount,
        ctaClickRate: visitorCount > 0 ? roundRate(summary.ctaClicks / visitorCount) : 0,
        signupRate: visitorCount > 0 ? roundRate(summary.signups / visitorCount) : 0,
        checkoutRate: visitorCount > 0 ? roundRate(summary.checkouts / visitorCount) : 0,
        revenuePerVisitor: visitorCount > 0 ? roundRate(summary.revenue / visitorCount) : 0,
      };
    })
    .sort((a, b) => b.revenuePerVisitor - a.revenuePerVisitor || b.signupRate - a.signupRate || b.ctaClickRate - a.ctaClickRate);
}

export function getTopConvertingIndustries(
  summaries: IndustryPerformanceSummary[],
  limit = 10,
): IndustryPerformanceSummary[] {
  return [...summaries]
    .sort((a, b) => b.checkoutRate - a.checkoutRate || b.signupRate - a.signupRate || b.ctaClickRate - a.ctaClickRate)
    .slice(0, limit);
}

export function getWeakestIndustries(
  summaries: IndustryPerformanceSummary[],
  limit = 10,
): IndustryPerformanceSummary[] {
  return [...summaries]
    .sort((a, b) => a.ctaClickRate - b.ctaClickRate || a.signupRate - b.signupRate || a.revenuePerVisitor - b.revenuePerVisitor)
    .slice(0, limit);
}
