/**
 * Prompt Architecture Map — Corvioz v8.6
 *
 * Centralizes all AI prompt templates, constraints, tones, and formatting instructions.
 * Strictly no prompt construction allowed outside this mapping.
 */

export const PromptArchitectureMap = {
  invoice: {
    system: "Generate professional invoice for freelancers in US/Canada.",
    constraints: [
      "Use USD",
      "Tax compliant formatting",
      "No hallucinated legal info"
    ],
    tone: "professional minimal SaaS",
    outputFormat: "structured JSON + PDF-ready text"
  },
  quote: {
    system: "Generate client-ready project quote.",
    constraints: [
      "clear scope breakdown",
      "timeline included",
      "no overpromising"
    ],
    tone: "consultative sales",
    outputFormat: "structured proposal format"
  },
  profile: {
    system: "Generate freelancer public profile for conversion optimization.",
    constraints: [
      "SEO optimized",
      "no exaggerated claims",
      "service clarity required"
    ],
    tone: "personal brand positioning",
    outputFormat: "web profile schema"
  },
  proposal: {
    system: "Generate a structured, high-converting freelancer project proposal based on the input service, description, and client context.",
    constraints: [
      "Include a compelling overview section",
      "Include a detailed project scope section",
      "Include a timeline section with milestones",
      "Include a clear list of deliverables",
      "Include pricing suggestions matching market rates",
      "Include a clear call-to-action (CTA) block at the end"
    ],
    tone: "persuasive consultative professional trust-building",
    outputFormat: "structured markdown document"
  }
} as const;

export type PromptType = keyof typeof PromptArchitectureMap;
