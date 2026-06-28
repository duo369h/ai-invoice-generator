/**
 * Corvioz v1 — Entry Metrics Logger
 *
 * Records entry routing decisions for audit and monitoring.
 *
 * RULE:
 *   ❌ No scoring
 *   ❌ No inference
 *   ❌ No conversion logic
 */

export interface EntryRoutingMetric {
  user_id:              string;
  entry_path:           string;
  resolved_path:        string;
  is_activation_routed: boolean;
  timestamp:            number;
}

const _metricsBuffer: EntryRoutingMetric[] = [];

/**
 * Logs an entry routing decision.
 */
export function logEntryDecision(
  userId:             string,
  entryPath:          string,
  resolvedPath:       string,
  isActivationRouted: boolean
): EntryRoutingMetric {
  const metric: EntryRoutingMetric = {
    user_id:              userId,
    entry_path:           entryPath,
    resolved_path:        resolvedPath,
    is_activation_routed: isActivationRouted,
    timestamp:            Date.now(),
  };

  _metricsBuffer.push(metric);

  // Print to stdout/console for standard observability log collection
  console.log(`[ENTRY_OBSERVABILITY] ${JSON.stringify(metric)}`);

  return metric;
}

/**
 * Returns all logged entry routing metrics.
 */
export function getEntryMetrics(): EntryRoutingMetric[] {
  return [..._metricsBuffer];
}

/**
 * Clears metrics buffer.
 */
export function clearEntryMetrics(): void {
  _metricsBuffer.length = 0;
}
