/*
 * Contact Flow Expression Renderer — Corvioz v10
 *
 * Returns contact method configuration per plan tier.
 * Pure UI config only.
 */

import { PlanTier } from './expressionEngine';

export interface ContactFlowConfig {
  /** The type of contact flow available */
  type: 'email_only' | 'form_and_calendar' | 'branded_hub';
  /** CTA button label shown on public profile */
  ctaLabel: string;
  /** Whether contact form is rendered */
  showContactForm: boolean;
  /** Whether calendar booking link is shown */
  showCalendarLink: boolean;
  /** Whether response time SLA is displayed */
  showResponseTime: boolean;
  /** Whether "Request a Quote" flow is enabled */
  quoteRequestEnabled: boolean;
}

export function getContactFlowConfig(plan: PlanTier): ContactFlowConfig {
  switch (plan) {
    case 'studio':
      return {
        type: 'branded_hub',
        ctaLabel: 'Contact this agency',
        showContactForm: true,
        showCalendarLink: true,
        showResponseTime: true,
        quoteRequestEnabled: true,
      };
    case 'growth':
      return {
        type: 'form_and_calendar',
        ctaLabel: 'Get in touch',
        showContactForm: true,
        showCalendarLink: false,
        showResponseTime: true,
        quoteRequestEnabled: true,
      };
    case 'pro':
      return {
        type: 'email_only',
        ctaLabel: 'Send Email',
        showContactForm: false,
        showCalendarLink: false,
        showResponseTime: false,
        quoteRequestEnabled: false,
      };
    case 'free':
    default:
      return {
        type: 'email_only',
        ctaLabel: 'Send email',
        showContactForm: false,
        showCalendarLink: false,
        showResponseTime: false,
        quoteRequestEnabled: false,
      };
  }
}
