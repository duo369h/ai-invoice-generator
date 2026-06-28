import { NextResponse } from 'next/server';
import { requireInternalAdmin } from '../../../lib/internal-admin';

// Module-level in-memory state
let safetyMode = 'safe'; // 'safe' | 'balanced' | 'experiment'
let overrides = {}; // decision_id -> overridden_status ('Approved' | 'Blocked' | 'Softened')

const BASELINE_DECISIONS = [
  {
    id: 'dec_1',
    action: 'Increase Pro Plan Pricing by 25% ($19 -> $24)',
    category: 'pricing',
    risk_level: 'medium',
    risk_score: 52,
    timestamp: '02:14:10'
  },
  {
    id: 'dec_2',
    action: 'Enforce Hard blocking paywall on PDF export limit',
    category: 'paywall',
    risk_level: 'high',
    risk_score: 84,
    timestamp: '01:55:04'
  },
  {
    id: 'dec_3',
    action: 'Restrict invoicing limit to 2 invoices per month for US Contractor segment',
    category: 'funnel',
    risk_level: 'medium',
    risk_score: 68,
    timestamp: '01:12:30'
  },
  {
    id: 'dec_4',
    action: 'Aggressive pricing trigger standard tier standard plan to $29',
    category: 'pricing',
    risk_level: 'high',
    risk_score: 78,
    timestamp: '00:55:12'
  },
  {
    id: 'dec_5',
    action: 'Soft watermark paywall on PDF export for standard workspace',
    category: 'paywall',
    risk_level: 'low',
    risk_score: 15,
    timestamp: '00:22:15'
  }
];

// Dynamically compute decision details based on safetyMode and overrides
function getProcessedDecisions() {
  return BASELINE_DECISIONS.map(dec => {
    // Check if there is an active manual override
    if (overrides[dec.id]) {
      const status = overrides[dec.id];
      let reason = `Manual Override: Action forced to ${status} by operator.`;
      let risk_level = dec.risk_level;
      if (status === 'Approved') risk_level = 'low';
      else if (status === 'Softened') risk_level = 'medium';
      else if (status === 'Blocked') risk_level = 'high';
      
      return {
        ...dec,
        status,
        risk_level,
        reason,
        is_overridden: true
      };
    }

    // Default logic governed by safetyMode thresholds
    let status = 'Approved';
    let reason = 'Approved: Safe action with low risk profile.';
    
    if (safetyMode === 'safe') {
      if (dec.risk_score > 70) {
        status = 'Blocked';
        reason = `Blocked: Churn risk exceeds safety threshold (${dec.risk_score} > 70).`;
      } else if (dec.risk_score > 45) {
        status = 'Softened';
        reason = `Softened: Risk score of ${dec.risk_score} is moderate. Paywall pressure reduced.`;
      } else {
        status = 'Approved';
        reason = `Approved: Risk score (${dec.risk_score}) is within safe thresholds.`;
      }
    } else if (safetyMode === 'balanced') {
      if (dec.risk_score > 80) {
        status = 'Blocked';
        reason = `Blocked: High risk profile (${dec.risk_score} > 80) under balanced validation rules.`;
      } else if (dec.risk_score > 60) {
        status = 'Softened';
        reason = `Softened: Moderately high risk of churn (${dec.risk_score}). Softened boundaries applied.`;
      } else {
        status = 'Approved';
        reason = `Approved: Standard checks OK. Risk score of ${dec.risk_score} accepted.`;
      }
    } else if (safetyMode === 'experiment') {
      if (dec.risk_score > 90) {
        status = 'Blocked';
        reason = `Blocked: Extreme risk score (${dec.risk_score} > 90) exceeds validation boundary.`;
      } else if (dec.risk_score > 75) {
        status = 'Softened';
        reason = `Softened: Churn risk ${dec.risk_score} softened slightly to run optimization tests.`;
      } else {
        status = 'Approved';
        reason = `Approved: Experiment mode active. Relaxed boundaries applied for score ${dec.risk_score}.`;
      }
    }

    return {
      ...dec,
      status,
      reason,
      is_overridden: false
    };
  });
}

