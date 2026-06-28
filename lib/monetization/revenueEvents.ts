function getTrackEvent(): any {
  try {
    const analytics = require('@/app/lib/analytics');
    return analytics.trackEvent || (() => {});
  } catch (e) {
    if (typeof window !== 'undefined') {
      const win = window as any;
      if (typeof win.__corvioz_track_event === 'function') {
        return win.__corvioz_track_event;
      }
    }
    return () => {};
  }
}

export function trackPaywallView(triggerSource: string, limitType: string, planAttempted: string = 'pro') {
  getTrackEvent()('paywall_view', {
    trigger_source: triggerSource,
    limit_type: limitType,
    plan_attempted: planAttempted,
  });
}

export function trackUpgradeClick(triggerSource: string, plan: string) {
  getTrackEvent()('upgrade_click', {
    trigger_source: triggerSource,
    plan: plan,
  });
}

export function trackPricingView(triggerSource?: string) {
  getTrackEvent()('pricing_view', {
    trigger_source: triggerSource || 'direct',
  });
}

export function trackCheckoutStarted(triggerSource: string, plan: string, priceId?: string) {
  getTrackEvent()('payment_start', {
    trigger_source: triggerSource,
    plan: plan,
    price_id: priceId,
  });
}

export function trackCheckoutCompleted(triggerSource: string, plan: string, priceId: string, transactionId: string, revenue: number) {
  getTrackEvent()('payment_success', {
    trigger_source: triggerSource,
    plan: plan,
    price_id: priceId,
    transaction_id: transactionId,
    revenue: revenue,
  });
}

export function trackFeatureBlocked(triggerSource: string, featureKey: string) {
  getTrackEvent()('feature_blocked', {
    trigger_source: triggerSource,
    feature_key: featureKey,
  });
}

