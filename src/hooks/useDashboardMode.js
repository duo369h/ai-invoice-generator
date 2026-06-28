'use client';

export function useDashboardMode(mode) {
  const isLive = mode === 'live';
  const isDemo = mode === 'demo';
  const isPreview = mode === 'preview';

  return {
    isLive,
    isDemo,
    isPreview,
    isReadOnly: isPreview,
    isInteractive: !isPreview,
    isResettable: isDemo,
    allowNavigation: !isPreview,
    allowMutations: !isPreview,
  };
}
export default useDashboardMode;
