import { describe, it, expect } from 'vitest';
import { computeCropSourceRect } from '../src/crops/crop-math';

describe('computeCropSourceRect', () => {
  it('computes ratio mode rect rounded to int and clamped to bounds', () => {
    const r = computeCropSourceRect({ w: 1000, h: 800 }, { x: 0.1, y: 0.2, w: 0.5, h: 0.6 }, 'ratio');
    expect(r).toEqual({ sx: 100, sy: 160, sw: 500, sh: 480 });
  });
  it('clamps abs mode to image bounds', () => {
    const r = computeCropSourceRect({ w: 100, h: 100 }, { x: 50, y: 50, w: 200, h: 200 }, 'abs');
    expect(r).toEqual({ sx: 50, sy: 50, sw: 50, sh: 50 });
  });
  it('returns null when out of bounds', () => {
    const r = computeCropSourceRect({ w: 100, h: 100 }, { x: 200, y: 200, w: 50, h: 50 }, 'abs');
    expect(r).toBe(null);
  });
  it('returns null for zero-size ratio', () => {
    const r = computeCropSourceRect({ w: 100, h: 100 }, { x: 0, y: 0, w: 0, h: 0 }, 'ratio');
    expect(r).toBe(null);
  });
});
