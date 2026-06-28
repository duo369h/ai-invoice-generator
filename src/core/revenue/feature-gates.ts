export const featureGates = {
  invoice_limit: true,
  quote_limit: true,
  export_limit: true,
  client_limit: true
};

export function checkFeatureGate(feature: keyof typeof featureGates, action: string): boolean {
  if (action === 'UNLOCK_PREMIUM_FEATURES') {
    return true; // All features open for premium
  }
  // Standard limits apply otherwise
  return featureGates[feature];
}
