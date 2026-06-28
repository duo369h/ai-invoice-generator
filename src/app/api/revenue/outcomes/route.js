/**
 * /api/revenue/outcomes — v3.1.2 Feedback Intelligence Layer
 * POST  — Record a new revenue outcome (deal lifecycle)
 * PATCH — Update outcome when client responds (WON / LOST / REVISED)
 * GET   — Fetch outcome list or aggregated stats for the current user
 *
 * ❌ AI PROHIBITED: This route only stores deterministic user actions.
 */
import { NextResponse } from "next/server";
import { getRequestUser, createRequestSupabaseClient } from "../../../lib/supabase";
import { injectLearningSignal } from "../../../../core/ai/AI_DECISION_INJECTION_MAP";
import { updateFromOutcome } from "../../../../core/ai/AI_DECISION_CORE";
import { assertCoreDecisionSource } from "../../../../core/ai/AI_DECISION_GUARD";

// ─────────────────────────────────────────────────────────────────────────────
// POST — Record a new outcome
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const context = await getRequestUser(request);
    if (!context?.user || context.mode !== "supabase") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = context.user;
    const supabase = context.supabase || createRequestSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      proposal_id,
      strategy_used,
      price_offered,
      price_accepted,
      outcome,
      client_type,
      service_type,
      urgency,
      time_to_decision_hours,
      revision_count,
      // v3.2: learning_snapshot — advisory metadata only, not persisted to DB
      learning_snapshot,
    } = body;

    if (!proposal_id || !strategy_used || !price_offered || !client_type || !service_type) {
      return NextResponse.json(
        { error: "Missing required fields: proposal_id, strategy_used, price_offered, client_type, service_type" },
        { status: 400 }
      );
    }

    // Verify quote/proposal existence and user ownership
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("user_id")
      .eq("id", proposal_id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: "Proposal or Quote not found." },
        { status: 404 }
      );
    }

    if (quote.user_id !== user.id) {
      return NextResponse.json(
        { error: "Access Denied: You do not own this quote." },
        { status: 403 }
      );
    }

    const VALID_STRATEGIES = ["MAX_REVENUE", "BALANCED", "FAST_DEAL"];
    const VALID_OUTCOMES = ["WON", "LOST", "PENDING", "REVISED"];

    if (!VALID_STRATEGIES.includes(strategy_used)) {
      return NextResponse.json(
        { error: `Invalid strategy_used. Must be one of: ${VALID_STRATEGIES.join(", ")}` },
        { status: 400 }
      );
    }
    if (outcome && !VALID_OUTCOMES.includes(outcome)) {
      return NextResponse.json(
        { error: `Invalid outcome. Must be one of: ${VALID_OUTCOMES.join(", ")}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("revenue_outcomes")
      .insert({
        user_id: user.id,
        proposal_id,
        strategy_used,
        price_offered,
        price_accepted: price_accepted ?? null,
        outcome: outcome ?? "PENDING",
        client_type,
        service_type,
        urgency: urgency ?? "medium",
        time_to_decision_hours: time_to_decision_hours ?? null,
        revision_count: revision_count ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error("[revenue/outcomes POST] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }



    // v3.2 Closed Loop: compute full learning_snapshot if provided
    let enrichedSnapshot = null;
    if (learning_snapshot && typeof learning_snapshot === "object") {
      const expectedStrategy = learning_snapshot.expected_strategy ?? strategy_used;
      const actualStrategy = strategy_used;
      const expectedRevenue = typeof learning_snapshot.expected_revenue === "number"
        ? learning_snapshot.expected_revenue
        : price_offered;
      const actualRevenue = typeof price_accepted === "number"
        ? price_accepted
        : price_offered;
      const deltaRevenue = parseFloat((actualRevenue - expectedRevenue).toFixed(2));

      enrichedSnapshot = {
        expected_strategy: expectedStrategy,
        actual_strategy: actualStrategy,
        expected_revenue: expectedRevenue,
        actual_revenue: actualRevenue,
        delta_revenue: deltaRevenue,
        // Derived signal: did the actual strategy outperform the expected?
        strategy_aligned: expectedStrategy === actualStrategy,
        revenue_outcome: deltaRevenue > 0 ? "UPLIFT" : deltaRevenue < 0 ? "DECLINE" : "NEUTRAL",
      };
    }
    // AI Injection Layer (Feedback Loop) - Observability only
    injectLearningSignal({
      stage: "FEEDBACK",
      userProfile: user,
      clientContext: client_type,
      historicalOutcomes: [],
      paymentStatus: outcome || "PENDING"
    });
    assertCoreDecisionSource("AI_DECISION_CORE");

    // Authoritative Decision Core learning update
    try {
      assertCoreDecisionSource("AI_DECISION_CORE");
      updateFromOutcome(user.id, {
        type: 'FEEDBACK_OUTCOME',
        outcome: outcome || 'PENDING',
        priceOffered: price_offered,
        priceAccepted: price_accepted
      }, 'AI_DECISION_CORE');
    } catch (updateErr) {
      console.error("Failed to update from outcome in POST:", updateErr);
    }

    const res = {
      success: true,
      outcome: data,
      ...(enrichedSnapshot && { learning_snapshot: enrichedSnapshot }),
      ai_feedback: {
        mode: "observability_only",
        source: "AI_DECISION_CORE"
      }
    };

    return NextResponse.json({
      ...res,
      data: res,
      ai: {
        mode: "core_driven",
        source: "AI_DECISION_CORE"
      }
    });
  } catch (err) {
    console.error("[revenue/outcomes POST] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — Update an existing outcome record
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(request) {
  try {
    const context = await getRequestUser(request);
    if (!context?.user || context.mode !== "supabase") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = context.user;
    const supabase = context.supabase || createRequestSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const { proposal_id, outcome, price_accepted, time_to_decision_hours, revision_count } = body;

    if (!proposal_id || !outcome) {
      return NextResponse.json(
        { error: "Missing required fields: proposal_id, outcome" },
        { status: 400 }
      );
    }

    const patch = {
      outcome,
      updated_at: new Date().toISOString(),
      ...(price_accepted !== undefined && { price_accepted }),
      ...(time_to_decision_hours !== undefined && { time_to_decision_hours }),
      ...(revision_count !== undefined && { revision_count }),
    };

    const { data, error } = await supabase
      .from("revenue_outcomes")
      .update(patch)
      .eq("proposal_id", proposal_id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("[revenue/outcomes PATCH] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Authoritative Decision Core learning update
    try {
      updateFromOutcome(user.id, {
        type: 'FEEDBACK_OUTCOME',
        outcome: outcome,
        priceOffered: data.price_offered,
        priceAccepted: data.price_accepted
      }, 'AI_DECISION_CORE');
    } catch (updateErr) {
      console.error("Failed to update from outcome in PATCH:", updateErr);
    }



    const res = { success: true, outcome: data };
    return NextResponse.json({
      ...res,
      data: res,
      ai: {
        mode: "core_driven",
        source: "AI_DECISION_CORE"
      }
    });
  } catch (err) {
    console.error("[revenue/outcomes PATCH] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — Fetch outcomes list or aggregated stats
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const context = await getRequestUser(request);
    if (!context?.user || context.mode !== "supabase") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = context.user;
    const supabase = context.supabase || createRequestSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get("stats") === "true";

    if (statsOnly) {
      const { data: outcomes, error } = await supabase
        .from("revenue_outcomes")
        .select("*")
        .eq("user_id", user.id)
        .neq("outcome", "PENDING");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const resolved = outcomes ?? [];
      const won = resolved.filter((r) => r.outcome === "WON");
      const winRate = resolved.length > 0 ? won.length / resolved.length : 0;
      const avgOffered =
        resolved.length > 0
          ? resolved.reduce((s, r) => s + Number(r.price_offered), 0) / resolved.length
          : 0;
      const avgAccepted =
        won.length > 0
          ? won.reduce((s, r) => s + Number(r.price_accepted ?? 0), 0) / won.length
          : 0;

      return NextResponse.json({
        totalRecords: resolved.length,
        winRate: parseFloat(winRate.toFixed(3)),
        avgOfferedPrice: parseFloat(avgOffered.toFixed(2)),
        avgAcceptedPrice: parseFloat(avgAccepted.toFixed(2)),
        learningConfidence:
          resolved.length >= 50 ? "calibrated" : resolved.length >= 10 ? "learning" : "cold",
      });
    }

    const { data, error } = await supabase
      .from("revenue_outcomes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ outcomes: data });
  } catch (err) {
    console.error("[revenue/outcomes GET] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
