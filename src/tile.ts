import { $, setMsg } from './dom';
import { state } from './state';
import { downloadBlob } from './util/download';
import { computeTileLayout, fitDrawRect } from './tile/tile-math';
import { getBgColor, isBgTransparent } from './format';

const MAX_DIM = 16384;

const drawIntoCell = (
  ctx: CanvasRenderingContext2D,
  src: HTMLCanvasElement,
  x: number,
  y: number,
  cellW: number,
  cellH: number,
  fit: 'fit' | 'cover',
): void => {
  const rect = fitDrawRect(src.width, src.height, cellW, cellH, fit);
  const dx = x + rect.dx;
  const dy = y + rect.dy;
  if (rect.clip) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, cellW, cellH);
    ctx.clip();
    ctx.drawImage(src, dx, dy, rect.dw, rect.dh);
    ctx.restore();
  } else {
    ctx.drawImage(src, dx, dy, rect.dw, rect.dh);
  }
};

export const initTile = (): void => {
  let lastTileBlob: Blob | null = null;

  $('renderTile').addEventListener('click', async () => {
    lastTileBlob = null;
    $<HTMLButtonElement>('dlTile').disabled = true;
    if (!state.crops.length) {
      setMsg($('tileInfo'), 'err', '先にトリミングしてください');
      return;
    }
    const cols = Math.max(1, +$<HTMLInputElement>('cols').value || 1);
    const rowsInput = Math.max(0, +$<HTMLInputElement>('rows').value || 0);
    const gap = Math.max(0, +$<HTMLInputElement>('gap').value || 0);
    const pad = Math.max(0, +$<HTMLInputElement>('pad').value || 0);

    const layout = computeTileLayout({
      cropSizes: state.crops.map((c) => ({ width: c.canvas.width, height: c.canvas.height })),
      cols,
      rows: rowsInput,
      gap,
      pad,
    });

    if (layout.W > MAX_DIM || layout.H > MAX_DIM) {
      setMsg(
        $('tileInfo'),
        'err',
        `出力サイズ ${layout.W}×${layout.H} が上限 ${MAX_DIM} を超えます。`,
      );
      return;
    }

    const canvas = $<HTMLCanvasElement>('preview');
    canvas.width = layout.W;
    canvas.height = layout.H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, layout.W, layout.H);
    if (!isBgTransparent()) {
      ctx.fillStyle = getBgColor();
      ctx.fillRect(0, 0, layout.W, layout.H);
    }
    state.crops.forEach((c, i) => {
      const cell = layout.cells[i];
      if (!cell) return;
      drawIntoCell(ctx, c.canvas, cell.x, cell.y, layout.cellW, layout.cellH, state.fit);
    });

    const mime = state.fmt === 'jpg' ? 'image/jpeg' : 'image/png';
    const q = state.fmt === 'jpg' ? state.quality : undefined;
    lastTileBlob = await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), mime, q),
    );
    $<HTMLButtonElement>('dlTile').disabled = !lastTileBlob;
    const kb = lastTileBlob ? Math.round(lastTileBlob.size / 102.4) / 10 : 0;
    setMsg(
      $('tileInfo'),
      'ok-msg',
      `${layout.W}×${layout.H} / ${layout.cols}列×${layout.rows}行 / ${kb} KB`,
    );
  });

  $('dlTile').addEventListener('click', () => {
    if (!lastTileBlob) return;
    const ext = state.fmt === 'jpg' ? 'jpg' : 'png';
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadBlob(lastTileBlob, `tachieasy_tile_${ts}.${ext}`);
  });
};
