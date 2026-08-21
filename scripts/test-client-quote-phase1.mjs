import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();

function loadModule(file, mocks) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const exports = {};
  const loadedModule = { exports };
  const fn = new Function("exports", "require", "module", "__filename", "__dirname", code);
  fn(exports, (id) => {
    for (const [needle, value] of Object.entries(mocks)) {
      if (id.includes(needle)) return value;
    }
    return {};
  }, loadedModule, path.join(root, file), path.dirname(path.join(root, file)));
  return loadedModule.exports;
}

function makeDb() {
  const state = {
    profiles: [{ id: "user-1", plan: "free" }],
    clients: [
      { id: "client-a", user_id: "user-1", name: "Client A", email: "a@example.com", address: "A Street" },
      { id: "client-b", user_id: "user-1", name: "Client B", email: "b@example.com", address: "B Street" },
      { id: "client-foreign", user_id: "user-2", name: "Foreign", email: "foreign@example.com", address: "F Street" }
    ],
    quotes: []
  };

  function matches(row, filters) {
    return filters.every(([column, value]) => row?.[column] === value);
  }

  function from(table) {
    const query = {
      filters: [],
      updatePayload: null,
      select() { return this; },
      eq(column, value) { this.filters.push([column, value]); return this; },
      order() { return this; },
      async maybeSingle() {
        const row = state[table].find((item) => matches(item, this.filters)) || null;
        return { data: row, error: null };
      },
      async single() {
        const rows = state[table].filter((item) => matches(item, this.filters));
        if (this.updatePayload) rows.forEach((item) => Object.assign(item, this.updatePayload));
        return { data: rows[0] || null, error: rows[0] ? null : { message: "not found" } };
      },
      update(payload) {
        this.updatePayload = payload;
        return this;
      },
      async then(resolve) {
        const rows = state[table].filter((item) => matches(item, this.filters));
        if (this.updatePayload) rows.forEach((item) => Object.assign(item, this.updatePayload));
        return resolve({ data: table === "quotes" && !this.updatePayload ? rows : (rows[0] || null), error: rows[0] || (table === "quotes" && !this.updatePayload) ? null : { message: "not found" } });
      }
    };
    return query;
  }

  return {
    state,
    from,
    rpc: async () => ({ data: null, error: null })
  };
}

function makeRequest(body) {
  return { json: async () => body, headers: new Headers({ "content-type": "application/json" }) };
}

function loadQuoteRoute(db) {
  const NextResponse = { json: (body, init = {}) => ({ status: init.status || 200, body, json: async () => body }) };
  const createQuoteWithAtomicQuota = async (_client, userId, plan, payload) => {
    const row = { ...payload, id: payload.id || `quote-${db.state.quotes.length + 1}`, user_id: userId };
    db.state.quotes.push(row);
    return { data: row, quota: { documentsAllowed: true, documentsLimit: plan === "starter" ? 30 : 5 } };
  };
  return loadModule("src/app/api/quotes/route.js", {
    "next/server": { NextResponse },
    "lib/supabase": {
      createServiceSupabaseClient: () => db,
      getRequestUser: async () => ({ mode: "supabase", user: { id: "user-1", email: "owner@example.com" }, supabase: db }),
      writeAuditLog: async () => {},
      recordServerGrowthEvent: async () => {},
      trackProfileMetric: async () => {},
      getDocumentQuota: async () => ({ documentsAllowed: true }),
      createSupabasePortalToken: async () => "",
      createQuoteWithAtomicQuota
    },
    "lib/rate-limit": { rateLimitAuthenticated: async () => ({ success: true }) },
    "lib/security": { authRequiredResponse: () => null, getIp: () => "127.0.0.1", requestContextResponse: () => null },
    "lib/validation": { validateQuotePayload: (body) => body, validateObject: (body) => body, enumValue: (value) => value, validationResponse: () => null },
    "product-analytics-server": { recordProductAnalyticsEvent: async () => {} },
    "lib/entitlements": { getUserEntitlements: () => ({ client_portal: false }) }
  });
}

function loadQuotaHelpers() {
  return loadModule("src/app/lib/supabase.js", {
    "security": { defaultPortalExpiry: () => new Date().toISOString(), generatePortalToken: () => "token", hashPortalToken: (value) => value },
    "@supabase/supabase-js": { createClient: () => ({}) }
  });
}

