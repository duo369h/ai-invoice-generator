import { NextResponse } from "next/server";
import {
  getRequestUser,
  getDocumentQuota,
  createQuoteWithAtomicQuota
} from "../../lib/supabase";
import {
  createServiceSupabaseClient,
  createSupabasePortalToken,
  writeAuditLog,
  recordServerGrowthEvent,
  trackProfileMetric,
} from "../../lib/supabase-service";
import { rateLimitAuthenticated } from "../../lib/rate-limit";
import { authRequiredResponse, getIp, requestContextResponse } from "../../lib/security";
import { enumValue, validateObject, validateQuotePayload, validationResponse } from "../../lib/validation";
import { recordProductAnalyticsEvent } from "../../lib/product-analytics-server";
import { getUserEntitlements } from "../../../../lib/entitlements";

export async function GET(request) {
  try {
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, "quotes");
    if (contextFailure) return contextFailure;
    const limitResult = await rateLimitAuthenticated("invoiceApi", context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || "Too many requests" }, { status: limitResult.status || 429 });
    }
    
    if (context.mode === "supabase") {
      const { data, error } = await context.supabase
        .from("quotes")
        .select("*")
        .eq("user_id", context.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return NextResponse.json({ data: data || [] });
    }

    return authRequiredResponse("quotes");

  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const ip = getIp(request);
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, "quotes");
    if (contextFailure) return contextFailure;

    const serviceSupabase = createServiceSupabaseClient();
    if (!serviceSupabase) {
      return NextResponse.json({ error: "Database service is unavailable" }, { status: 503 });
    }

    const { data: profile, error: profileError } = await serviceSupabase
      .from("profiles")
      .select("plan")
      .eq("id", context.user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    const plan = profile?.plan || "free";

    const limitResult = await rateLimitAuthenticated("invoiceApi", context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || "Too many requests" }, { status: limitResult.status || 429 });
    }
    const body = validateQuotePayload(await request.json());

    const {
      id,
      quote_number,
      client_name,
      client_email,
      client_address,
      client_id,
      items,
      discount_rate,
      tax_rate,
      currency,
      notes,
      status
    } = body;

    const calculatedSubtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 1) * Math.round(Number(item.unitPrice || item.unit_price || 0) * 100)), 0);
    const calculatedDiscountAmount = Math.round(calculatedSubtotal * (Number(discount_rate) / 100));
    const taxableAmount = Math.max(0, calculatedSubtotal - calculatedDiscountAmount);
    const calculatedTaxAmount = Math.round(taxableAmount * (Number(tax_rate) / 100));
    const calculatedTotal = taxableAmount + calculatedTaxAmount;

    if (context.mode === "supabase") {
      let existingQuote = null;
      if (id) {
        const { data: existingQuoteData, error: existingQuoteError } = await serviceSupabase
          .from("quotes")
          .select("client_id, client_name, client_email, client_address")
          .eq("id", id)
          .eq("user_id", context.user.id)
          .maybeSingle();
        if (existingQuoteError) throw existingQuoteError;
        if (!existingQuoteData) {
          return NextResponse.json({ error: "Quote not found" }, { status: 404 });
        }
        existingQuote = existingQuoteData;
      }

      const requestedClientId = client_id || null;
      const effectiveClientId = id && existingQuote?.client_id && !requestedClientId
        ? existingQuote.client_id
        : requestedClientId;
      const clientRelationChanged = !id || !existingQuote || effectiveClientId !== (existingQuote.client_id || null);
      let clientSnapshot = null;
      if (effectiveClientId) {
        const { data: ownedClient, error: clientError } = await serviceSupabase
          .from("clients")
          .select("id, name, email, address")
          .eq("id", effectiveClientId)
          .eq("user_id", context.user.id)
          .maybeSingle();
        if (clientError) throw clientError;
        if (!ownedClient) {
          return NextResponse.json({ error: "Client does not belong to the authenticated user.", code: "CLIENT_NOT_OWNED" }, { status: 403 });
        }
        if (clientRelationChanged) {
          clientSnapshot = {
            client_name: ownedClient.name || "",
            client_email: ownedClient.email || "",
            client_address: ownedClient.address || ""
          };
        }
      }
      // Non-authoritative UX quota precheck for telemetry
      if (!id) {
        await getDocumentQuota(serviceSupabase, context.user.id, plan).catch(() => null);
      }

      const profileName =
        context.user.user_metadata?.name ||
        context.user.user_metadata?.full_name ||
        context.user.email?.split("@")[0] ||
        "User";
      const payload = {
        id: id || undefined,
        user_id: context.user.id,
        client_id: effectiveClientId,
        _profile_email: context.user.email || "",
        _profile_name: profileName,
        quote_number: quote_number || `QT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        client_name: id && existingQuote && !clientRelationChanged ? existingQuote.client_name : (clientSnapshot?.client_name ?? client_name),
        client_email: id && existingQuote && !clientRelationChanged ? existingQuote.client_email : (clientSnapshot?.client_email ?? client_email),
        client_address: id && existingQuote && !clientRelationChanged ? existingQuote.client_address : (clientSnapshot?.client_address ?? client_address),
        items: items.map(item => ({
          description: item.description,
          quantity: Number(item.quantity) || 1,
          unit_price: Math.round(Number(item.unitPrice || 0) * 100),
          amount: (Number(item.quantity) || 1) * Math.round(Number(item.unitPrice || 0) * 100)
        })),
        subtotal: calculatedSubtotal,
        discount_rate: Number(discount_rate),
        discount_amount: calculatedDiscountAmount,
        tax_rate: Number(tax_rate),
        tax_amount: calculatedTaxAmount,
        total: calculatedTotal,
        currency,
        notes,
        status,
        updated_at: new Date().toISOString()
      };

      let data;
      if (id) {
        const updatePayload = { ...payload };
        delete updatePayload.id;
        delete updatePayload.user_id;
        delete updatePayload._profile_email;
        delete updatePayload._profile_name;
        const { data: updateData, error: updateError } = await serviceSupabase
          .from("quotes")
          .update(updatePayload)
          .eq("id", id)
          .eq("user_id", context.user.id)
          .select("*")
          .single();
        if (updateError) throw updateError;
        if (!updateData) {
          return NextResponse.json({ error: "Quote not found" }, { status: 404 });
        }
        data = updateData;
      } else {
        try {
          const creation = await createQuoteWithAtomicQuota(serviceSupabase, context.user.id, plan, payload);
          data = creation.data;

          // Non-authoritative, idempotent first-revenue tracking record (never blocks quote creation)
          if (plan === 'free' && data?.id) {
            try {
              const { error: trackingError } = await serviceSupabase.rpc('claim_first_revenue_quote', {
                p_user_id: context.user.id,
                p_quote_id: data.id
              });
              if (trackingError) {
                console.warn('[FirstRevenue] Non-blocking quote tracking notice:', trackingError.message || trackingError);
              }
            } catch (trackErr) {
              console.warn('[FirstRevenue] Non-blocking quote tracking exception:', trackErr.message || trackErr);
            }
          }
        } catch (atomicErr) {
          if (atomicErr.code === "QUOTA_EXCEEDED" || atomicErr.status === 403) {
            return NextResponse.json({
              error: atomicErr.message || "Document limit reached for current cycle.",
              code: "QUOTA_EXCEEDED"
            }, { status: 403 });
          }
          return NextResponse.json({
            error: atomicErr.message || "Database atomic document creation failed.",
            code: "DATABASE_ERROR"
          }, { status: 500 });
        }
      }

      let portalToken = "";
      const entitlements = getUserEntitlements(plan);
      if (!id && entitlements.client_portal) {
        try {
          portalToken = await createSupabasePortalToken(context.supabase, {
            ownerId: context.user.id,
            resourceType: "quote",
            resourceId: data.id,
          });
        } catch (tokenErr) {
          console.error("Failed to create quote portal token:", tokenErr);
        }
      }

      await writeAuditLog(context.supabase, {
        userId: context.user.id,
        action: id ? "quote_updated" : "quote_created",
        resourceType: "quote",
        resourceId: data.id,
        ip,
      });

      if (!id) {
        try {
          await recordProductAnalyticsEvent({
            eventName: "Proposal Created",
            userId: context.user.id,
            source: "quotes_api",
            properties: {
              identity: context.user.id,
              user_id: context.user.id,
              plan,
              country: "",
              quote_id: data.id,
              quote_number: data.quote_number,
              total: data.total,
              currency: data.currency,
              source: "quotes_api",
              timestamp: new Date().toISOString(),
            },
          });
        } catch (analyticsError) {
          console.error("Failed to record proposal creation:", analyticsError);
        }
      }

      return NextResponse.json({ ...data, portal_token: portalToken }, { status: 201 });
    }

    return authRequiredResponse("quotes");

  } catch (error) {
    if (error.code === "CLIENT_NOT_OWNED") {
      return NextResponse.json({ error: error.message || "Client does not belong to the authenticated user.", code: "CLIENT_NOT_OWNED" }, { status: 403 });
    }
    if (error.code === "QUOTA_EXCEEDED" || error.status === 403) {
      return NextResponse.json({
        error: error.message || "Document limit reached for current cycle.",
        code: "QUOTA_EXCEEDED"
      }, { status: 403 });
    }
    if (error.code === "DATABASE_ERROR" || error.status === 500) {
      return NextResponse.json({
        error: error.message || "Database error during quote creation.",
        code: "DATABASE_ERROR"
      }, { status: 500 });
    }
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error("Error creating quote:", error);
    return NextResponse.json({ error: "Failed to create quote", code: "DATABASE_ERROR" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const ip = getIp(request);
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, "quotes");
    if (contextFailure) return contextFailure;
    const limitResult = await rateLimitAuthenticated("invoiceApi", context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || "Too many requests" }, { status: limitResult.status || 429 });
    }
    const body = validateObject(await request.json());
    const id = body.id;
    const status = enumValue(body.status, "status", ["draft", "sent", "approved", "declined", "converted"]);

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields: id, status" }, { status: 400 });
    }

    if (context.mode === "supabase") {
      const serviceSupabase = createServiceSupabaseClient();
      if (!serviceSupabase) {
        return NextResponse.json({ error: "Quote service is unavailable" }, { status: 503 });
      }

      const { data, error } = await serviceSupabase
        .from("quotes")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", context.user.id)
        .select("*")
        .single();

      if (error) throw error;
      await writeAuditLog(context.supabase, {
        userId: context.user.id,
        action: "quote_status_changed",
        resourceType: "quote",
        resourceId: data.id,
        ip,
      });

      if (status === "sent") {
        await trackProfileMetric(context.supabase, context.user.id, "quote_sent_timestamp");
        await recordServerGrowthEvent(context.supabase, {
          eventName: "quote_sent",
          userId: context.user.id,
          source: "user",
          properties: {
            quote_id: data.id,
            quote_number: data.quote_number,
            client_email: data.client_email
          }
        });
        try {
          await recordProductAnalyticsEvent({
            eventName: "Proposal Sent",
            userId: context.user.id,
            source: "quotes_api",
            properties: {
              identity: context.user.id,
              user_id: context.user.id,
              plan: "free",
              country: "",
              quote_id: data.id,
              quote_number: data.quote_number,
              source: "quotes_api",
              timestamp: new Date().toISOString(),
            },
          });
        } catch (analyticsError) {
          console.error("Failed to record proposal sent:", analyticsError);
        }
      }

      // Trigger Quote Approved email notification
      if (status === "approved") {
        try {
          const { data: profile } = await context.supabase
            .from("profiles")
            .select("name, email")
            .eq("id", context.user.id)
            .maybeSingle();

          if (profile?.email) {
            const { sendQuoteApprovedEmail } = await import("../../lib/email");
            await sendQuoteApprovedEmail(profile.email, data, profile.name || "Photographer");
          }
        } catch (mailErr) {
          console.error("Failed to trigger Quote Approved email:", mailErr);
        }
      }

      return NextResponse.json(data);
    }

    return authRequiredResponse("quotes");

  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error("Error updating quote status:", error);
    return NextResponse.json({ error: "Failed to update quote status" }, { status: 500 });
  }
}
