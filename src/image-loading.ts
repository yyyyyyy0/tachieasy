import { $ } from './dom';
import { state, newId } from './state';
import type { ImageItem } from './types';

export interface ImageLoadingDeps {
  setRef: (id: string) => void;
  drawStage: () => void;
  updateRoiUI: () => void;
  renderCropList: () => void;
}

export const initImageLoading = (deps: ImageLoadingDeps): void => {
  const fileInput = $<HTMLInputElement>('file');
  fileInput.addEventListener('change', async (e) => {
    const target = e.target as HTMLInputElement;
    const files = Array.from(target.files ?? []);
    for (const f of files) await addFile(f);
    target.value = '';
    renderImgList(deps);
    if (!state.refId && state.images.length) {
      const first = state.images[0];
      if (first) deps.setRef(first.id);
    }
    deps.drawStage();
    deps.updateRoiUI();
  });

  $('clearAll').addEventListener('click', () => {
    if (!state.images.length && !state.crops.length) return;
    if (!window.confirm('読み込み済み画像とトリミング結果を全消去します。よろしいですか？')) return;
    state.images.forEach((i) => URL.revokeObjectURL(i.thumbUrl));
    state.images = [];
    state.refId = null;
    state.crops.forEach((c) => {
      c.canvas.width = 0;
      c.canvas.height = 0;
    });
    state.crops = [];
    renderImgList(deps);
    deps.renderCropList();
    deps.drawStage();
    deps.updateRoiUI();
  });
};

const addFile = (file: File): Promise<void> =>
  new Promise<void>((res) => {
    if (!file.type.startsWith('image/')) return res();
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const item: ImageItem = {
        id: newId(),
        file,
        img,
        name: file.name,
        w: img.naturalWidth,
        h: img.naturalHeight,
        thumbUrl: url,
      };
      state.images.push(item);
      res();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      res();
    };
    img.src = url;
  });

export const renderImgList = (deps: ImageLoadingDeps): void => {
  const list = $('imgList');
  list.replaceChildren();
  state.images.forEach((it) => {
    const el = document.createElement('div');
    el.className = 'item' + (it.id === state.refId ? ' ref' : '');

    const img = document.createElement('img');
    img.alt = '';
    img.src = it.thumbUrl;

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = it.name;

    const x = document.createElement('button');
    x.className = 'x';
    x.textContent = '×';
    x.setAttribute('aria-label', '除外');
    x.addEventListener('click', (ev) => {
      ev.stopPropagation();
      URL.revokeObjectURL(it.thumbUrl);
      state.images = state.images.filter((i) => i.id !== it.id);
      if (state.refId === it.id) {
        state.refId = state.images[0]?.id ?? null;
      }
      renderImgList(deps);
      deps.drawStage();
      deps.updateRoiUI();
    });

    el.appendChild(img);
    el.appendChild(name);
    el.appendChild(x);
    el.addEventListener('click', () => deps.setRef(it.id));
    list.appendChild(el);
  });
  const refName = state.images.find((i) => i.id === state.refId)?.name ?? '-';
  $('imgInfo').textContent = state.images.length
    ? `${state.images.length} 枚 / 参照: ${refName}`
    : '';
};
