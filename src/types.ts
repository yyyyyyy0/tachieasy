export interface ImageItem {
  id: string;
  file: File;
  img: HTMLImageElement;
  name: string;
  w: number;
  h: number;
  thumbUrl: string;
}

export interface Roi {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Mode = 'ratio' | 'abs';
export type Fmt = 'png' | 'jpg';
export type Fit = 'fit' | 'cover';

export interface PropAsset {
  id: string;
  name: string;
  img: HTMLImageElement;
  thumbUrl: string;
  w: number;
  h: number;
}

export interface PropPlacement {
  propId: string;
  enabled: boolean;
  /** Center x in [0..1], relative to crop width */
  xRel: number;
  /** Center y in [0..1], relative to crop height */
  yRel: number;
  /** Drawn width / crop width */
  scaleRel: number;
  /** Stacking order. Larger = on top. */
  z: number;
}

export interface Crop {
  id: string;
  /** Composed canvas (base + enabled placements). Used by DL/tile pipeline. */
  canvas: HTMLCanvasElement;
  /** Original crop without props. Source for recomposition. */
  baseCanvas: HTMLCanvasElement;
  url: string;
  srcId: string;
  name: string;
  placements: PropPlacement[];
}

export interface DispMeta {
  scale: number;
  dispW: number;
  dispH: number;
  offX: number;
  offY: number;
  refW: number;
  refH: number;
}

export type RoiHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e';
