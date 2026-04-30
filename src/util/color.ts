export const isHex = (s: string): boolean => /^#[0-9a-fA-F]{6}$/.test(s);

export const normalizeHex = (input: string): string | null => {
  let s = (input ?? '').trim();
  if (!s.startsWith('#')) s = '#' + s;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    s = '#' + s.slice(1).split('').map((c) => c + c).join('');
  }
  return isHex(s) ? s.toLowerCase() : null;
};
