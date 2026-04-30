import type { Crop, PropAsset } from '../types';
import { orderForRender, placementToRect } from './prop-math';

/**
 * Recompose `crop.canvas` from `crop.baseCanvas` plus enabled placements.
 * Updates `crop.url` for thumbnail rendering.
 */
export const recomposeCrop = (crop: Crop, props: ReadonlyArray<PropAsset>): void => {
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
  crop.url = crop.canvas.toDataURL('image/png');
};

export const recomposeAll = (
  crops: ReadonlyArray<Crop>,
  props: ReadonlyArray<PropAsset>,
): void => {
  for (const c of crops) recomposeCrop(c, props);
};
