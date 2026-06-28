/**
 * Corvioz — Preview to Proposal Conversion Bridge
 *
 * Maps guest demo/preview choices to prefilled fields for onboarding creation.
 */

export interface PreviewData {
  client_type: string;
  project_scope: string;
  suggested_price_usd: number;
}

export function convertPreviewToProposal(input: PreviewData): string {
  // Store prefill information in sessionStorage or memory if in browser
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem("corvioz_growth_prefill", JSON.stringify({
        client_name: input?.client_type || "Acme Corp",
        title: `AI Proposal for ${input?.client_type || "Client"}`,
        scope: input?.project_scope || "Scope defined during demo",
        value: input?.suggested_price_usd || 5000,
        prefilled_at: new Date().toISOString()
      }));
    } catch (e) {
      console.warn("Could not save growth prefill payload to sessionStorage", e);
    }
  }

  return "/quotes/create?prefill=true";
}
