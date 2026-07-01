'use client';

/**
 * Template View Tracker — Client Component
 * Sprint C Phase 2.6
 *
 * Fires TEMPLATE_VIEWED event on mount.
 * This is a pure instrumentation component — renders nothing visible.
 */

import { useEffect } from 'react';
import { trackTemplateView } from '../../core/analytics/track';

export default function TemplateViewTracker({ templateType, industry }) {
  useEffect(() => {
    trackTemplateView(templateType, industry);
  }, [templateType, industry]);

  return null;
}
