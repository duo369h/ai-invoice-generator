import { pluginRegistry } from "./plugin-system.ts";
import type { CorviozPlugin, PluginOutput } from "./plugin-system.ts";

export type SkillName =
  | "invoice-generator"
  | "quote-generator"
  | "proposal-generator"
  | "client-management"
  | "payment-flow";

export type SkillExecutionStatus = "success" | "degraded" | "needs-human-review" | "failed";

export interface SkillInput {
  rawInput: string;
  userId?: string;
  payload?: Record<string, unknown>;
  memoryContext?: MemoryContext;
  businessContext?: CorviozBusinessContext;
  supabaseClient?: unknown;
  paymentProvider?: "paddle" | "stripe";
}

export interface MemoryContext {
  clientName?: string;
  clientEmail?: string;
  currency?: string;
  lastInvoiceId?: string;
  lastQuoteId?: string;
  recentClients?: Array<{
    id?: string;
    name: string;
    email?: string;
  }>;
  preferences?: {
    paymentTerms?: string;
    defaultTaxRate?: number;
    defaultCurrency?: string;
  };
  history?: Array<{
    skill: string;
    resultId?: string;
    createdAt?: string;
  }>;
}

export interface CorviozBusinessContext {
  product: "corvioz";
  allowedDomains: Array<"invoice" | "quote" | "proposal" | "client" | "payment">;
  revenueDriven: true;
}

export interface SkillExecutionContext {
  input: SkillInput;
  skill: Skill;
  plugins: Record<string, CorviozPlugin>;
  memoryContext: MemoryContext;
  businessContext: CorviozBusinessContext;
}

export interface SkillExecutionResult {
  skill: SkillName;
  status: SkillExecutionStatus;
  confidence?: number;
  summary: string;
  data?: Record<string, unknown>;
  pluginOutputs?: PluginOutput[];
  nextSkills?: SkillName[];
  uiFallback?: string;
}

export interface Skill {
  name: SkillName;
  triggers: string[];
  description: string;
  businessDomain: CorviozBusinessContext["allowedDomains"][number];
  chainableWith: SkillName[];
  handler: (context: SkillExecutionContext) => Promise<SkillExecutionResult>;
}

export const DEFAULT_CORVIOZ_BUSINESS_CONTEXT: CorviozBusinessContext = {
  product: "corvioz",
  allowedDomains: ["invoice", "quote", "proposal", "client", "payment"],
  revenueDriven: true,
};

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

