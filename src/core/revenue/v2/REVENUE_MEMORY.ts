/**
 * Corvioz — Revenue Memory Layer v2.1
 *
 * Persists historical pricing outcomes and identifies optimal price range performance.
 */

export type MemoryRecord = {
  id: string;
  serviceType: string;
  clientType: string;
  price: number;
  outcome: "accepted" | "rejected" | "edited";
  timestamp: number;
};

// Global in-memory log layer fallback
const memoryStore: MemoryRecord[] = [];

/**
 * Saves a pricing outcome record to the memory store.
 */
export function saveRecord(record: MemoryRecord): void {
  // Prevent duplicate logs
  if (!memoryStore.some((m) => m.id === record.id)) {
    memoryStore.push(record);
  }
}

/**
 * Queries the memory store for a specific service type.
 */
export function queryHistory(serviceType: string): MemoryRecord[] {
  return memoryStore.filter((m) => m.serviceType === serviceType);
}

/**
 * Identifies the best price range based on historical conversions.
 */
export function getBestPriceRange(serviceType: string): { min: number; max: number } {
  const history = queryHistory(serviceType);
  if (history.length === 0) {
    return { min: 500, max: 2500 }; // Default fallbacks
  }

  const converts = history.filter((m) => m.outcome === "accepted" || m.outcome === "edited");
  if (converts.length === 0) {
    const prices = history.map((m) => m.price);
    return {
      min: Math.round(Math.min(...prices) * 0.8),
      max: Math.round(Math.max(...prices) * 1.2),
    };
  }

  const prices = converts.map((m) => m.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}
