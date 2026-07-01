'use client';

/**
 * Template View Tracker — Client Component
 * Sprint C Phase 2.6
 *
 * Fires TEMPLATE_VIEWED event on mount.
 * This is a pure instrumentation component — renders nothing visible.
 */

import { useEffect } from 'react';
import { sendEvent } from '../../core/analytics/eventRouter';

export default function TemplateViewTracker({ templateType, industry }) {
  useEffect(() => {
    sendEvent('TEMPLATE_VIEWED', { templateType, industry: industry ?? 'generic' });
  }, [templateType, industry]);

  return null;
}
