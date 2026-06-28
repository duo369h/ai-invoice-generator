import { NextResponse } from 'next/server';
import { getRequestUser } from '../../../lib/supabase';
import { enqueueLearningEvent } from '../../../../core/learning/LEARNING_EVENT_QUEUE';
import { getDecision } from '../../../../core/ai/AI_DECISION_CORE';
import { assertCoreDecisionSource } from '../../../../core/ai/AI_DECISION_GUARD';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      serviceType = 'web_design',
      basePrice = 800,
      clientType = 'small_business',
      urgency = 'medium',
      region = 'US',
    } = body;

    // 1️⃣ Resolve user profile context
    const context = await getRequestUser(request).catch(() => null);
    const userId = context?.user?.id || 'anonymous';

    const decision = getDecision(userId, {
      serviceType,
      basePrice,
      clientContext: clientType,
      urgency,
      region,
    });
    assertCoreDecisionSource("AI_DECISION_CORE");

    const pricingBias = Number(decision.output?.pricing_bias || 1);
    const corePrice = Math.round(Number(basePrice || 0) * pricingBias);

    if (context?.user?.id) {
      enqueueLearningEvent({
        user_id: context.user.id,
        decision: {
          service_type: serviceType,
          core_price: corePrice,
          decision_source: "AI_DECISION_CORE",
        },
        outcome: 'PENDING',
      });
    }

    const res = {
      source: "AI_DECISION_CORE",
      price: corePrice,
      confidence: decision.output.confidence,
      decision: decision.output,
    };
    return NextResponse.json({
      ...res,
      data: res,
      ai: {
        mode: "core_driven",
        source: "AI_DECISION_CORE"
      }
    });

  } catch (error) {
    console.error('Error in POST /api/revenue/decision:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
