import type { DispMeta, Mode, Roi, RoiHandle } from '../types';

export const computeDispMeta = (
  containerW: number,
  containerH: number,
  refW: number,
  refH: number,
): DispMeta => {
  const scale = Math.min(containerW / refW, containerH / refH);
  const dispW = refW * scale;
  const dispH = refH * scale;
  const offX = (containerW - dispW) / 2;
  const offY = (containerH - dispH) / 2;
  return { scale, dispW, dispH, offX, offY, refW, refH };
};

export interface DispRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const roiToDispRect = (roi: Roi, mode: Mode, m: DispMeta): DispRect => {
  if (mode === 'ratio') {
    return { x: roi.x * m.dispW, y: roi.y * m.dispH, w: roi.w * m.dispW, h: roi.h * m.dispH };
  }
  const sx = m.dispW / m.refW;
  const sy = m.dispH / m.refH;
  return { x: roi.x * sx, y: roi.y * sy, w: roi.w * sx, h: roi.h * sy };
};

export const dispRectToRoi = (rect: DispRect, mode: Mode, m: DispMeta): Roi => {
  if (mode === 'ratio') {
    return {
      x: rect.x / m.dispW,
      y: rect.y / m.dispH,
      w: rect.w / m.dispW,
      h: rect.h / m.dispH,
    };
  }
  const sx = m.refW / m.dispW;
  const sy = m.refH / m.dispH;
  return {
    x: Math.round(rect.x * sx),
    y: Math.round(rect.y * sy),
    w: Math.round(rect.w * sx),
    h: Math.round(rect.h * sy),
  };
};

/**
 * Apply aspect ratio to a dragged display-space rectangle.
 * `aspect` is width/height of the visual aspect ratio (after image-ratio compensation if mode === 'ratio').
 */
export const applyAspectToDispRect = (
  handle: RoiHandle | 'move',
  x: number,
  y: number,
  w: number,
  h: number,
  r0: DispRect,
  aspect: number,
  dispW: number,
  dispH: number,
): DispRect => {
  let fx: number;
  let fy: number;
  switch (handle) {
    case 'nw': fx = r0.x + r0.w; fy = r0.y + r0.h; break;
    case 'ne': fx = r0.x;         fy = r0.y + r0.h; break;
    case 'sw': fx = r0.x + r0.w; fy = r0.y;         break;
    case 'se': fx = r0.x;         fy = r0.y;         break;
    case 'n':  fx = r0.x + r0.w / 2; fy = r0.y + r0.h; break;
    case 's':  fx = r0.x + r0.w / 2; fy = r0.y;         break;
    case 'w':  fx = r0.x + r0.w;     fy = r0.y + r0.h / 2; break;
    case 'e':  fx = r0.x;             fy = r0.y + r0.h / 2; break;
    default:   return { x, y, w, h };
  }
  if (handle === 'n' || handle === 's') w = h * aspect;
  else if (handle === 'w' || handle === 'e') h = w / aspect;
  else {
    const wH = h * aspect;
    if (wH >= w) w = wH;
    else h = w / aspect;
  }
  switch (handle) {
    case 'nw': x = fx - w;     y = fy - h;     break;
    case 'ne': x = fx;         y = fy - h;     break;
    case 'sw': x = fx - w;     y = fy;         break;
    case 'se': x = fx;         y = fy;         break;
    case 'n':  x = fx - w / 2; y = fy - h;     break;
    case 's':  x = fx - w / 2; y = fy;         break;
    case 'w':  x = fx - w;     y = fy - h / 2; break;
    case 'e':  x = fx;         y = fy - h / 2; break;
  }
  if (w > dispW) { w = dispW; h = w / aspect; }
  if (h > dispH) { h = dispH; w = h * aspect; }
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x + w > dispW) x = dispW - w;
  if (y + h > dispH) y = dispH - h;
  return { x, y, w, h };
};

/**
 * Reshape an ROI in image coordinates to match the requested aspect, keeping the center fixed.
 */
export const reshapeRoiToAspect = (
  roi: Roi,
  mode: Mode,
  imgW: number,
  imgH: number,
  aspect: number,
): Roi => {
  let xPx: number, yPx: number, wPx: number, hPx: number;
  if (mode === 'ratio') {
    xPx = roi.x * imgW; yPx = roi.y * imgH;
    wPx = roi.w * imgW; hPx = roi.h * imgH;
  } else {
    xPx = roi.x; yPx = roi.y; wPx = roi.w; hPx = roi.h;
  }
  const cx = xPx + wPx / 2;
  const cy = yPx + hPx / 2;
  let nw = wPx;
  let nh = wPx / aspect;
  if (nh > hPx) { nh = hPx; nw = nh * aspect; }
  nw = Math.min(nw, imgW); nh = Math.min(nh, imgH);
  if (nw / nh > aspect) nw = nh * aspect;
  else nh = nw / aspect;
  let nx = cx - nw / 2;
  let ny = cy - nh / 2;
  nx = Math.max(0, Math.min(imgW - nw, nx));
  ny = Math.max(0, Math.min(imgH - nh, ny));
  if (mode === 'ratio') {
    return { x: nx / imgW, y: ny / imgH, w: nw / imgW, h: nh / imgH };
  }
  return { x: Math.round(nx), y: Math.round(ny), w: Math.round(nw), h: Math.round(nh) };
};
