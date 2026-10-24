// フレーム単位のタイマーと画面効果（フェード・フラッシュ・揺れ）
import { ctx, W, H } from './screen';

type Waiter = { frames: number; resolve: () => void };
const waiters: Waiter[] = [];

/** 指定フレーム待つ（60フレーム = 約1秒） */
export function wait(frames: number): Promise<void> {
  return new Promise((resolve) => waiters.push({ frames, resolve }));
}

export const fx = {
  fade: 1, // 0 = 見える, 1 = 真っ黒
  fadeColor: '#000',
  flashColor: '#fff',
  flashFrames: 0,
  flashTotal: 0,
  shakeFrames: 0,
  shakePower: 0,
};

let fadeTarget = 0;
let fadeStep = 0;
let fadeResolve: (() => void) | null = null;

export function fadeTo(target: number, frames = 20, color = '#000'): Promise<void> {
  fx.fadeColor = color;
  fadeTarget = target;
  fadeStep = Math.abs(target - fx.fade) / Math.max(1, frames);
  fadeResolve?.();
  return new Promise((resolve) => {
    if (fadeStep === 0) {
      resolve();
      return;
    }
    fadeResolve = resolve;
  });
}

export const fadeOut = (frames = 20, color = '#000') => fadeTo(1, frames, color);
export const fadeIn = (frames = 20) => fadeTo(0, frames, fx.fadeColor);

export function flash(color = '#fff', frames = 6): void {
  fx.flashColor = color;
  fx.flashFrames = frames;
  fx.flashTotal = frames;
}

export function shake(frames = 16, power = 3): void {
  fx.shakeFrames = frames;
  fx.shakePower = power;
}

export function shakeOffset(): [number, number] {
  if (fx.shakeFrames <= 0) return [0, 0];
  const p = fx.shakePower * (fx.shakeFrames / 16 + 0.3);
  return [Math.round((Math.random() * 2 - 1) * p), Math.round((Math.random() * 2 - 1) * p)];
}

export function updateFx(): void {
  for (let i = waiters.length - 1; i >= 0; i--) {
    if (--waiters[i].frames <= 0) {
      const w = waiters.splice(i, 1)[0];
      w.resolve();
    }
  }
  if (fadeStep > 0) {
    if (fx.fade < fadeTarget) fx.fade = Math.min(fadeTarget, fx.fade + fadeStep);
    else fx.fade = Math.max(fadeTarget, fx.fade - fadeStep);
    if (fx.fade === fadeTarget) {
      fadeStep = 0;
      const r = fadeResolve;
      fadeResolve = null;
      r?.();
    }
  }
  if (fx.flashFrames > 0) fx.flashFrames--;
  if (fx.shakeFrames > 0) fx.shakeFrames--;
}

export function drawFx(): void {
  if (fx.flashFrames > 0) {
    ctx.globalAlpha = fx.flashFrames / fx.flashTotal;
    ctx.fillStyle = fx.flashColor;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  if (fx.fade > 0) {
    // 少し段階的にしてレトロ感を出す
    ctx.globalAlpha = Math.ceil(fx.fade * 8) / 8;
    ctx.fillStyle = fx.fadeColor;
    ctx.fillRect(-8, -8, W + 16, H + 16);
    ctx.globalAlpha = 1;
  }
}
