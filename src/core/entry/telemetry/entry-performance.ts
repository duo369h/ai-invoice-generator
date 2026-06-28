/**
 * READ ONLY SYSTEM
 * MUST NOT affect routing, activation, or RDCL
 */

/**
 * Corvioz v1.2 — Entry Performance Dashboard Data Layer
 *
 * Computes performance rankings for entry routes.
 *
 * RULE:
 *   👉 no UI logic
 *   👉 no decision output
 */

export interface EntryPerformance {
  bestRoute:       string;
  worstRoute:      string;
  conversionRates: Record<string, number>;
}

export function computeEntryPerformance(conversionRates: Record<string, number>): EntryPerformance {
  const routes = Object.keys(conversionRates);
  if (routes.length === 0) {
    return {
      bestRoute:       "",
      worstRoute:      "",
      conversionRates: {},
    };
  }

  let bestRoute = routes[0];
  let worstRoute = routes[0];

  for (const route of routes) {
    if (conversionRates[route] > conversionRates[bestRoute]) {
      bestRoute = route;
    }
    if (conversionRates[route] < conversionRates[worstRoute]) {
      worstRoute = route;
    }
  }

  return {
    bestRoute,
    worstRoute,
    conversionRates,
  };
}
