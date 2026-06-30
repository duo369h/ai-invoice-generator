export type PluginName = "supabase" | "payment" | "file-export";

export type PluginExecutionStatus = "success" | "degraded" | "failed";

export interface PluginInput<TPayload = Record<string, unknown>> {
  action: string;
  payload?: TPayload;
  context?: {
    userId?: string;
    requestId?: string;
    supabaseClient?: SupabaseLikeClient;
    paymentProvider?: "paddle" | "stripe";
  };
}

export interface PluginOutput<TData = Record<string, unknown>> {
  plugin: PluginName;
  action: string;
  status: PluginExecutionStatus;
  data?: TData;
  error?: string;
  uiMessage?: string;
}

export interface CorviozPlugin {
  name: PluginName;
  description: string;
  execute: (input: PluginInput) => Promise<PluginOutput>;
}

type SupabaseLikeClient = {
  from: (table: string) => {
    insert?: (payload: unknown) => SupabaseMutationBuilder;
    upsert?: (payload: unknown, options?: Record<string, unknown>) => SupabaseMutationBuilder;
    select?: (columns?: string) => SupabaseQueryBuilder;
  };
};

type SupabaseMutationBuilder = {
  select?: (columns?: string) => SupabaseQueryBuilder;
};

type SupabaseQueryBuilder = {
  single?: () => Promise<{ data?: unknown; error?: { message?: string } | null }>;
  maybeSingle?: () => Promise<{ data?: unknown; error?: { message?: string } | null }>;
};

function stableId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function writeWithSupabase(
  input: PluginInput,
  table: string,
  fallbackPrefix: string
): Promise<PluginOutput> {
  const client = input.context?.supabaseClient;
  const payload = input.payload || {};

  if (!client?.from) {
    return {
      plugin: "supabase",
      action: input.action,
      status: "degraded",
      data: {
        id: stableId(fallbackPrefix),
        table,
        ...payload,
        persisted: false,
      },
      uiMessage: "Data prepared locally. Connect Supabase to persist this record.",
    };
  }

  const writer = client.from(table).insert;
  if (!writer) {
    return {
      plugin: "supabase",
      action: input.action,
      status: "failed",
      error: `Supabase table writer unavailable for ${table}.`,
    };
  }

  const result = await writer(payload).select?.("*").single?.();
  if (result?.error) {
    return {
      plugin: "supabase",
      action: input.action,
      status: "failed",
      error: result.error.message || `Failed to write ${table}.`,
    };
  }

  return {
    plugin: "supabase",
    action: input.action,
    status: "success",
    data: result?.data as Record<string, unknown>,
  };
}

export const supabasePlugin: CorviozPlugin = {
  name: "supabase",
  description: "Read and write Corvioz revenue records including clients, invoices, quotes, proposals, and payments.",
  async execute(input) {
    switch (input.action) {
      case "write-client":
        return writeWithSupabase(input, "clients", "client");
      case "write-invoice":
        return writeWithSupabase(input, "invoices", "invoice");
      case "write-quote":
        return writeWithSupabase(input, "quotes", "quote");
      case "write-proposal":
        return writeWithSupabase(input, "proposals", "proposal");
      case "write-payment":
        return writeWithSupabase(input, "payments", "payment");
      case "read-client":
        return {
          plugin: "supabase",
          action: input.action,
          status: "degraded",
          data: input.payload || {},
          uiMessage: "Client lookup is ready for a connected Supabase request context.",
        };
      default:
        return {
          plugin: "supabase",
          action: input.action,
          status: "failed",
          error: `Unsupported Supabase plugin action: ${input.action}`,
        };
    }
  },
};

export const paymentPlugin: CorviozPlugin = {
  name: "payment",
  description: "Create Paddle or Stripe checkout sessions for invoices, proposals, and paid quote approvals.",
  async execute(input) {
    if (input.action !== "create-checkout-session") {
      return {
        plugin: "payment",
        action: input.action,
        status: "failed",
        error: `Unsupported payment plugin action: ${input.action}`,
      };
    }

    const provider = input.context?.paymentProvider || "paddle";
    const payload = input.payload || {};
    const amount = Number((payload as Record<string, unknown>).amount || 0);

    return {
      plugin: "payment",
      action: input.action,
      status: "degraded",
      data: {
        provider,
        checkoutSessionId: stableId(`${provider}_checkout`),
        checkoutUrl: `/checkout?provider=${provider}&amount=${amount}`,
        amount,
        currency: String((payload as Record<string, unknown>).currency || "USD").toUpperCase(),
        live: false,
      },
      uiMessage: `${provider} checkout placeholder created. Wire provider credentials to activate live payments.`,
    };
  },
};

export const fileExportPlugin: CorviozPlugin = {
  name: "file-export",
  description: "Generate PDF export metadata and downloadable document links for invoices, receipts, quotes, and proposals.",
  async execute(input) {
    if (!["generate-pdf", "download-invoice", "download-proposal", "download-quote"].includes(input.action)) {
      return {
        plugin: "file-export",
        action: input.action,
        status: "failed",
        error: `Unsupported file export plugin action: ${input.action}`,
      };
    }

    const payload = input.payload || {};
    const documentId = String((payload as Record<string, unknown>).id || stableId("doc"));
    const documentType = String((payload as Record<string, unknown>).documentType || "invoice");

    return {
      plugin: "file-export",
      action: input.action,
      status: "degraded",
      data: {
        id: documentId,
        documentType,
        format: "pdf",
        filename: `${documentType}-${documentId}.pdf`,
        downloadUrl: `/api/pdf/export?type=${documentType}&id=${documentId}`,
        generated: true,
      },
      uiMessage: "PDF export prepared. Use the export endpoint to render the final file.",
    };
  },
};

export const pluginRegistry: Record<PluginName, CorviozPlugin> = {
  supabase: supabasePlugin,
  payment: paymentPlugin,
  "file-export": fileExportPlugin,
};

export async function executePlugin<TPayload = Record<string, unknown>, TData = Record<string, unknown>>(
  pluginName: PluginName,
  input: PluginInput<TPayload>
) {
  return pluginRegistry[pluginName].execute(input as PluginInput) as Promise<PluginOutput<TData>>;
}
