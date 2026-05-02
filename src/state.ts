import type { ImageItem, Roi, Mode, Crop, Fmt, Fit } from './types';

export interface AppState {
  images: ImageItem[];
  refId: string | null;
  roi: Roi;
  mode: Mode;
  aspect: number | null;
  aspectLock: boolean;
  crops: Crop[];
  fmt: Fmt;
  fit: Fit;
  quality: number;
  nextId: number;
}

export const state: AppState = {
  images: [],
  refId: null,
  roi: { x: 0.1, y: 0.05, w: 0.8, h: 0.6 },
  mode: 'ratio',
  aspect: null,
  aspectLock: false,
  crops: [],
  fmt: 'png',
  fit: 'fit',
  quality: 0.92,
  nextId: 1,
};

export const newId = (): string => 'i' + state.nextId++;

export const LS = { THEME: 'tachieasy.theme' } as const;
