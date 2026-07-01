export type GlobalControlSurfaceKey = 'theme_toggle' | 'menu_trigger' | 'auth_entry' | 'workspace_switch';

export interface GlobalControlSurfaceItem {
  key: GlobalControlSurfaceKey;
  canonicalOwner: string;
  allowedRenderer: string;
  responsibility: string;
}

export const GLOBAL_CONTROL_SURFACE = {
  owner: 'GlobalHeaderControlCluster',
  version: 'control_surface_v1_2026_06_30',
  items: [
    {
      key: 'theme_toggle',
      canonicalOwner: 'src/components/layout/GlobalHeaderControlCluster.tsx',
      allowedRenderer: 'ThemeToggle rendered inside the global header control cluster only',
      responsibility: 'Theme selection and persisted theme preference.',
    },
    {
      key: 'menu_trigger',
      canonicalOwner: 'src/components/layout/GlobalHeaderControlCluster.tsx',
      allowedRenderer: 'Mobile menu trigger rendered by the global header control cluster only',
      responsibility: 'Open and close the page navigation menu without duplicate floating triggers.',
    },
    {
      key: 'auth_entry',
      canonicalOwner: 'src/components/layout/GlobalHeaderControlCluster.tsx',
      allowedRenderer: 'Sign in or account entry rendered by the global header control cluster',
      responsibility: 'Primary account entry point for unauthenticated and authenticated users.',
    },
    {
      key: 'workspace_switch',
      canonicalOwner: 'src/components/layout/GlobalHeaderControlCluster.tsx',
      allowedRenderer: 'Optional workspace action rendered by the global header control cluster',
      responsibility: 'Route users to the current workspace action without local page-specific control clusters.',
    },
  ] satisfies GlobalControlSurfaceItem[],
} as const;

export function getGlobalControlSurfaceItem(key: GlobalControlSurfaceKey): GlobalControlSurfaceItem | undefined {
  return GLOBAL_CONTROL_SURFACE.items.find((item) => item.key === key);
}
