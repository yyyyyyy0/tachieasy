import type { Crop, PropAsset } from '../types';
import { orderForRender, placementToRect } from './prop-math';

export interface RecomposeOptions {
  /**
   * When true (default), refresh `crop.url` via `toDataURL` so the thumbnail
   * reflects the new pixels. PNG encoding per frame is expensive — pass false
   * during interactive drag/resize and re-run with the default on commit.
   */
  updateUrl?: boolean;
}

/**
 * Recompose `crop.canvas` from `crop.baseCanvas` plus enabled placements.
 */
export const recomposeCrop = (
  crop: Crop,
  props: ReadonlyArray<PropAsset>,
  options: RecomposeOptions = {},
): void => {
  const { updateUrl = true } = options;
  const w = crop.baseCanvas.width;
  const h = crop.baseCanvas.height;
  if (crop.canvas.width !== w) crop.canvas.width = w;
  if (crop.canvas.height !== h) crop.canvas.height = h;
  const ctx = crop.canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(crop.baseCanvas, 0, 0);
  const propsById = new Map(props.map((p) => [p.id, p] as const));
  for (const placement of orderForRender(crop.placements)) {
    const prop = propsById.get(placement.propId);
    if (!prop) continue;
    const r = placementToRect(placement, prop, w, h);
    ctx.drawImage(prop.img, r.x, r.y, r.w, r.h);
  }
  if (updateUrl) crop.url = crop.canvas.toDataURL('image/png');
};

export const recomposeAll = (
  crops: ReadonlyArray<Crop>,
  props: ReadonlyArray<PropAsset>,
  options: RecomposeOptions = {},
): void => {
  for (const c of crops) recomposeCrop(c, props, options);
};
