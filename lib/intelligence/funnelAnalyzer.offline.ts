/*
INTELLIGENCE LAYER
This module MUST NOT be used in runtime execution.
Allowed usage:
- offline analysis
- batch processing
- admin tooling
Forbidden:
- UI
- API runtime
- analytics pipeline
*/

import { enforceLayerBoundary } from '../../src/core/architecture/guard';

// Enforce offline intelligence boundary check at module load time
enforceLayerBoundary('intelligence', process.env.CORVIOZ_CALLER || 'runtime');

export interface HistoricalEvent {
  id: string;
  user_id?: string;
  session_id: string;
  event_type: string;
  timestamp: string;
}

/**
 * Offline Funnel Analyzer
 * Consumed strictly in batch processing pipelines / admin scripts.
 * MUST NOT be imported or executed in any frontend or UI runtime paths.
 */
export class FunnelAnalyzerOffline {
  /**
   * Processes historical event stream to find stage-to-stage conversion rates
   */
  public static analyzeConversionFunnel(events: HistoricalEvent[]): {
    totalSessions: number;
    invoiceCreatedCount: number;
    invoiceSentCount: number;
    invoicePaidCount: number;
    rates: {
      sessionToCreated: number;
      createdToSent: number;
      sentToPaid: number;
    };
  } {
    const sessions = new Set<string>();
    const createdUsers = new Set<string>();
    const sentUsers = new Set<string>();
    const paidUsers = new Set<string>();

    events.forEach((evt) => {
      sessions.add(evt.session_id);
      const userId = evt.user_id || evt.session_id;

      if (evt.event_type === 'invoice_created') {
        createdUsers.add(userId);
      } else if (evt.event_type === 'invoice_sent') {
        sentUsers.add(userId);
      } else if (evt.event_type === 'invoice_paid') {
        paidUsers.add(userId);
      }
    });

    const totalSessions = sessions.size;
    const invoiceCreatedCount = createdUsers.size;
    const invoiceSentCount = sentUsers.size;
    const invoicePaidCount = paidUsers.size;

    return {
      totalSessions,
      invoiceCreatedCount,
      invoiceSentCount,
      invoicePaidCount,
      rates: {
        sessionToCreated: totalSessions ? invoiceCreatedCount / totalSessions : 0,
        createdToSent: invoiceCreatedCount ? invoiceSentCount / invoiceCreatedCount : 0,
        sentToPaid: invoiceSentCount ? invoicePaidCount / invoiceSentCount : 0,
      },
    };
  }
}
