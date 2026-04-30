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

export interface Crop {
  id: string;
  canvas: HTMLCanvasElement;
  url: string;
  srcId: string;
  name: string;
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
