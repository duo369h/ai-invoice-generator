import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

console.log("==================================================");
console.log("RUNNING INVOICE ROUTE RUNTIME INTEGRATION TESTS (FINAL GATE 04B)");
console.log("==================================================");

let passCount = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// Function to transpile and load src/app/api/invoices/route.js with injected dependency mocks
function loadInvoiceRoute(customMocks = {}) {
  const routeSource = fs.readFileSync(path.join(root, "src/app/api/invoices/route.js"), "utf8");
  const jsCode = ts.transpileModule(routeSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;

  const mockExports = {};
  const mockModule = { exports: mockExports };

  const mockNextResponse = {
    json: (body, init = {}) => ({
      status: init.status || 200,
      json: async () => body,
      body
    })
  };

  const defaultSupabaseMock = {
    createServiceSupabaseClient: customMocks.createServiceSupabaseClient || (() => ({
      from: () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({ data: { id: "inv_123", status: "sent" }, error: null })
              })
            })
          })
        })
      }),
      rpc: async (fn, params) => ({ data: { id: "loop_1" }, error: null })
    })),
    ensureProfile: async () => ({ id: "usr_free_123", plan: "free" }),
    getRequestUser: async () => ({
      mode: "supabase",
      user: { id: "usr_free_123", email: "user@example.com" },
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({ count: 0 })
            })
          })
        })
      }
    }),
    getSupabaseQuota: async () => ({ allowed: true }),
    getDocumentQuota: async () => ({ documentsAllowed: true }),
    createInvoiceWithAtomicQuota: customMocks.createInvoiceWithAtomicQuota || (async (client, userId, plan, payload) => ({
      data: { id: "inv_created_01", ...payload },
      quota: { documentsAllowed: true }
    })),
    mapSupabaseInvoice: (row) => row,
    incrementSupabaseInvoiceUsage: async () => {},
    writeAuditLog: async () => {},
    recordServerGrowthEvent: async () => {},
    trackProfileMetric: async () => {}
  };

  const mockRequire = (id) => {
    if (id.includes("next/server")) return { NextResponse: mockNextResponse };
    if (id.includes("lib/supabase")) return { ...defaultSupabaseMock, ...customMocks };
    if (id.includes("lib/rate-limit")) return { rateLimitAuthenticated: async () => ({ success: true }) };
    if (id.includes("lib/security")) return {
      authRequiredResponse: () => null,
      getIp: () => "127.0.0.1",
      requestContextResponse: () => null
    };
    if (id.includes("lib/validation")) return {
      validateInvoicePayload: (p) => p,
      validateObject: (p) => p,
      validationResponse: () => null
    };
    if (id.includes("lib/entitlements")) return {
      getUserEntitlements: () => ({ invoice: true, client_portal: false, client_approval: false })
    };
    if (id.includes("AI_DECISION_INJECTION_MAP") || id.includes("AI_DECISION_CORE") || id.includes("AI_DECISION_GUARD") || id.includes("decisionTelemetry") || id.includes("aiDecisionCore")) {
      return {
        injectInvoiceEnhancement: () => {},
        getDecision: () => ({}),
        assertCoreDecisionSource: () => {},
        recordDecisionTelemetry: () => {}
      };
    }
    if (id.includes("lib/config")) return { getSiteUrl: () => "http://localhost:3000" };
    if (id.includes("product-analytics-server")) return { recordProductAnalyticsEvent: async () => {} };
    if (id.includes("invoicePaymentState")) return {
      hasRecordedInvoicePayment: (invoice) => Number(invoice?.amount_paid_cents || 0) > 0,
    };
    return {};
  };

  const fn = new Function("exports", "require", "module", "__filename", "__dirname", jsCode);
  fn(mockExports, mockRequire, mockModule, path.join(root, "src/app/api/invoices/route.js"), path.join(root, "src/app/api/invoices"));
  return mockModule.exports;
}

function mockRequest(body) {
  return {
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => body
  };
}