function extractClientName(input: SkillInput, memory: MemoryContext) {
  const fromPayload = String(input.payload?.client_name || input.payload?.clientName || "").trim();
  if (fromPayload) return fromPayload;

  const explicitMatch = input.rawInput.match(/client\s+([a-z][a-z\s'-]{1,60})/i);
  if (explicitMatch?.[1]) return titleCase(explicitMatch[1].replace(/\b(for|with|about|to|and)\b.*$/i, ""));

  return memory.clientName || memory.recentClients?.[0]?.name || "New Client";
}

function extractAmount(input: SkillInput) {
  const payloadAmount = Number(input.payload?.amount || input.payload?.total || 0);
  if (payloadAmount > 0) return payloadAmount;

  const moneyMatch = input.rawInput.match(/(?:\$|usd\s*)?(\d+(?:\.\d{1,2})?)/i);
  return moneyMatch?.[1] ? Number(moneyMatch[1]) : 0;
}

function baseDocumentPayload(input: SkillInput, memory: MemoryContext) {
  const clientName = extractClientName(input, memory);
  const currency = String(
    input.payload?.currency ||
      memory.currency ||
      memory.preferences?.defaultCurrency ||
      "USD"
  ).toUpperCase();
  const amount = extractAmount(input);

  return {
    client_name: clientName,
    client_email: input.payload?.client_email || input.payload?.clientEmail || memory.clientEmail || "",
    currency,
    total: amount,
    status: "draft",
    items: input.payload?.items || [
      {
        description: input.payload?.description || "Professional services",
        quantity: 1,
        unitPrice: amount,
      },
    ],
    tax_rate: input.payload?.tax_rate || memory.preferences?.defaultTaxRate || 0,
    payment_terms: input.payload?.payment_terms || memory.preferences?.paymentTerms || "Net 30",
    notes: input.payload?.notes || "",
  };
}

async function saveClient(context: SkillExecutionContext) {
  const payload = {
    name: extractClientName(context.input, context.memoryContext),
    email: context.input.payload?.client_email || context.input.payload?.clientEmail || context.memoryContext.clientEmail || "",
    address: context.input.payload?.client_address || context.input.payload?.clientAddress || "",
    user_id: context.input.userId,
  };

  return context.plugins.supabase.execute({
    action: "write-client",
    payload,
    context: {
      userId: context.input.userId,
      supabaseClient: context.input.supabaseClient as never,
    },
  });
}

export const skillRegistry: Skill[] = [
  {
    name: "invoice-generator",
    triggers: ["invoice", "bill", "billing", "payment request", "receipt", "collect payment", "send invoice"],
    description: "Generate revenue-ready invoices, save client records, create payment intent placeholders, and prepare PDF exports.",
    businessDomain: "invoice",
    chainableWith: ["client-management", "payment-flow"],
    async handler(context) {
      const clientOutput = await saveClient(context);
      const invoicePayload = {
        ...baseDocumentPayload(context.input, context.memoryContext),
        user_id: context.input.userId,
        doc_type: "invoice",
        client_id: (clientOutput.data as Record<string, unknown> | undefined)?.id,
      };

      const invoiceOutput = await context.plugins.supabase.execute({
        action: "write-invoice",
        payload: invoicePayload,
        context: {
          userId: context.input.userId,
          supabaseClient: context.input.supabaseClient as never,
        },
      });

      const paymentOutput = await context.plugins.payment.execute({
        action: "create-checkout-session",
        payload: {
          amount: invoicePayload.total,
          currency: invoicePayload.currency,
          documentType: "invoice",
          documentId: (invoiceOutput.data as Record<string, unknown> | undefined)?.id,
        },
        context: {
          userId: context.input.userId,
          paymentProvider: context.input.paymentProvider,
        },
      });

      const exportOutput = await context.plugins["file-export"].execute({
        action: "generate-pdf",
        payload: {
          ...(invoiceOutput.data || invoicePayload),
          documentType: "invoice",
        },
        context: { userId: context.input.userId },
      });

      return {
        skill: "invoice-generator",
        status: invoiceOutput.status === "failed" ? "failed" : "degraded",
        summary: `Invoice flow prepared for ${invoicePayload.client_name}.`,
        data: {
          client: clientOutput.data,
          invoice: invoiceOutput.data,
          checkout: paymentOutput.data,
          pdf: exportOutput.data,
        },
        pluginOutputs: [clientOutput, invoiceOutput, paymentOutput, exportOutput],
        nextSkills: ["payment-flow"],
      };
    },
  },
  {
    name: "quote-generator",
    triggers: ["quote", "quotation", "estimate", "pricing", "price offer", "client offer"],
    description: "Generate client quotes and save them as revenue opportunities.",
    businessDomain: "quote",
    chainableWith: ["client-management", "proposal-generator"],
    async handler(context) {
      const clientOutput = await saveClient(context);
      const quotePayload = {
        ...baseDocumentPayload(context.input, context.memoryContext),
        user_id: context.input.userId,
        quote_number: context.input.payload?.quote_number,
        client_id: (clientOutput.data as Record<string, unknown> | undefined)?.id,
      };

      const quoteOutput = await context.plugins.supabase.execute({
        action: "write-quote",
        payload: quotePayload,
        context: {
          userId: context.input.userId,
          supabaseClient: context.input.supabaseClient as never,
        },
      });

      const exportOutput = await context.plugins["file-export"].execute({
        action: "download-quote",
        payload: {
          ...(quoteOutput.data || quotePayload),
          documentType: "quote",
        },
        context: { userId: context.input.userId },
      });

      return {
        skill: "quote-generator",
        status: quoteOutput.status === "failed" ? "failed" : "degraded",
        summary: `Quote flow prepared for ${quotePayload.client_name}.`,
        data: {
          client: clientOutput.data,
          quote: quoteOutput.data,
          pdf: exportOutput.data,
        },
        pluginOutputs: [clientOutput, quoteOutput, exportOutput],
        nextSkills: ["proposal-generator"],
      };
    },
  },
  {
    name: "proposal-generator",
    triggers: ["proposal", "project proposal", "scope", "statement of work", "sow", "offer deck", "client proposal"],
    description: "Generate client proposals tied to quotes, conversion intent, and next payment action.",
    businessDomain: "proposal",
    chainableWith: ["quote-generator", "client-management", "payment-flow"],
    async handler(context) {
      const clientOutput = await saveClient(context);
      const proposalPayload = {
        ...baseDocumentPayload(context.input, context.memoryContext),
        user_id: context.input.userId,
        title: context.input.payload?.title || `Proposal for ${extractClientName(context.input, context.memoryContext)}`,
        scope: context.input.payload?.scope || context.input.rawInput,
        client_id: (clientOutput.data as Record<string, unknown> | undefined)?.id,
      };

      const proposalOutput = await context.plugins.supabase.execute({
        action: "write-proposal",
        payload: proposalPayload,
        context: {
          userId: context.input.userId,
          supabaseClient: context.input.supabaseClient as never,
        },
      });

      const exportOutput = await context.plugins["file-export"].execute({
        action: "download-proposal",
        payload: {
          ...(proposalOutput.data || proposalPayload),
          documentType: "proposal",
        },
        context: { userId: context.input.userId },
      });

      return {
        skill: "proposal-generator",
        status: proposalOutput.status === "failed" ? "failed" : "degraded",
        summary: `Proposal flow prepared for ${proposalPayload.client_name}.`,
        data: {
          client: clientOutput.data,
          proposal: proposalOutput.data,
          pdf: exportOutput.data,
        },
        pluginOutputs: [clientOutput, proposalOutput, exportOutput],
        nextSkills: ["payment-flow"],
      };
    },
  },
  {
    name: "client-management",
    triggers: ["client", "customer", "crm", "contact", "save client", "client record", "lead"],
    description: "Create or update client records that power invoices, quotes, proposals, and payment follow-up.",
    businessDomain: "client",
    chainableWith: ["invoice-generator", "quote-generator", "proposal-generator"],
    async handler(context) {
      const clientOutput = await saveClient(context);

      return {
        skill: "client-management",
        status: clientOutput.status === "failed" ? "failed" : "degraded",
        summary: `Client record prepared for ${extractClientName(context.input, context.memoryContext)}.`,
        data: {
          client: clientOutput.data,
        },
        pluginOutputs: [clientOutput],
      };
    },
  },
  {
    name: "payment-flow",
    triggers: ["payment", "checkout", "stripe", "paddle", "pay link", "payment link", "collect", "paid"],
    description: "Create checkout sessions and payment links for invoice, quote, and proposal conversion.",
    businessDomain: "payment",
    chainableWith: ["invoice-generator", "quote-generator", "proposal-generator"],
    async handler(context) {
      const documentPayload = baseDocumentPayload(context.input, context.memoryContext);
      const paymentOutput = await context.plugins.payment.execute({
        action: "create-checkout-session",
        payload: {
          amount: documentPayload.total,
          currency: documentPayload.currency,
          client_name: documentPayload.client_name,
          source: context.input.payload?.source || "skill-router",
        },
        context: {
          userId: context.input.userId,
          paymentProvider: context.input.paymentProvider,
        },
      });

      const paymentRecordOutput = await context.plugins.supabase.execute({
        action: "write-payment",
        payload: {
          user_id: context.input.userId,
          client_name: documentPayload.client_name,
          amount: documentPayload.total,
          currency: documentPayload.currency,
          status: "checkout_created",
          checkout: paymentOutput.data,
        },
        context: {
          userId: context.input.userId,
          supabaseClient: context.input.supabaseClient as never,
        },
      });

      return {
        skill: "payment-flow",
        status: paymentOutput.status === "failed" ? "failed" : "degraded",
        summary: `Payment flow prepared for ${documentPayload.client_name}.`,
        data: {
          checkout: paymentOutput.data,
          paymentRecord: paymentRecordOutput.data,
        },
        pluginOutputs: [paymentOutput, paymentRecordOutput],
      };
    },
  },
];

export function getSkillByName(name: SkillName) {
  return skillRegistry.find((skill) => skill.name === name);
}

export function createSkillExecutionContext(input: SkillInput, skill: Skill): SkillExecutionContext {
  return {
    input,
    skill,
    plugins: pluginRegistry,
    memoryContext: input.memoryContext || {},
    businessContext: input.businessContext || DEFAULT_CORVIOZ_BUSINESS_CONTEXT,
  };
}
