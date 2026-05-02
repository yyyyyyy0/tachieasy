import { describe, it, expect } from 'vitest';
import {
  computeDispMeta,
  roiToDispRect,
  dispRectToRoi,
  applyAspectToDispRect,
  reshapeRoiToAspect,
} from '../src/roi/roi-math';

describe('computeDispMeta', () => {
  it('letterboxes wider container', () => {
    const m = computeDispMeta(800, 400, 200, 200); // square ref in 2:1 container
    expect(m.scale).toBe(2);
    expect(m.dispW).toBe(400);
    expect(m.dispH).toBe(400);
    expect(m.offX).toBe(200);
    expect(m.offY).toBe(0);
  });
  it('pillarboxes taller container', () => {
    const m = computeDispMeta(400, 800, 200, 200);
    expect(m.dispW).toBe(400);
    expect(m.dispH).toBe(400);
    expect(m.offX).toBe(0);
    expect(m.offY).toBe(200);
  });
});

describe('roiToDispRect / dispRectToRoi', () => {
  const m = computeDispMeta(400, 400, 1000, 1000);
  it('round-trips ratio-mode ROI', () => {
    const roi = { x: 0.1, y: 0.2, w: 0.5, h: 0.6 };
    const disp = roiToDispRect(roi, 'ratio', m);
    const back = dispRectToRoi(disp, 'ratio', m);
    expect(back.x).toBeCloseTo(roi.x, 6);
    expect(back.y).toBeCloseTo(roi.y, 6);
    expect(back.w).toBeCloseTo(roi.w, 6);
    expect(back.h).toBeCloseTo(roi.h, 6);
  });
  it('rounds abs-mode round trip to integers', () => {
    const roi = { x: 100, y: 200, w: 500, h: 600 };
    const disp = roiToDispRect(roi, 'abs', m);
    const back = dispRectToRoi(disp, 'abs', m);
    expect(back).toEqual(roi);
  });
});

describe('applyAspectToDispRect', () => {
  it('keeps SE drag clamped to container with aspect 1', () => {
    const r0 = { x: 0, y: 0, w: 10, h: 10 };
    const out = applyAspectToDispRect('se', 0, 0, 100, 50, r0, 1, 80, 80);
    expect(out.x).toBeCloseTo(0);
    expect(out.y).toBeCloseTo(0);
    expect(out.w).toBeCloseTo(80);
    expect(out.h).toBeCloseTo(80);
  });
  it('horizontal-only resize sets h from w with aspect 2', () => {
    const r0 = { x: 0, y: 0, w: 40, h: 20 };
    const out = applyAspectToDispRect('e', 0, 0, 60, 20, r0, 2, 1000, 1000);
    expect(out.w).toBeCloseTo(60);
    expect(out.h).toBeCloseTo(30);
  });
  it('returns input rect for handle "move"', () => {
    const r0 = { x: 0, y: 0, w: 10, h: 10 };
    const out = applyAspectToDispRect('move', 5, 5, 10, 10, r0, 1, 100, 100);
    expect(out).toEqual({ x: 5, y: 5, w: 10, h: 10 });
  });
});

describe('reshapeRoiToAspect', () => {
  it('keeps center fixed and matches aspect (ratio mode)', () => {
    const roi = { x: 0.1, y: 0.1, w: 0.6, h: 0.4 };
    const out = reshapeRoiToAspect(roi, 'ratio', 1000, 1000, 1);
    const cx0 = roi.x + roi.w / 2;
    const cy0 = roi.y + roi.h / 2;
    const cx = out.x + out.w / 2;
    const cy = out.y + out.h / 2;
    expect(cx).toBeCloseTo(cx0, 6);
    expect(cy).toBeCloseTo(cy0, 6);
    expect(out.w / out.h).toBeCloseTo(1, 6);
  });
  it('clamps to image bounds (abs mode)', () => {
    const roi = { x: 800, y: 800, w: 400, h: 400 };
    const out = reshapeRoiToAspect(roi, 'abs', 1000, 1000, 1);
    expect(out.x + out.w).toBeLessThanOrEqual(1000);
    expect(out.y + out.h).toBeLessThanOrEqual(1000);
    expect(out.x).toBeGreaterThanOrEqual(0);
    expect(out.y).toBeGreaterThanOrEqual(0);
  });
});
