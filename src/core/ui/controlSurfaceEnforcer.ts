import { GLOBAL_CONTROL_SURFACE, type GlobalControlSurfaceKey } from './globalControlSurface';

export interface ControlSurfaceRegistration {
  surfaceId: string;
  controls: GlobalControlSurfaceKey[];
  route?: string;
}

const activeSurfaces = new Map<string, ControlSurfaceRegistration>();

export function registerControlSurface(registration: ControlSurfaceRegistration): () => void {
  activeSurfaces.set(registration.surfaceId, registration);

  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const duplicateControls = registration.controls.filter((control) => {
      let count = 0;
      for (const surface of activeSurfaces.values()) {
        if (surface.controls.includes(control)) count += 1;
      }
      return count > 1;
    });

    if (duplicateControls.length > 0) {
      console.warn('[CONTROL_SURFACE_ENFORCER] Duplicate global controls detected.', {
        owner: GLOBAL_CONTROL_SURFACE.owner,
        surfaceId: registration.surfaceId,
        duplicateControls,
        activeSurfaces: [...activeSurfaces.values()],
      });
    }
  }

  return () => {
    activeSurfaces.delete(registration.surfaceId);
  };
}

export function getActiveControlSurfaces(): ControlSurfaceRegistration[] {
  return [...activeSurfaces.values()];
}

export function assertSingleControlSurface(surfaceId: string, controls: GlobalControlSurfaceKey[], route?: string): () => void {
  return registerControlSurface({ surfaceId, controls, route });
}
