import type { GrowthFunnelStage, GrowthFunnelEvent } from './funnelDefinition';

export type GrowthMetricKey =
  | 'activation_rate'
  | 'conversion_rate'
  | 'funnel_dropoff'
  | 'cta_performance'
  | 'pricing_selection_behavior';

export type GrowthMetricDefinition = {
  key: GrowthMetricKey;
  numerator: GrowthFunnelEvent | GrowthFunnelStage;
  denominator: GrowthFunnelEvent | GrowthFunnelStage;
  unit: 'percent' | 'count' | 'ratio';
  description: string;
};

export const GROWTH_ANALYTICS_SCHEMA: GrowthMetricDefinition[] = [
  {
    key: 'activation_rate',
    numerator: 'activation',
    denominator: 'landing_view',
    unit: 'percent',
    description: 'Share of landing viewers who reach first value.',
  },
  {
    key: 'conversion_rate',
    numerator: 'conversion',
    denominator: 'pricing_view',
    unit: 'percent',
    description: 'Share of pricing viewers who reach paid conversion intent.',
  },
  {
    key: 'funnel_dropoff',
    numerator: 'landing_view',
    denominator: 'visit',
    unit: 'ratio',
    description: 'Stage-by-stage drop-off between acquisition and activation.',
  },
  {
    key: 'cta_performance',
    numerator: 'cta_click',
    denominator: 'landing_view',
    unit: 'percent',
    description: 'CTA click performance by page, placement, and variant.',
  },
  {
    key: 'pricing_selection_behavior',
    numerator: 'pricing_selection',
    denominator: 'pricing_view',
    unit: 'percent',
    description: 'Plan selection behavior split by Free, Starter, Pro, and Studio.',
  },
];
