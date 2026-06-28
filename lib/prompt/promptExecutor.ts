/**
 * Prompt Execution Layer — Corvioz v8.6
 *
 * Standardizes prompt structure for LLM completions.
 * Enforces unified formatting to optimize tokens and ensure output consistency.
 */

import { PromptArchitectureMap, PromptType } from './architecture/promptArchitectureMap';

export interface PromptExecutionResult {
  systemPrompt: string;
  userInput: string;
  constraints: readonly string[];
  meta: {
    tone: string;
    outputFormat: string;
  };
}

/**
 * Packs input data into the structured prompt schema defined by prompt type.
 *
 * @param type - The target prompt type (invoice, quote, or profile).
 * @param input - The raw user input message or data structure.
 */
export function executePrompt(type: PromptType, input: string): PromptExecutionResult {
  const template = PromptArchitectureMap[type];
  if (!template) {
    throw new Error(`Unsupported prompt type: ${type}`);
  }

  return {
    systemPrompt: template.system,
    userInput: input,
    constraints: template.constraints,
    meta: {
      tone: template.tone,
      outputFormat: template.outputFormat,
    },
  };
}

export function formatSystemPrompt(type: PromptType, schemaDetails: string | null = null): string {
  const template = PromptArchitectureMap[type];
  if (!template) {
    throw new Error(`Unsupported prompt type: ${type}`);
  }
  
  let formatted = `${template.system}
Tone: ${template.tone}
Format: ${template.outputFormat}
Constraints:
${template.constraints.map(c => `- ${c}`).join('\n')}`;

  if (schemaDetails) {
    formatted += `\n\n${schemaDetails}`;
  }
  
  return formatted;
}
