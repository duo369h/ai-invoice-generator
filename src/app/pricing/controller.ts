/**
 * Pricing Page Controller Delegation — Corvioz v5.7
 */

import { loadPaddleScript, resolvePaddleEnvironment, validatePaddleClientToken } from '@/app/lib/paddle-client';
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

    const env = resolvePaddleEnvironment();
    const token = validatePaddleClientToken(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN, env);
    if (isInvalidPaddleValue(priceId)) {
      throw new Error(`Paddle price ID is missing or contains a placeholder for plan "${planId}".`);
    }

    const activeEnv = env;
    const activeToken = token;

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