const baseBody = {
  quote_number: "Q-1",
  client_name: "Manual Client",
  client_email: "manual@example.com",
  client_address: "Manual Street",
  items: [{ description: "Service", quantity: 1, unitPrice: 100 }],
  discount_rate: 0,
  tax_rate: 0,
  currency: "USD",
  notes: "initial",
  status: "draft"
};

const db = makeDb();
const route = loadQuoteRoute(db);

const created = await route.POST(makeRequest({ ...baseBody, client_id: "client-a" }));
assert.equal(created.status, 201, "new Quote with owned Client succeeds");
assert.equal(created.body.client_id, "client-a");
assert.deepEqual(
  { name: created.body.client_name, email: created.body.client_email, address: created.body.client_address },
  { name: "Client A", email: "a@example.com", address: "A Street" },
  "new Quote initializes its snapshot from the owned Client"
);

const foreign = await route.POST(makeRequest({ ...baseBody, quote_number: "Q-foreign", client_id: "client-foreign" }));
assert.equal(foreign.status, 403);
assert.equal(foreign.body.code, "CLIENT_NOT_OWNED");

const legacy = await route.POST(makeRequest({ ...baseBody, quote_number: "Q-legacy", client_id: null }));
assert.equal(legacy.status, 201, "new Quote without client_id remains supported");
assert.equal(legacy.body.client_id, null);

const readable = await route.GET(makeRequest({}));
assert.equal(readable.status, 200, "legacy Quote remains readable");
assert.ok(readable.body.data.some((quote) => quote.id === legacy.body.id));

db.state.clients[0].name = "Client A Renamed";
db.state.clients[0].email = "renamed@example.com";
db.state.clients[0].address = "Renamed Street";
const editedUnrelated = await route.POST(makeRequest({ ...baseBody, id: created.body.id, client_id: "client-a", notes: "unrelated edit" }));
assert.equal(editedUnrelated.status, 201);
assert.deepEqual(
  { name: editedUnrelated.body.client_name, email: editedUnrelated.body.client_email, address: editedUnrelated.body.client_address },
  { name: "Client A", email: "a@example.com", address: "A Street" },
  "editing an existing Quote does not refresh its historical snapshot"
);

const switched = await route.POST(makeRequest({ ...baseBody, id: created.body.id, client_id: "client-b", notes: "switch relation" }));
assert.equal(switched.status, 201);
assert.equal(switched.body.client_id, "client-b");
assert.deepEqual(
  { name: switched.body.client_name, email: switched.body.client_email, address: switched.body.client_address },
  { name: "Client B", email: "b@example.com", address: "B Street" },
  "switching to another owned Client initializes the new snapshot"
);

const legacyEdited = await route.POST(makeRequest({ ...baseBody, id: legacy.body.id, client_id: null, notes: "legacy edit" }));
assert.equal(legacyEdited.status, 201, "legacy Quote remains editable");

const helpers = loadQuotaHelpers();
const rpcCalls = [];
let fromCalls = 0;
const rpcClient = {
  rpc: async (name) => {
    rpcCalls.push(name);
    return { data: { id: name }, error: null };
  },
  from: () => { fromCalls += 1; throw new Error("direct insert fallback"); }
};

for (const [plan, expected] of [["free", 5], ["starter", 30]]) {
  const result = await helpers.createQuoteWithAtomicQuota(rpcClient, "user-1", plan, {});
  assert.equal(result.quota.documentsLimit, expected, `${plan} Quote helper metadata`);
}
for (const plan of ["pro", "agency", "studio"]) {
  const result = await helpers.createQuoteWithAtomicQuota(rpcClient, "user-1", plan, {});
  assert.equal(result.quota.documentsLimit, Infinity, `${plan} Quote helper metadata is unlimited`);
}
for (const [plan, expected] of [["free", 5], ["starter", 30]]) {
  const result = await helpers.createInvoiceWithAtomicQuota(rpcClient, "user-1", plan, {});
  assert.equal(result.quota.documentsLimit, expected, `${plan} Invoice helper metadata`);
}
for (const plan of ["pro", "agency", "studio"]) {
  const result = await helpers.createInvoiceWithAtomicQuota(rpcClient, "user-1", plan, {});
  assert.equal(result.quota.documentsLimit, Infinity, `${plan} Invoice helper metadata is unlimited`);
}
assert.equal(fromCalls, 0, "atomic helpers never use direct table insert fallback");
assert.ok(rpcCalls.includes("check_and_create_quote"));
assert.ok(rpcCalls.includes("check_and_create_invoice"));

console.log("Client -> Quote Phase 1 executable behavior tests passed.");
