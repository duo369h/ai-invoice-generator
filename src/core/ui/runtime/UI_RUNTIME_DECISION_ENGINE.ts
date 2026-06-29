import { enforceUI } from "../v3/ENFORCEMENT_HUB";

/**
 * Corvioz — UI Runtime Decision Engine
 *
 * Drives UI layout, sorting, and visibility based on deterministic
 * runtime business signals.
 *
 * Rules:
 * 1. Revenue Pressure: signal.revenueProbability > 0.8 => priority 100, placement TOP, urgency HIGH
 * 2. Conversion Blocker: signal.conversionDrop === true => priority 90, placement TOP
 * 3. Engagement Low: signal.engagementDecay === true => priority 60, placement MIDDLE
 */

export type UIRevenueSignal = {
  revenueProbability: number;
  conversionDrop: boolean;
  engagementDecay: boolean;
  churnRisk: "LOW" | "MEDIUM" | "HIGH";
};

export type UIRuntimeDecision = {
  priority: number;        // 0-100
  visibility: boolean;
  placement: "TOP" | "MIDDLE" | "BOTTOM";
  urgency: "LOW" | "MEDIUM" | "HIGH";
  mutateUI: boolean;
  reason: string;
};

export function getUIRuntimeDecision(signal: UIRevenueSignal, sectionType?: string): UIRuntimeDecision {
  // Safe defaults
  let priority = 30;
  let visibility = true;
  let placement: "TOP" | "MIDDLE" | "BOTTOM" = "BOTTOM";
  let urgency: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  let mutateUI = false;
  let reason = "Default presentation";

  // Section type base overrides to enable dynamic sorting
  if (sectionType) {
    switch (sectionType) {
      case "HEADER":
        priority = 100;
        placement = "TOP";
        reason = "System Header";
        return enforceUI({ priority, visibility, placement, urgency, mutateUI, reason });
      case "SAFE_MODE":
        priority = 100;
        placement = "TOP";
        reason = "Safe Mode Lock";
        return enforceUI({ priority, visibility, placement, urgency, mutateUI, reason });
      case "FOCUS":
        priority = 50;
        placement = "MIDDLE";
        break;
      case "LEADS":
        priority = 45;
        placement = "MIDDLE";
        break;
      case "QUOTES":
        priority = 40;
        placement = "BOTTOM";
        break;
      case "INVOICES":
        priority = 35;
        placement = "BOTTOM";
        break;
      case "ACTIONS":
        priority = 48;
        placement = "TOP";
        break;
      case "SYSTEM":
        priority = 25;
        placement = "BOTTOM";
        break;
      case "IMPACT":
        priority = 20;
        placement = "BOTTOM";
        break;
      case "FLOW":
        priority = 15;
        placement = "BOTTOM";
        break;
      case "DEMO":
        priority = 10;
        placement = "BOTTOM";
        break;
      case "ONBOARDING":
        priority = 5;
        placement = "BOTTOM";
        break;
      case "ACTIVITY":
        priority = 2;
        placement = "BOTTOM";
        break;
      case "EMPTY_STATE":
        priority = 85;
        placement = "TOP";
        break;
    }
  }

  // 1️⃣ Revenue Pressure rule
  if (signal.revenueProbability > 0.8) {
    if (sectionType === "FOCUS" || sectionType === "ACTIONS") {
      priority = 100;
      placement = "TOP";
      urgency = "HIGH";
      mutateUI = true;
      reason = "Revenue Pressure";
    }
  }
  // 2️⃣ Conversion Blocker rule
  else if (signal.conversionDrop === true) {
    if (sectionType === "LEADS" || sectionType === "QUOTES" || sectionType === "ACTIONS") {
      priority = 90;
      placement = "TOP";
      urgency = "HIGH";
      mutateUI = true;
      reason = "Conversion Blocker";
    }
  }
  // 3️⃣ Engagement Low rule
  else if (signal.engagementDecay === true) {
    if (sectionType === "DEMO" || sectionType === "ONBOARDING" || sectionType === "ACTIVITY") {
      priority = 60;
      placement = "MIDDLE";
      urgency = "MEDIUM";
      mutateUI = true;
      reason = "Engagement Low";
    }
  }

  // Churn risk adjustments
  if (signal.churnRisk === "HIGH" && sectionType === "INVOICES") {
    priority = 80;
    placement = "TOP";
    urgency = "HIGH";
    mutateUI = true;
    reason = "High Churn Risk Invoicing Action";
  }

  return enforceUI({
    priority,
    visibility,
    placement,
    urgency,
    mutateUI,
    reason,
  });
}
