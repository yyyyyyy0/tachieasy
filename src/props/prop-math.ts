import type { PropAsset, PropPlacement } from '../types';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Corner = 'nw' | 'ne' | 'sw' | 'se';

export const MIN_SCALE_REL = 0.02;
export const MAX_SCALE_REL = 4;

const propAspect = (prop: { w: number; h: number }): number => prop.w / prop.h;

/**
 * Convert a placement to a pixel rectangle within the crop canvas.
 * Width is `scaleRel * cropW`; height keeps the prop's intrinsic aspect.
 * Position is centered on (xRel * cropW, yRel * cropH).
 */
export const placementToRect = (
  p: PropPlacement,
  prop: { w: number; h: number },
  cropW: number,
  cropH: number,
): Rect => {
  const w = p.scaleRel * cropW;
  const h = w / propAspect(prop);
  const x = p.xRel * cropW - w / 2;
  const y = p.yRel * cropH - h / 2;
  return { x, y, w, h };
};

/**
 * Hit-test placements topmost-first (by z desc). Returns the index of the placement
 * whose rect contains the point, or -1.
 * Disabled placements are ignored.
 */
export const hitTestPlacement = (
  point: { x: number; y: number },
  placements: ReadonlyArray<PropPlacement>,
  propsById: ReadonlyMap<string, { w: number; h: number }>,
  cropW: number,
  cropH: number,
): number => {
  const indexed = placements
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.enabled)
    .sort((a, b) => b.p.z - a.p.z);
  for (const { p, i } of indexed) {
    const prop = propsById.get(p.propId);
    if (!prop) continue;
    const r = placementToRect(p, prop, cropW, cropH);
    if (point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h) {
      return i;
    }
  }
  return -1;
};

/**
 * Move a placement by (dx, dy) in crop pixels. Center is clamped to [0..1] in rel space.
 */
export const movePlacement = (
  p: PropPlacement,
  dx: number,
  dy: number,
  cropW: number,
  cropH: number,
): PropPlacement => {
  const xRel = clamp01(p.xRel + dx / cropW);
  const yRel = clamp01(p.yRel + dy / cropH);
  return { ...p, xRel, yRel };
};

/**
 * Resize a placement by dragging a corner toward `point` (crop-pixel coords).
 * Keeps the center fixed (the corner moves symmetrically about the center).
 * Returns a new placement with `scaleRel` adjusted; aspect is preserved by virtue
 * of how `placementToRect` derives height from width.
 */
export const resizePlacementFromCorner = (
  p: PropPlacement,
  corner: Corner,
  point: { x: number; y: number },
  prop: { w: number; h: number },
  cropW: number,
  cropH: number,
): PropPlacement => {
  const cx = p.xRel * cropW;
  const cy = p.yRel * cropH;
  const aspect = propAspect(prop);
  const halfWFromX = Math.abs(point.x - cx);
  const halfHFromY = Math.abs(point.y - cy);
  const halfWFromH = halfHFromY * aspect;
  const halfW = Math.max(halfWFromX, halfWFromH);
  // If the corner crosses the opposite axis we still want a positive size; halfW handles that.
  let scaleRel = (halfW * 2) / cropW;
  scaleRel = clamp(scaleRel, MIN_SCALE_REL, MAX_SCALE_REL);
  // Suppress unused-corner lint: corner currently only differentiates UI hit area, math is symmetric.
  void corner;
  return { ...p, scaleRel };
};

/**
 * Build a default placement for a freshly-added prop, centered with a sane initial scale.
 */
export const defaultPlacement = (
  propId: string,
  existing: ReadonlyArray<PropPlacement>,
): PropPlacement => {
  const maxZ = existing.reduce((m, p) => (p.z > m ? p.z : m), 0);
  return {
    propId,
    enabled: true,
    xRel: 0.5,
    yRel: 0.5,
    scaleRel: 0.3,
    z: maxZ + 1,
  };
};

/**
 * Renumber z values to a stable 1..N sequence based on input order.
 * Input is treated as bottom→top.
 */
export const renumberZ = (placements: ReadonlyArray<PropPlacement>): PropPlacement[] =>
  placements.map((p, i) => ({ ...p, z: i + 1 }));

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/**
 * Pure z-ordering helper: returns enabled placements sorted bottom→top.
 * Useful for both the renderer and tests.
 */
export const orderForRender = (
  placements: ReadonlyArray<PropPlacement>,
): PropPlacement[] =>
  placements.filter((p) => p.enabled).slice().sort((a, b) => a.z - b.z);

export type { PropAsset };
