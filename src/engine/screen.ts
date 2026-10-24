// 画面（キャンバス）と描画ヘルパー
// ゲーム内の座標は 256x240 の「論理ピクセル」。実キャンバスは SCALE 倍で文字をくっきり描く。

export const W = 256;
export const H = 240;
export const SCALE = 3;
export const TILE = 16;
export const FONT_FAMILY = '"DotGothic16", monospace';

export let canvas: HTMLCanvasElement;
export let ctx: CanvasRenderingContext2D;

export function initScreen(el: HTMLCanvasElement): void {
  canvas = el;
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  ctx = canvas.getContext('2d')!;
  resetTransform();
}

export function resetTransform(): void {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

export function setFont(size = 12): void {
  ctx.font = `${size}px ${FONT_FAMILY}`;
  ctx.textBaseline = 'top';
}

export function drawText(
  str: string,
  x: number,
  y: number,
  color = '#fff',
  size = 12,
  align: CanvasTextAlign = 'left',
): void {
  setFont(size);
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.textAlign = 'left';
}

/** 縁取り付き文字（タイトルなど） */
export function drawTextOutline(
  str: string,
  x: number,
  y: number,
  fill: string | CanvasGradient,
  outline = '#000',
  size = 12,
  align: CanvasTextAlign = 'left',
  outlineWidth = 2,
): void {
  setFont(size);
  ctx.textAlign = align;
  ctx.lineJoin = 'round';
  ctx.lineWidth = outlineWidth;
  ctx.strokeStyle = outline;
  ctx.strokeText(str, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(str, x, y);
  ctx.textAlign = 'left';
}

export function measure(str: string, size = 12): number {
  setFont(size);
  return ctx.measureText(str).width;
}

/** 日本語向けの文字単位の折り返し */
export function wrapText(str: string, maxWidth: number, size = 12): string[] {
  setFont(size);
  const out: string[] = [];
  for (const para of str.split('\n')) {
    let line = '';
    for (const ch of para) {
      const test = line + ch;
      // 句読点・閉じかっこは行頭に来ないようにする
      if (ctx.measureText(test).width > maxWidth && line !== '' && !'、。！？」』）ー'.includes(ch)) {
        out.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    out.push(line);
  }
  return out;
}

function roundRectPath(x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** ドラクエ風の黒地＋白枠ウィンドウ */
export function drawWindow(x: number, y: number, w: number, h: number, title?: string): void {
  ctx.save();
  // 影
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRectPath(x + 2, y + 2, w, h, 4);
  ctx.fill();
  // 本体
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, '#0b0a1a');
  grad.addColorStop(1, '#000000');
  ctx.fillStyle = grad;
  roundRectPath(x, y, w, h, 4);
  ctx.fill();
  // 白い枠
  ctx.strokeStyle = '#f4f1ff';
  ctx.lineWidth = 1.34;
  roundRectPath(x + 2.5, y + 2.5, w - 5, h - 5, 3);
  ctx.stroke();
  // 内側のうっすらした線
  ctx.strokeStyle = 'rgba(160,150,255,0.25)';
  ctx.lineWidth = 0.67;
  roundRectPath(x + 4.5, y + 4.5, w - 9, h - 9, 2);
  ctx.stroke();
  ctx.restore();

  if (title) {
    const tw = measure(title, 10) + 8;
    const tx = x + Math.floor((w - tw) / 2);
    ctx.fillStyle = '#000';
    ctx.fillRect(tx, y, tw, 6);
    drawText(title, x + w / 2, y - 3, '#f4f1ff', 10, 'center');
  }
}

/** 点滅する▶カーソル */
export function drawCursor(x: number, y: number, blink: boolean, frame: number): void {
  if (blink && Math.floor(frame / 16) % 2 === 1) return;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 6, y + 4.5);
  ctx.lineTo(x, y + 9);
  ctx.closePath();
  ctx.fill();
}
