import { describe, it, expect } from 'vitest';
import {
  defaultPlacement,
  hitTestPlacement,
  movePlacement,
  orderForRender,
  placementToRect,
  renumberZ,
  resizePlacementFromCorner,
} from '../src/props/prop-math';
import type { PropPlacement } from '../src/types';

const place = (over: Partial<PropPlacement> = {}): PropPlacement => ({
  propId: 'p1',
  enabled: true,
  xRel: 0.5,
  yRel: 0.5,
  scaleRel: 0.4,
  z: 1,
  ...over,
});

describe('placementToRect', () => {
  it('centers and uses prop aspect for height', () => {
    const r = placementToRect(place(), { w: 200, h: 100 }, 1000, 1000);
    // scaleRel=0.4 -> w=400, aspect=2 -> h=200
    expect(r.w).toBe(400);
    expect(r.h).toBe(200);
    expect(r.x).toBe(500 - 200);
    expect(r.y).toBe(500 - 100);
  });
});

describe('hitTestPlacement', () => {
  const props = new Map([['p1', { w: 100, h: 100 }], ['p2', { w: 100, h: 100 }]]);
  it('returns topmost hit', () => {
    const placements = [
      place({ propId: 'p1', xRel: 0.5, yRel: 0.5, scaleRel: 0.4, z: 1 }),
      place({ propId: 'p2', xRel: 0.5, yRel: 0.5, scaleRel: 0.3, z: 5 }),
    ];
    expect(hitTestPlacement({ x: 500, y: 500 }, placements, props, 1000, 1000)).toBe(1);
  });
  it('skips disabled', () => {
    const placements = [
      place({ propId: 'p1', xRel: 0.5, yRel: 0.5, scaleRel: 0.4, z: 1 }),
      place({ propId: 'p2', enabled: false, xRel: 0.5, yRel: 0.5, scaleRel: 0.3, z: 5 }),
    ];
    expect(hitTestPlacement({ x: 500, y: 500 }, placements, props, 1000, 1000)).toBe(0);
  });
  it('returns -1 outside', () => {
    const placements = [place({ scaleRel: 0.1 })];
    expect(hitTestPlacement({ x: 0, y: 0 }, placements, props, 1000, 1000)).toBe(-1);
  });
});

describe('movePlacement', () => {
  it('moves and clamps to [0..1]', () => {
    const p = place({ xRel: 0.5, yRel: 0.5 });
    const moved = movePlacement(p, 100, 100, 1000, 1000);
    expect(moved.xRel).toBeCloseTo(0.6);
    expect(moved.yRel).toBeCloseTo(0.6);
    const off = movePlacement(p, 1e6, 1e6, 1000, 1000);
    expect(off.xRel).toBe(1);
    expect(off.yRel).toBe(1);
  });
});

describe('resizePlacementFromCorner', () => {
  it('keeps center fixed and computes scale from farther axis', () => {
    const p = place({ xRel: 0.5, yRel: 0.5, scaleRel: 0.2 });
    const out = resizePlacementFromCorner(p, 'se', { x: 700, y: 600 }, { w: 100, h: 100 }, 1000, 1000);
    // halfWFromX = 200, halfHFromY = 100 -> halfH * aspect(1) = 100. Max = 200. scale = 400/1000 = 0.4
    expect(out.scaleRel).toBeCloseTo(0.4);
    expect(out.xRel).toBe(p.xRel);
    expect(out.yRel).toBe(p.yRel);
  });
});

describe('orderForRender', () => {
  it('keeps enabled and sorts ascending z', () => {
    const ps = [
      place({ z: 3 }),
      place({ z: 1, enabled: false }),
      place({ z: 2 }),
    ];
    const sorted = orderForRender(ps);
    expect(sorted.map((p) => p.z)).toEqual([2, 3]);
  });
});

describe('renumberZ', () => {
  it('renumbers to 1..N preserving input order', () => {
    const ps = [place({ z: 5 }), place({ z: 7 }), place({ z: 9 })];
    const out = renumberZ(ps);
    expect(out.map((p) => p.z)).toEqual([1, 2, 3]);
  });
});

describe('defaultPlacement', () => {
  it('places centered and assigns max z + 1', () => {
    const ps = [place({ z: 4 }), place({ z: 7 })];
    const np = defaultPlacement('p2', ps);
    expect(np.xRel).toBe(0.5);
    expect(np.yRel).toBe(0.5);
    expect(np.z).toBe(8);
    expect(np.enabled).toBe(true);
  });
});
