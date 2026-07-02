/**
 * Pricing Page Controller Delegation — Corvioz v5.7
 */

import { loadPaddleScript } from '@/app/lib/paddle-client';
import { trackEvent } from '@/app/lib/analytics';
import { saveSelectedPlan } from '@/app/lib/intent-store';

export interface CheckoutContext {
  planId: string;
  priceId: string;
  session: any;
  searchParams: any;
  setCheckoutLoading: (loading: boolean) => void;
}

function isInvalidPaddleValue(value: string): boolean {
  const normalized = String(value || '').trim().toLowerCase();
  return !normalized || normalized.includes('placeholder');
}

const CHECKOUT_PLAN_IDS = ['starter', 'pro'] as const;

/**
 * Triggers Paddle checkout opening or redirects anonymous users to sign up.
 */
export async function handleUpgradeCheckout(context: CheckoutContext): Promise<void> {
  const { planId, priceId, session, searchParams, setCheckoutLoading } = context;

  if (!CHECKOUT_PLAN_IDS.includes(planId as any)) {
    console.error(`Invalid checkout plan "${planId}". Only starter and pro are purchasable.`);
    return;
  }

  // 1. Log select event
  trackEvent('pricing_select_plan', {
    plan: planId,
    signed_in: Boolean(session),
  });

  // 2. Unauthenticated user handling
  if (!session) {
    if (typeof window !== 'undefined') {
      saveSelectedPlan(planId, window.location.pathname);
      window.location.href = `/signup?redirect=/pricing&plan=${planId}`;
    }
    return;
  }

  // 3. Authenticated Paddle checkout execution
  setCheckoutLoading(true);
  try {
    const paddle = await loadPaddleScript();
    if (!paddle) {
      alert('Failed to load Paddle payment script. Please check your network connection and try again.');
      setCheckoutLoading(false);
      return;
    }

    const triggerSource = searchParams?.get('source') || 'pricing_page';

    const isProd = process.env.NODE_ENV === 'production';
    const env = process.env.NEXT_PUBLIC_PADDLE_ENV;
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

    if (isProd) {
      if (!env || env !== 'production') {
        throw new Error('CRITICAL PADDLE ERROR: Production environment is missing or misconfigured (NEXT_PUBLIC_PADDLE_ENV must be "production").');
      }
      if (isInvalidPaddleValue(token)) {
        throw new Error('CRITICAL PADDLE ERROR: Production client token is missing or contains placeholder.');
      }
      if (isInvalidPaddleValue(priceId)) {
        throw new Error(`CRITICAL PADDLE ERROR: Production price ID is missing or contains placeholder for plan "${planId}".`);
      }
    }

    const activeEnv = isProd ? env : (env || 'sandbox');
    const activeToken = isProd ? token : (token || 'test_token_placeholder');

    paddle.Environment.set(activeEnv);
    
    paddle.Initialize({ 
      token: activeToken,
      eventCallback: (event: any) => {
        if (event.name === 'checkout.completed') {
          trackEvent('payment_success', {
            plan: planId,
            price_id: priceId,
            trigger_source: triggerSource,
          });
          window.location.href = '/dashboard?checkout=success';
        }
      }
    });

    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: {
        email: session.user.email,
      },
      customData: {
        user_id: session.user.id,
      }
    });
  } catch (err) {
    console.error('Paddle checkout failed:', err);
    alert('Checkout could not be initialized. Please try again.');
  } finally {
    setCheckoutLoading(false);
  }
}
