// This is NOT a feature hierarchy system.
// This is a revenue track system.
// Each tier is an independent product experience.
// No cross-tier dependency is allowed.

import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "../../lib/supabase-service";

/**
 * CANONICAL PRODUCT TRUTH PRICING PLANS (V2)
 * Stale DB rows must not override frozen product truth.
 */
const CANONICAL_PLANS = [
  {
    id: "free",
    name: "Free",
    status: "active",
    tagline: "A real place to begin.",
    description: "For trying Corvioz with the client work you already have.",
    price_monthly: 0.00,
    price_yearly: 0.00,
    currency: "USD",
    billing_cycles: { monthly: 0, yearly: 0 },
    paddle_monthly_price_id: "",
    paddle_yearly_price_id: "",
    features: [
      "Quotes and invoices",
      "5 new documents each cycle",
      "PDF exports with Corvioz branding"
    ],
    badge_text: null,
    display_order: 1,
    active: true
  },
  {
    id: "starter",
    name: "Starter",
    status: "active",
    tagline: "Make it part of the way you work.",
    description: "For regular client work, with more room and clean documents.",
    price_monthly: 9.00,
    price_yearly: 90.00,
    currency: "USD",
    billing_cycles: { monthly: 9, yearly: 90 },
    paddle_monthly_price_id: "",
    paddle_yearly_price_id: "",
    features: [
      "Quotes and invoices",
      "30 new documents each billing cycle",
      "Clean PDF exports"
    ],
    badge_text: "2 months free",
    display_order: 2,
    active: true
  },
  {
    id: "pro",
    name: "Pro",
    status: "active",
    tagline: "Give the whole experience a little more care.",
    description: "For unlimited work and a client experience that lives in Corvioz too.",
    price_monthly: 19.00,
    price_yearly: 190.00,
    currency: "USD",
    billing_cycles: { monthly: 19, yearly: 190 },
    paddle_monthly_price_id: "",
    paddle_yearly_price_id: "",
    features: [
      "Everything in Starter",
      "Unlimited new documents",
      "Client Portal with client approval"
    ],
    badge_text: "2 months free",
    display_order: 3,
    active: true
  },
  {
    id: "studio",
    name: "Studio",
    status: "coming_soon",
    tagline: "",
    description: "Future roadmap tier",
    price_monthly: null,
    price_yearly: null,
    currency: "USD",
    billing_cycles: { monthly: null, yearly: null },
    paddle_monthly_price_id: "",
    paddle_yearly_price_id: "",
    features: [],
    badge_text: "Coming Soon",
    display_order: 4,
    active: false
  }
];

export async function GET() {
  try {
    const starterPrice = process.env.NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID || "";
    const starterYearlyPrice = process.env.NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID || "";
    const proPrice = process.env.NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID || process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID || "";
    const proYearlyPrice = process.env.NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID || "";

    const plans = CANONICAL_PLANS.map(plan => {
      let paddle_monthly_price_id = plan.paddle_monthly_price_id;
      let paddle_yearly_price_id = plan.paddle_yearly_price_id;

      if (plan.id === "starter") {
        if (starterPrice) paddle_monthly_price_id = starterPrice;
        if (starterYearlyPrice) paddle_yearly_price_id = starterYearlyPrice;
      } else if (plan.id === "pro") {
        if (proPrice) paddle_monthly_price_id = proPrice;
        if (proYearlyPrice) paddle_yearly_price_id = proYearlyPrice;
      }

      return {
        ...plan,
        paddle_monthly_price_id,
        paddle_yearly_price_id,
      };
    });

    return NextResponse.json({ success: true, plans });
  } catch (err) {
    console.error("Error in GET /api/pricing:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
