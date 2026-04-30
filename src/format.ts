import { $ } from './dom';
import { state } from './state';
import { normalizeHex } from './util/color';

export const isBgTransparent = (): boolean => $<HTMLInputElement>('bgTransparent').checked;
export const getBgColor = (): string => $<HTMLInputElement>('bgColor').value;

const setBgEnabled = (enabled: boolean): void => {
  $<HTMLInputElement>('bgColor').disabled = !enabled;
  $<HTMLInputElement>('bgHex').disabled = !enabled;
};

const applyFmt = (): void => {
  const isJpg = state.fmt === 'jpg';
  $('fmtPng').classList.toggle('on', !isJpg);
  $('fmtJpg').classList.toggle('on', isJpg);
  $<HTMLInputElement>('quality').disabled = !isJpg;
  if (isJpg) {
    const bgChk = $<HTMLInputElement>('bgTransparent');
    if (bgChk.checked) {
      bgChk.checked = false;
      setBgEnabled(true);
    }
    $('fmtNote').textContent =
      'JPEG モード: 透過不可。背景色が必須のため自動で透過 OFF にしました。品質スライダ有効。';
  } else {
    $('fmtNote').textContent = 'PNG モード: 透過対応 / 品質パラメータは無視されます。';
  }
};

export const initFormat = (): void => {
  const bgChk = $<HTMLInputElement>('bgTransparent');
  const bgCol = $<HTMLInputElement>('bgColor');
  const bgHex = $<HTMLInputElement>('bgHex');

  bgChk.addEventListener('change', () => {
    setBgEnabled(!bgChk.checked);
    if (state.fmt === 'jpg' && bgChk.checked) {
      bgChk.checked = false;
      setBgEnabled(true);
    }
  });
  bgCol.addEventListener('input', () => {
    bgHex.value = bgCol.value.toLowerCase();
  });
  bgHex.addEventListener('input', () => {
    const v = normalizeHex(bgHex.value);
    if (v) bgCol.value = v;
  });

  $('fmtPng').addEventListener('click', () => {
    state.fmt = 'png';
    applyFmt();
  });
  $('fmtJpg').addEventListener('click', () => {
    state.fmt = 'jpg';
    applyFmt();
  });
  $('fitFit').addEventListener('click', () => {
    state.fit = 'fit';
    $('fitFit').classList.add('on');
    $('fitCover').classList.remove('on');
  });
  $('fitCover').addEventListener('click', () => {
    state.fit = 'cover';
    $('fitCover').classList.add('on');
    $('fitFit').classList.remove('on');
  });
  $<HTMLInputElement>('quality').addEventListener('input', () => {
    const q = $<HTMLInputElement>('quality');
    state.quality = +q.value / 100;
    $('qualityVal').textContent = q.value;
  });
};
