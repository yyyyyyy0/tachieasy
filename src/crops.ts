import { $, setMsg } from './dom';
import { state, newId } from './state';
import { downloadBlob } from './util/download';
import { computeCropSourceRect } from './crops/crop-math';
import { recomposeCrop } from './props/prop-compose';
import { openPropEditor } from './props/prop-edit-modal';
import type { Crop } from './types';

export const applyCropToAll = (): void => {
  if (!state.images.length) {
    setMsg($('cropMsg'), 'err', '画像がありません');
    return;
  }
  state.crops.forEach((c) => {
    c.canvas.width = 0;
    c.canvas.height = 0;
    c.baseCanvas.width = 0;
    c.baseCanvas.height = 0;
  });
  state.crops = [];
  let count = 0;
  let skipped = 0;
  for (const it of state.images) {
    const r = computeCropSourceRect({ w: it.w, h: it.h }, state.roi, state.mode);
    if (!r) {
      skipped++;
      continue;
    }
    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = r.sw;
    baseCanvas.height = r.sh;
    const baseCtx = baseCanvas.getContext('2d');
    if (!baseCtx) {
      skipped++;
      continue;
    }
    baseCtx.drawImage(it.img, r.sx, r.sy, r.sw, r.sh, 0, 0, r.sw, r.sh);
    const canvas = document.createElement('canvas');
    canvas.width = r.sw;
    canvas.height = r.sh;
    const crop: Crop = {
      id: newId(),
      canvas,
      baseCanvas,
      url: '',
      srcId: it.id,
      name: it.name,
      placements: [],
    };
    recomposeCrop(crop, state.props);
    state.crops.push(crop);
    count++;
  }
  renderCropList();
  setMsg(
    $('cropMsg'),
    'ok-msg',
    `${count} 枚をトリミングしました${skipped ? `（${skipped} 枚は範囲外でスキップ）` : ''}`,
  );
};

export const renderCropList = (): void => {
  const list = $('cropList');
  list.innerHTML = '';
  state.crops.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = 'citem';
    el.draggable = true;
    el.dataset.id = c.id;
    el.innerHTML =
      `<img alt="" src="${c.url}">` +
      `<span class="idx">${i + 1}</span>` +
      `<button class="edit-props" type="button" data-tip="この画像に小物を配置" aria-label="小物編集">` +
      `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>` +
      `</button>`;
    const editBtn = el.querySelector<HTMLButtonElement>('.edit-props');
    editBtn?.addEventListener('click', (ev) => {
      ev.stopPropagation();
      openPropEditor(c.id);
    });
    el.addEventListener('dragstart', (e) => {
      el.classList.add('dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', c.id);
      }
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      el.classList.add('over');
    });
    el.addEventListener('dragleave', () => el.classList.remove('over'));
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('over');
      const fromId = e.dataTransfer?.getData('text/plain');
      if (!fromId || fromId === c.id) return;
      const fromIdx = state.crops.findIndex((x) => x.id === fromId);
      const toIdx = state.crops.findIndex((x) => x.id === c.id);
      if (fromIdx < 0 || toIdx < 0) return;
      const [moved] = state.crops.splice(fromIdx, 1);
      if (!moved) return;
      state.crops.splice(toIdx, 0, moved);
      renderCropList();
    });
    list.appendChild(el);
  });
  $('cropCount').textContent = state.crops.length
    ? `${state.crops.length} 枚 · ドラッグで並び替え`
    : 'ドラッグで並び替え';
};

export const initCrops = (): void => {
  $('applyCrop').addEventListener('click', applyCropToAll);
  $('dlEach').addEventListener('click', async () => {
    if (!state.crops.length) return;
    for (let i = 0; i < state.crops.length; i++) {
      const c = state.crops[i];
      if (!c) continue;
      const blob = await new Promise<Blob | null>((r) =>
        c.canvas.toBlob((b) => r(b), 'image/png'),
      );
      if (!blob) continue;
      const base = (c.name || `crop_${i + 1}`).replace(/\.[^.]+$/, '');
      downloadBlob(blob, `${base}_crop.png`);
      await new Promise((r) => setTimeout(r, 80));
    }
  });
};
