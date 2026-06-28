/**
 * UI Exposure Controller — Corvioz v5.5 Controlled Execution Layer
 *
 * Resolves UI exposure flags (banners, modals, pricing highlight) for client-side rendering.
 * Purely analytical. It MUST NOT trigger any backend changes or API writes.
 */

import { executeUpgradeStrategy } from './executionEngine';
import { allowUpgradeExposure } from './safetyGuard';

export interface UIExposureOutput {
  banner: 'none' | 'pro' | 'growth' | 'studio';
  modal: null | 'upgrade';
  highlightPlan: string;
  disabled: boolean;
}

/**
 * Computes the final UI exposure layout controls for a user.
 *
 * @param userId - The user ID to evaluate.
 */
export function getUIExposureControls(userId: string | null | undefined): UIExposureOutput {
  if (!userId || typeof window === 'undefined') {
    return {
      banner: 'none',
      modal: null,
      highlightPlan: 'pro',
      disabled: true,
    };
  }

  // 1. Get recommendation details from the execution engine
  const exec = executeUpgradeStrategy(userId);

  // 2. Determine banner exposure by checking safetyGuard
  let banner: 'none' | 'pro' | 'growth' | 'studio' = 'none';
  if (exec.shouldShowBanner) {
    const bannerAllowed = allowUpgradeExposure(userId, 'banner');
    if (bannerAllowed) {
      banner = exec.recommendedPlan;
    }
  }

  // 3. Determine modal exposure by checking safetyGuard
  let modal: null | 'upgrade' = null;
  if (exec.shouldShowModal) {
    const modalAllowed = allowUpgradeExposure(userId, 'modal');
    if (modalAllowed) {
      modal = 'upgrade';
    }
  }

  return {
    banner,
    modal,
    highlightPlan: exec.recommendedPlan,
    disabled: false,
  };
}
