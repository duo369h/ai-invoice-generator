/**
 * Corvioz — Launch Control Center (LCC) [DEPRECATED - WRAPPER ONLY]
 *
 * All decision logic has been migrated to CORVIOZ_DECISION_KERNEL.
 */

import { getCorviozDecision } from '../kernel/CORVIOZ_DECISION_KERNEL.ts';

export type LaunchRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type LaunchEntryMode = 'GUEST' | 'AUTH' | 'ACTIVATION' | 'BLOCKED';
export type LaunchMonetizationMode = 'NONE' | 'SOFT' | 'AGGRESSIVE';
export type LaunchDashboardMode = 'FULL' | 'SIMPLIFIED' | 'READONLY';

export type LaunchState = {
  riskLevel: LaunchRiskLevel;
  entryMode: LaunchEntryMode;
  monetizationMode: LaunchMonetizationMode;
  paywallAllowed: boolean;
  revenueTrackingEnabled: boolean;
  aiAttributionEnabled: boolean;
  dashboardMode: LaunchDashboardMode;
  killSwitchActive: boolean;
};

export function getLaunchState(userState: any): LaunchState {
  const decision = getCorviozDecision(userState);
  
  let riskLevel: LaunchRiskLevel = 'LOW';
  if (decision.reason.includes('risk:HIGH')) riskLevel = 'HIGH';
  else if (decision.reason.includes('risk:MEDIUM')) riskLevel = 'MEDIUM';

  return {
    riskLevel,
    entryMode: decision.entryMode === 'AUTH' ? 'AUTH' : (decision.entryMode === 'BLOCKED' ? 'BLOCKED' : 'GUEST'),
    monetizationMode: decision.monetizationMode,
    paywallAllowed: decision.paywallAllowed,
    revenueTrackingEnabled: decision.revenueMode !== 'OFF',
    aiAttributionEnabled: decision.aiAttributionEnabled,
    dashboardMode: decision.dashboardMode === 'READONLY' ? 'READONLY' : 'FULL',
    killSwitchActive: decision.killSwitchActive,
  };
}

export function isMonetizationPermitted(userState: any): boolean {
  return getLaunchState(userState).paywallAllowed;
}

export function getDashboardMode(userState: any): LaunchDashboardMode {
  return getLaunchState(userState).dashboardMode;
}
