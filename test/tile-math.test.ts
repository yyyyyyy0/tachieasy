import { describe, it, expect } from 'vitest';
import { computeTileLayout, fitDrawRect } from '../src/tile/tile-math';

describe('computeTileLayout', () => {
  it('auto-rows when rows=0', () => {
    const layout = computeTileLayout({
      cropSizes: [
        { width: 100, height: 200 },
        { width: 100, height: 200 },
        { width: 100, height: 200 },
        { width: 100, height: 200 },
        { width: 100, height: 200 },
      ],
      cols: 2,
      rows: 0,
      gap: 10,
      pad: 5,
    });
    expect(layout.cols).toBe(2);
    expect(layout.rows).toBe(3);
    expect(layout.cellW).toBe(100);
    expect(layout.cellH).toBe(200);
    expect(layout.W).toBe(5 * 2 + 2 * 100 + 1 * 10);
    expect(layout.H).toBe(5 * 2 + 3 * 200 + 2 * 10);
    expect(layout.cells.length).toBe(5);
    expect(layout.cells[0]).toEqual({ x: 5, y: 5 });
    expect(layout.cells[2]).toEqual({ x: 5, y: 5 + 200 + 10 });
  });
  it('uses max cell size across crops', () => {
    const layout = computeTileLayout({
      cropSizes: [
        { width: 50, height: 30 },
        { width: 80, height: 40 },
      ],
      cols: 1,
      rows: 0,
      gap: 0,
      pad: 0,
    });
    expect(layout.cellW).toBe(80);
    expect(layout.cellH).toBe(40);
  });
  it('clamps cols/rows minimums', () => {
    const layout = computeTileLayout({
      cropSizes: [{ width: 10, height: 10 }],
      cols: 0,
      rows: 0,
      gap: 0,
      pad: 0,
    });
    expect(layout.cols).toBe(1);
    expect(layout.rows).toBe(1);
  });
});

describe('fitDrawRect', () => {
  it('fit centers without overflow when src is wider', () => {
    const r = fitDrawRect(200, 100, 100, 100, 'fit');
    expect(r.dw).toBe(100);
    expect(r.dh).toBe(50);
    expect(r.dx).toBe(0);
    expect(r.dy).toBe(25);
    expect(r.clip).toBe(false);
  });
  it('fit centers without overflow when src is taller', () => {
    const r = fitDrawRect(100, 200, 100, 100, 'fit');
    expect(r.dw).toBe(50);
    expect(r.dh).toBe(100);
    expect(r.dx).toBe(25);
    expect(r.dy).toBe(0);
  });
  it('cover overflows and signals clipping', () => {
    const r = fitDrawRect(200, 100, 100, 100, 'cover');
    expect(r.dh).toBe(100);
    expect(r.dw).toBe(200);
    expect(r.dx).toBe(-50);
    expect(r.clip).toBe(true);
  });
});
