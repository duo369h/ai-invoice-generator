import { NextResponse } from 'next/server';
import { getRequestUser } from '../../../lib/supabase';
import { getPricingIntelligence } from '../../../../core/pricing/PRICING_INTELLIGENCE_ENGINE';
import { buildPricingProfile } from '../../../../core/learning/PRICING_LEARNING_PROFILE_ENGINE';
import { enqueueLearningEvent } from '../../../../core/learning/LEARNING_EVENT_QUEUE';

// v3.3 Strategy Learning Injection imports
import { getSegmentProfile } from '../../../../core/revenue/v3/USER_SEGMENT_ENGINE';
import { buildStrategyBias, getBiasForSegment } from '../../../../core/revenue/v3/REVENUE_STRATEGY_BIAS_ENGINE';
import { buildSegmentMatrix, getBestStrategyForUserSegment } from '../../../../core/revenue/v3/REVENUE_SEGMENT_MATRIX_ENGINE';
import { buildLearningMatrix } from '../../../../core/revenue/v3/REVENUE_STRATEGY_LEARNING_MATRIX';
import { getLearningRecommendation } from '../../../../core/revenue/v3/REVENUE_LEARNING_RECOMMENDER';
import { getStrategyWithAutopilot } from '../../../../core/revenue/v3/REVENUE_STRATEGY_ENGINE';

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

    // 2️⃣ Fetch historical decisions from database
    let history = [];
    if (context && context.mode === 'supabase') {
      const { data, error } = await context.supabase
        .from('revenue_decisions')
        .select('*')
        .eq('user_id', context.user.id)
        .limit(20);

      if (!error && data) {
        history = data.map((row, i) => {
          const base = Number(row.recommended_price || 800);
          return {
            userId,
            clientType: 'new',
            projectType: row.service_type || 'web_design',
            optionsShown: {
              high: Math.round(base * 1.3),
              recommended: base,
              fast: Math.round(base * 0.8),
            },
            selectedOption: row.accepted ? 'RECOMMENDED' : 'HIGH',
            timestamp: i,
          };
        });
      }
    }

    // 3️⃣ Build user pricing style profile
    const profile = buildPricingProfile(history);

    // 4️⃣ Run Pricing Engine with optional profile adjustment
    const jobTypeMap = {
      web_design: 'web_design',
      ui_ux: 'ui_ux',
      logo: 'logo',
      invoice_system: 'invoice_system',
      marketing: 'marketing',
    };
    const resolvedJobType = jobTypeMap[serviceType] || 'web_design';

    const pricing = getPricingIntelligence({
      jobType: resolvedJobType,
      clientType: clientType === 'enterprise' ? 'enterprise' : clientType === 'startup' ? 'startup' : 'individual',
      urgency,
      clarity: 'medium',
    }, profile);

    // 5️⃣ Determine confidence and learning state messages
    let confidence = 'low';
    if (profile.sampleSize >= 10) {
      confidence = 'high';
    } else if (profile.sampleSize >= 3) {
      confidence = 'medium';
    }

    let learningState = "We don’t know your pricing style yet. Keep using the system to improve recommendations.";
    if (profile.sampleSize >= 10) {
      learningState = "We now adapt pricing based on your behavior.";
    } else if (profile.sampleSize >= 2) {
      learningState = `We are learning your pricing preferences. Sample size: ${profile.sampleSize} decisions`;
    }

    // Fetch outcomes from database to build matrices
    let outcomes = [];
    if (context && context.mode === 'supabase') {
      const { data, error } = await context.supabase
        .from('revenue_outcomes')
        .select('*')
        .eq('user_id', context.user.id);
      if (!error && data) {
        outcomes = data.map(row => ({
          client_type: row.client_type,
          user_segment: row.user_segment || 'VALUE_SEEKER',
          strategy_used: row.strategy_used,
          outcome: row.outcome,
          price_offered: row.price_offered,
          price_accepted: row.price_accepted,
          timestamp: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        }));
      }
    }

    // Determine user segment from behavioral history
    const segmentProfile = getSegmentProfile(userId, basePrice);
    const userSegment = segmentProfile.segment;

    // Build learning matrix and strategy bias snapshots
    const biasOutput = buildStrategyBias(outcomes);
    const segmentMatrixSnapshot = buildSegmentMatrix(outcomes);
    const learningMatrixSnapshot = buildLearningMatrix(outcomes);

    // v3.3 Strategy Bias Hook (Task 6)
    const getStrategyBias = (seg) => getBiasForSegment(biasOutput, seg);
    const applyBias = (base, biasSig) => {
      // ❗Cannot change rule engine output, only adjust recommendation (advisory only)
      return biasSig ? biasSig.strategy : base;
    };

    const bias = getStrategyBias(userSegment);
    const baseStrategy = "BALANCED";
    const adjustedStrategy = applyBias(baseStrategy, bias);

    // Calculate options and run Strategy Engine with Autopilot (Task 7)
    const priceOptions = {
      max: Math.round(pricing.suggestedPrice * 1.3),
      balanced: pricing.suggestedPrice,
      fastDeal: Math.round(pricing.suggestedPrice * 0.8),
    };

    const strategyInput = {
      clientType: clientType === 'enterprise' ? 'long_term' : clientType === 'startup' ? 'repeat' : 'new',
      urgency,
      cashNeed: 'medium',
      relationshipValue: profile.sampleSize > 5 ? 0.8 : 0.5,
      priceOptions,
    };

    const historicalData = {
      outcomes,
      segmentMatrix: segmentMatrixSnapshot,
    };

    const strategyDecisions = getStrategyWithAutopilot(
      strategyInput,
      userSegment,
      historicalData,
      biasOutput,
      learningMatrixSnapshot,
      null, // prior matrix
      0     // matrix age
    );

    // Generate recommendation & learningInsight for the UI
    const recomm = getLearningRecommendation(
      strategyInput.clientType,
      strategyInput.urgency,
      "general",
      learningMatrixSnapshot
    );

    const learningInsight = {
      totalCasesAnalyzed: segmentMatrixSnapshot.totalRecords,
      matrixVersion: learningMatrixSnapshot.matrixVersion,
      strategyStats: ["MAX_REVENUE", "BALANCED", "FAST_DEAL"].map(strat => {
        const cell = segmentMatrixSnapshot.matrix[userSegment]?.[strat] || { winRate: 0, avgRevenue: 0, sampleSize: 0 };
        const balancedCell = segmentMatrixSnapshot.matrix[userSegment]?.BALANCED || { avgRevenue: 0 };
        const baseline = balancedCell.avgRevenue || basePrice;
        const uplift = baseline > 0 ? ((cell.avgRevenue - baseline) / baseline) * 100 : 0;
        return {
          strategy: strat,
          winRate: cell.winRate,
          revenueUplift: parseFloat(uplift.toFixed(1)),
          sampleSize: cell.sampleSize,
        };
      }),
      recommendedStrategy: recomm.recommendedStrategy,
      reason: recomm.reason,
      confidence: recomm.confidence,
      fallbackUsed: recomm.fallbackUsed,
    };

    if (context?.user?.id) {
      enqueueLearningEvent({
        user_id: context.user.id,
        decision: {
          service_type: serviceType,
          suggested_price: pricing.suggestedPrice,
          adjusted_price: pricing.adjustedPrice,
        },
        outcome: 'PENDING',
      });
    }

    // 6️⃣ Return unified parameters enriched with v3.3/v3.5 strategies & insights
    return NextResponse.json({
      marketRange: pricing.marketRange,
      suggestedPrice: pricing.suggestedPrice,
      adjustedPrice: pricing.adjustedPrice,
      profile,
      confidence,
      learningState,
      strategies: strategyDecisions,
      learningInsight,
      autopilot: strategyDecisions[0]?.autopilotMetadata || null,
      biasHookApplied: {
        segment: userSegment,
        baseStrategy,
        adjustedStrategy,
      },
    });

  } catch (error) {
    console.error('Error in POST /api/revenue/decision:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