// Compute aggregate metrics
function getProcessedMetrics(processedDecisions) {
  const total = 520;
  const approvedCount = processedDecisions.filter(d => d.status === 'Approved').length * 80 + 120;
  const blockedCount = processedDecisions.filter(d => d.status === 'Blocked').length * 80 + 20;
  const softenedCount = processedDecisions.filter(d => d.status === 'Softened').length * 80 + 10;
  
  let misclassification_rate = 1.2;
  let revenue_drift_status = 'Minimal';
  
  if (safetyMode === 'safe') {
    misclassification_rate = 1.1;
    revenue_drift_status = 'Minimal';
  } else if (safetyMode === 'balanced') {
    misclassification_rate = 2.4;
    revenue_drift_status = 'Normal';
  } else if (safetyMode === 'experiment') {
    misclassification_rate = 5.8;
    revenue_drift_status = 'Critical Drift';
  }

  return {
    total_evaluated: total,
    approved_count: approvedCount,
    blocked_count: blockedCount,
    softened_count: softenedCount,
    misclassification_rate,
    revenue_drift_status,
    safety_mode: safetyMode
  };
}

export async function GET(request) {
  try {
    const gate = await requireInternalAdmin(request);
    if (gate.response) return gate.response;
    const processedDecisions = getProcessedDecisions();
    const metrics = getProcessedMetrics(processedDecisions);

    const drift_data = {
      dates: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      simulated_revenue: [12400, 13100, 14200, 15000, 15500, 16800],
      real_behavior_revenue: safetyMode === 'experiment' 
        ? [12350, 13000, 13700, 14100, 13900, 14200] // Shows critical drift
        : [12380, 13080, 14150, 14920, 15380, 16650], // Minimal drift
      alerts: safetyMode === 'experiment' 
        ? [
            'Alert: Real-user conversion rate is drifting from simulated projection (2.1% actual vs 2.8% projected).',
            'Warning: Invoice -> Quote step conversion has degraded by -15% in high-risk segment.',
            'Caution: Experiment mode is driving high churn among standard plan free trial users.'
          ]
        : safetyMode === 'balanced'
        ? [
            'Warning: Minor revenue drift detected in Contractor tier (offset of -2.5%).',
            'Notice: Paywall pressure softened on PDF exports.'
          ]
        : [
            'Notice: Validation shield active. No major revenue drift or funnel anomalies detected.'
          ]
    };

    return NextResponse.json({
      success: true,
      metrics,
      decisions: processedDecisions,
      drift_data
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const gate = await requireInternalAdmin(request);
    if (gate.response) return gate.response;
    const body = await request.json().catch(() => ({}));
    
    // 1. Check for safety mode change
    if (body.set_safety_mode) {
      const mode = body.set_safety_mode;
      if (['safe', 'balanced', 'experiment'].includes(mode)) {
        safetyMode = mode;
        return NextResponse.json({
          success: true,
          safety_mode: safetyMode,
          message: `Safety mode changed to ${mode.toUpperCase()}`
        });
      }
    }

    // 2. Check for manual override decision
    if (body.override_id && body.override_status) {
      const { override_id, override_status } = body;
      if (['Approved', 'Blocked', 'Softened'].includes(override_status)) {
        overrides[override_id] = override_status;
        return NextResponse.json({
          success: true,
          overrides,
          message: `Decision ${override_id} manually overridden to ${override_status}`
        });
      }
    }

    // 3. Check for rollback optimizations (resets overrides)
    if (body.rollback_overrides) {
      overrides = {};
      return NextResponse.json({
        success: true,
        overrides,
        message: 'All manual safety overrides have been rolled back to baseline.'
      });
    }

    // 4. Default POST: behaves like GET
    const processedDecisions = getProcessedDecisions();
    const metrics = getProcessedMetrics(processedDecisions);
    
    return NextResponse.json({
      success: true,
      metrics,
      decisions: processedDecisions
    });
  } catch (error) {
    console.error('Validation API failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal validation error',
    }, { status: 500 });
  }
}
