import type { Fit } from '../types';

export interface TileLayoutInput {
  cropSizes: ReadonlyArray<{ width: number; height: number }>;
  cols: number;
  rows: number; // 0 = auto
  gap: number;
  pad: number;
}

export interface TileLayout {
  W: number;
  H: number;
  cellW: number;
  cellH: number;
  cols: number;
  rows: number;
  cells: ReadonlyArray<{ x: number; y: number }>;
}

export const computeTileLayout = ({
  cropSizes,
  cols,
  rows,
  gap,
  pad,
}: TileLayoutInput): TileLayout => {
  const n = cropSizes.length;
  const c = Math.max(1, cols);
  const r = rows === 0 ? Math.ceil(n / c) : Math.max(1, rows);
  let cellW = 0;
  let cellH = 0;
  for (const s of cropSizes) {
    if (s.width > cellW) cellW = s.width;
    if (s.height > cellH) cellH = s.height;
  }
  const W = pad * 2 + c * cellW + (c - 1) * gap;
  const H = pad * 2 + r * cellH + (r - 1) * gap;
  const cells: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const ri = Math.floor(i / c);
    const ci = i % c;
    cells.push({
      x: pad + ci * (cellW + gap),
      y: pad + ri * (cellH + gap),
    });
  }
  return { W, H, cellW, cellH, cols: c, rows: r, cells };
};

export interface FitDrawRect {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  /** True when the source overflows the cell (caller must clip). */
  clip: boolean;
}

export const fitDrawRect = (
  srcW: number,
  srcH: number,
  cellW: number,
  cellH: number,
  fit: Fit,
): FitDrawRect => {
  const sR = srcW / srcH;
  const cR = cellW / cellH;
  let dw: number, dh: number;
  if (fit === 'cover') {
    if (sR > cR) { dh = cellH; dw = dh * sR; }
    else        { dw = cellW; dh = dw / sR; }
  } else {
    if (sR > cR) { dw = cellW; dh = dw / sR; }
    else        { dh = cellH; dw = dh * sR; }
  }
  return {
    dx: (cellW - dw) / 2,
    dy: (cellH - dh) / 2,
    dw,
    dh,
    clip: fit === 'cover',
  };
};
