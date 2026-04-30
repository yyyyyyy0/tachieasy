import type { ImageItem, Mode, Roi } from '../types';

export interface CropSourceRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/**
 * Returns the integer source rectangle to be passed to drawImage when applying ROI to an image.
 * Returns null when the resulting rectangle has zero size (out of bounds).
 */
export const computeCropSourceRect = (
  item: { w: number; h: number },
  roi: Roi,
  mode: Mode,
): CropSourceRect | null => {
  let sx: number, sy: number, sw: number, sh: number;
  if (mode === 'ratio') {
    sx = roi.x * item.w; sy = roi.y * item.h;
    sw = roi.w * item.w; sh = roi.h * item.h;
  } else {
    sx = roi.x; sy = roi.y; sw = roi.w; sh = roi.h;
  }
  sx = Math.max(0, Math.round(sx));
  sy = Math.max(0, Math.round(sy));
  sw = Math.min(item.w - sx, Math.round(sw));
  sh = Math.min(item.h - sy, Math.round(sh));
  if (sw < 1 || sh < 1) return null;
  return { sx, sy, sw, sh };
};

export type { ImageItem };
