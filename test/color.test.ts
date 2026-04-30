import { describe, it, expect } from 'vitest';
import { isHex, normalizeHex } from '../src/util/color';

describe('isHex', () => {
  it('matches 6-digit hex', () => {
    expect(isHex('#abcdef')).toBe(true);
    expect(isHex('#ABCDEF')).toBe(true);
    expect(isHex('#012345')).toBe(true);
  });
  it('rejects shorthand and missing hash', () => {
    expect(isHex('#abc')).toBe(false);
    expect(isHex('abcdef')).toBe(false);
    expect(isHex('#abcde')).toBe(false);
    expect(isHex('#abcdefg')).toBe(false);
    expect(isHex('')).toBe(false);
  });
});

describe('normalizeHex', () => {
  it('expands 3-digit shorthand', () => {
    expect(normalizeHex('#abc')).toBe('#aabbcc');
    expect(normalizeHex('#FFF')).toBe('#ffffff');
    expect(normalizeHex('abc')).toBe('#aabbcc');
  });
  it('preserves and lowercases full 6-digit hex', () => {
    expect(normalizeHex('#ABCDEF')).toBe('#abcdef');
    expect(normalizeHex('012345')).toBe('#012345');
  });
  it('returns null for invalid', () => {
    expect(normalizeHex('zzz')).toBe(null);
    expect(normalizeHex('#12')).toBe(null);
    expect(normalizeHex('rgba(0,0,0,0)')).toBe(null);
  });
  it('trims whitespace', () => {
    expect(normalizeHex('  #aabbcc  ')).toBe('#aabbcc');
  });
});