async function run() {
  console.log("\n1. Testing POST Runtime Path & createServiceSupabaseClient Resolution...");
  await test("MOCKED_ROUTE_INTEGRATION_TEST: POST resolves createServiceSupabaseClient and creates invoice (HTTP 201)", async () => {
    let serviceClientCreated = false;
    let createInvoiceCalled = false;
    let rpcTrackingCalled = false;

    const mockService = {
      from: () => ({}),
      rpc: async (fnName, params) => {
        if (fnName === "claim_first_revenue_invoice") {
          rpcTrackingCalled = true;
          assert.strictEqual(params.p_user_id, "usr_free_123");
          assert.strictEqual(params.p_quote_id, "quote_123");
          assert.strictEqual(params.p_invoice_id, "inv_created_01");
          return { data: { id: "loop_1" }, error: null };
        }
        return { data: null, error: null };
      }
    };

    const route = loadInvoiceRoute({
      createServiceSupabaseClient: () => {
        serviceClientCreated = true;
        return mockService;
      },
      createInvoiceWithAtomicQuota: async (client, userId, plan, payload) => {
        createInvoiceCalled = true;
        assert.strictEqual(userId, "usr_free_123");
        assert.strictEqual(plan, "free");
        return { data: { id: "inv_created_01", ...payload } };
      }
    });

    const req = mockRequest({
      client_name: "Acme Corp",
      quote_id: "quote_123",
      currency: "USD",
      subtotal: 50000,
      discount_rate: 0,
      discount_amount: 0,
      tax_rate: 0,
      tax_amount: 0,
      items: [{ description: "Photography", quantity: 1, unitPrice: 500 }],
      total: 50000
    });

    const res = await route.POST(req);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(serviceClientCreated, true, "createServiceSupabaseClient must be resolved and called");
    assert.strictEqual(createInvoiceCalled, true, "createInvoiceWithAtomicQuota must be called");
    assert.strictEqual(rpcTrackingCalled, true, "claim_first_revenue_invoice tracking RPC must be called");
  });

  console.log("\n2. Testing PATCH Runtime Path with ID & User ID Constraints...");
  await test("MOCKED_ROUTE_INTEGRATION_TEST: PATCH resolves service writer and updates status with id + user_id constraints", async () => {
    let serviceClientCreated = false;
    let updateFilterId = null;
    let updateFilterUserId = null;

    const mockService = {
      from: (table) => {
        assert.strictEqual(table, "invoices");
        const query = {
          updatePayload: null,
          select: () => query,
          update: (payload) => {
            assert.strictEqual(payload.status, "sent");
            query.updatePayload = payload;
            return query;
          },
          eq: (column, value) => {
            if (column === "id") updateFilterId = value;
            if (column === "user_id") updateFilterUserId = value;
            return query;
          },
          maybeSingle: async () => ({
            data: {
              id: "inv_target_01",
              status: query.updatePayload?.status || "pending",
              payment_status: "unpaid",
              amount_paid_cents: 0,
              amount_due_cents: 10000,
              total: 10000,
            },
            error: null,
          }),
        };
        return query;
      }
    };

    const route = loadInvoiceRoute({
      createServiceSupabaseClient: () => {
        serviceClientCreated = true;
        return mockService;
      }
    });

    const req = mockRequest({ id: "inv_target_01", status: "sent" });
    const res = await route.PATCH(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(serviceClientCreated, true, "createServiceSupabaseClient must be called");
    assert.strictEqual(updateFilterId, "inv_target_01", "Must filter by invoice id");
    assert.strictEqual(updateFilterUserId, "usr_free_123", "Must filter by authenticated user_id");
  });

  await test("MOCKED_ROUTE_INTEGRATION_TEST: PATCH rejects payment truth fields before any writer is used", async () => {
    let writerCalled = false;
    const route = loadInvoiceRoute({
      createServiceSupabaseClient: () => {
        writerCalled = true;
        throw new Error('payment truth fields must not reach the writer');
      }
    });
    const res = await route.PATCH(mockRequest({ id: "inv_target_01", payment_status: "paid" }));
    assert.strictEqual(res.status, 400);
    assert.strictEqual(writerCalled, false);
    assert.strictEqual(res.body.error, 'Payment records determine payment state');
  });

  await test("MOCKED_ROUTE_INTEGRATION_TEST: PATCH rejects status=paid before any writer is used", async () => {
    let writerCalled = false;
    const route = loadInvoiceRoute({
      createServiceSupabaseClient: () => {
        writerCalled = true;
        throw new Error('paid status must not reach the writer');
      }
    });
    const res = await route.PATCH(mockRequest({ id: "inv_target_01", status: "paid" }));
    assert.strictEqual(res.status, 400);
    assert.strictEqual(writerCalled, false);
    assert.strictEqual(res.body.error, 'Payment records determine paid state');
  });

  console.log("\n3. Testing Tracking Failure Non-Blocking in POST Handler...");
  await test("MOCKED_ROUTE_INTEGRATION_TEST: POST succeeds with HTTP 201 when claim_first_revenue_invoice returns an RPC error", async () => {
    const mockService = {
      from: () => ({}),
      rpc: async (fnName) => {
        if (fnName === "claim_first_revenue_invoice") {
          return { data: null, error: { message: "first_revenue_invoice_already_claimed" } };
        }
        return { data: null, error: null };
      }
    };

    const route = loadInvoiceRoute({
      createServiceSupabaseClient: () => mockService,
      createInvoiceWithAtomicQuota: async (client, userId, plan, payload) => ({
        data: { id: "inv_created_02", ...payload }
      })
    });

    const req = mockRequest({
      client_name: "Acme Corp",
      quote_id: "quote_123",
      currency: "USD",
      subtotal: 50000,
      discount_rate: 0,
      discount_amount: 0,
      tax_rate: 0,
      tax_amount: 0,
      items: [{ description: "Photography", quantity: 1, unitPrice: 500 }],
      total: 50000
    });

    const res = await route.POST(req);
    assert.strictEqual(res.status, 201, "Tracking error must not convert successful invoice creation into failure");
    assert.strictEqual(res.body.id, "inv_created_02");
  });

  console.log("==================================================");
  console.log(`INVOICE ROUTE INTEGRATION TEST SUMMARY: ${passCount} PASSED, 0 FAILED`);
  console.log("==================================================");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
