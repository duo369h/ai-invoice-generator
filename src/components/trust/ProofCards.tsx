import React from 'react';
import type { TrustLayerExamples } from '../../core/trust/exampleGenerator';
import type { RevenueSimulation } from '../../core/trust/revenueSimulation';
import type { SocialProofSignal } from '../../core/trust/socialProof';

type ProofCardsProps = {
  examples: TrustLayerExamples;
  simulation?: RevenueSimulation;
  signals?: SocialProofSignal[];
  compact?: boolean;
};

function formatCurrency(value: number) {
  return `$${value.toLocaleString('en-US')}`;
}

export function ProofCards({ examples, simulation, signals = [], compact = false }: ProofCardsProps) {
  const { quote, invoice, proposal, clientRecord } = examples;

  return (
    <div className={compact ? 'proof-cards proof-cards--compact' : 'proof-cards'}>
      <article className="proof-card proof-card--invoice">
        <div className="proof-card-header">
          <span className="proof-label">Example Invoice Preview</span>
          <span className="proof-status">{invoice.status}</span>
        </div>
        <h3>{invoice.title}</h3>
        <p>{invoice.client} - {invoice.dueDate}</p>
        <div className="proof-amount-row">
          <strong>{formatCurrency(invoice.total)}</strong>
          <span>{formatCurrency(invoice.paidAmount)} collected</span>
        </div>
        <ul>
          {invoice.lineItems.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              <strong>{formatCurrency(item.amount)}</strong>
            </li>
          ))}
        </ul>
      </article>

      <article className="proof-card proof-card--quote">
        <div className="proof-card-header">
          <span className="proof-label">Example Quote Output</span>
          <span className="proof-status">{quote.status}</span>
        </div>
        <h3>{quote.service}</h3>
        <p>{quote.client} - {formatCurrency(quote.total)}</p>
        <div className="proof-timeline">
          {quote.timeline.map((step) => (
            <span key={step}>{step}</span>
          ))}
        </div>
        <div className="proof-note">{proposal.approvalSignal}</div>
      </article>

      <article className="proof-card proof-card--client">
        <div className="proof-card-header">
          <span className="proof-label">Example Client Result</span>
          <span className="proof-status">{clientRecord.lifecycle}</span>
        </div>
        <h3>{clientRecord.client}</h3>
        <p>{clientRecord.project}</p>
        <div className="proof-result-grid">
          <div>
            <span>Project value</span>
            <strong>{formatCurrency(clientRecord.value)}</strong>
          </div>
          <div>
            <span>Next action</span>
            <strong>{clientRecord.nextAction}</strong>
          </div>
        </div>
        {simulation && (
          <div className="proof-simulation">
            <span>{simulation.invoiceCount} invoices observed</span>
            <span>{simulation.clientGrowth}</span>
          </div>
        )}
      </article>

      {!compact && (
        <article className="proof-card proof-card--proposal">
          <div className="proof-card-header">
            <span className="proof-label">Proposal Outcome</span>
            <span className="proof-status">preview</span>
          </div>
          <h3>{proposal.title}</h3>
          <p>{proposal.outcome}</p>
          <ul>
            {proposal.milestones.map((milestone) => (
              <li key={milestone}>
                <span>{milestone}</span>
              </li>
            ))}
          </ul>
          {signals[0] && <div className="proof-note">{signals[0].detail}</div>}
        </article>
      )}
    </div>
  );
}
