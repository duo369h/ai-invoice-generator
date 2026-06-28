/*
CORVIOZ SYSTEM GUARANTEE v1
1. UI Layer = rendering only
2. Event Layer = facts only
3. Analytics Layer = passive only
4. Backend Layer = storage only
5. Intelligence Layer = offline only
NO CROSS-LAYER LOGIC ALLOWED
NO BUSINESS INFERENCE IN RUNTIME
*/

export interface ValidatedEvent {
  event_type: 'invoice_created' | 'invoice_sent' | 'invoice_paid' | 'quote_created' | 'client_created';
  metadata: {
    session_id: string;
    user_id?: string | null;
    page_path?: string;
    page_location?: string;
    source?: string;
    [key: string]: any;
  };
  timestamp: string;
}

const ALLOWED_EVENTS = new Set([
  'invoice_created',
  'invoice_sent',
  'invoice_paid',
  'quote_created',
  'client_created',
]);

/**
 * Validates and sanitizes incoming event payload.
 * Rejects non-allowed events and strips any enrichment/interpretation logic.
 */
export function validateEvent(payload: any): ValidatedEvent {

  const eventType = payload?.event_type || payload?.type || payload?.event;
  if (!eventType || !ALLOWED_EVENTS.has(eventType)) {
    throw new Error(`INVALID EVENT: Event '${eventType}' is not allowed in this system.`);
  }

  const metadata = payload?.metadata || {};
  if (typeof metadata !== 'object') {
    throw new Error('INVALID SCHEMA: Metadata must be an object.');
  }

  // Strip enrichment - only keep factual properties
  const cleanMetadata: Record<string, any> = {
    session_id: String(metadata.session_id || ''),
    user_id: metadata.user_id ? String(metadata.user_id) : null,
    page_path: metadata.page_path ? String(metadata.page_path) : undefined,
    page_location: metadata.page_location ? String(metadata.page_location) : undefined,
    source: metadata.source ? String(metadata.source) : 'user',
  };

  // Add event-specific facts
  if (eventType === 'invoice_created') {
    cleanMetadata.invoice_number = metadata.invoice_number ? String(metadata.invoice_number) : undefined;
    cleanMetadata.currency = metadata.currency ? String(metadata.currency) : undefined;
    cleanMetadata.sandbox = metadata.sandbox !== undefined ? Boolean(metadata.sandbox) : undefined;
  } else if (eventType === 'invoice_sent') {
    cleanMetadata.invoice_number = metadata.invoice_number ? String(metadata.invoice_number) : undefined;
  } else if (eventType === 'invoice_paid') {
    cleanMetadata.invoice_number = metadata.invoice_number ? String(metadata.invoice_number) : undefined;
  } else if (eventType === 'quote_created') {
    cleanMetadata.quote_number = metadata.quote_number ? String(metadata.quote_number) : undefined;
    cleanMetadata.currency = metadata.currency ? String(metadata.currency) : undefined;
    cleanMetadata.sandbox = metadata.sandbox !== undefined ? Boolean(metadata.sandbox) : undefined;
  } else if (eventType === 'client_created') {
    cleanMetadata.client_name = metadata.client_name ? String(metadata.client_name) : undefined;
    cleanMetadata.sandbox = metadata.sandbox !== undefined ? Boolean(metadata.sandbox) : undefined;
  }

  return {
    event_type: eventType as any,
    metadata: cleanMetadata as any,
    timestamp: payload.timestamp ? String(payload.timestamp) : new Date().toISOString(),
  };
}

