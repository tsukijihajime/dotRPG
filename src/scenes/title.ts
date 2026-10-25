// タイトル画面シーン
import { drawWindow, drawText, drawTextOutline, drawCursor, W, H, ctx } from '../engine/screen';
import { input } from '../engine/input';
import { sound } from '../engine/audio';
import { party } from '../systems/party';

export class TitleScene {
  bgImg: HTMLImageElement | null = null;
  cursor = 0;
  hasSaveData = false;
  onStartCallback: ((isContinue: boolean) => void) | null = null;

  start(onStart: (isContinue: boolean) => void): void {
    this.onStartCallback = onStart;
    this.hasSaveData = party.hasSave();
    this.cursor = this.hasSaveData ? 1 : 0;

    this.bgImg = new Image();
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    this.bgImg.src = `${base}/assets/title.png`;

    sound.bgm('title');
  }

  update(frame: number): void {
    const maxOpt = this.hasSaveData ? 2 : 1;

    if (input.pressed('up') || input.pressed('down')) {
      if (maxOpt > 1) {
        this.cursor = (this.cursor + 1) % 2;
        sound.sfx('cursor');
        input.consume();
      }
    } else if (input.pressed('a')) {
      input.consume();
      sound.sfx('confirm');
      const isContinue = this.hasSaveData && this.cursor === 1;
      const cb = this.onStartCallback;
      this.onStartCallback = null;
      cb?.(isContinue);
    }
  }

  draw(frame: number): void {
    // 背景画像
    if (this.bgImg && this.bgImg.complete) {
      ctx.drawImage(this.bgImg, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#0a0818';
      ctx.fillRect(0, 0, W, H);
    }

    // うっすらオーバーレイで文字を読みやすく
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, W, H);

    // タイトルロゴ
    drawTextOutline('ドットクエスト', W / 2, 34, '#ffd700', '#221100', 22, 'center', 4);
    drawTextOutline('～ やみの魔導王 ～', W / 2, 62, '#ffffff', '#1a0033', 13, 'center', 3);

    // 選択肢ウィンドウ (中央下部)
    const winW = 100;
    const winH = this.hasSaveData ? 54 : 38;
    const winX = (W - winW) / 2;
    const winY = 150;

    drawWindow(winX, winY, winW, winH);

    drawText('はじめから', winX + 22, winY + 12, '#ffffff', 11);
    if (this.hasSaveData) {
      drawText('つづきから', winX + 22, winY + 28, '#ffffff', 11);
    }

    drawCursor(winX + 10, winY + 13 + this.cursor * 16, false, frame);

    // コピーライト & バージョン情報
    drawText('© 2026 dotRPG / Antigravity', W / 2, H - 20, 'rgba(255,255,255,0.7)', 9, 'center');
    drawText(__BUILD_INFO__, W / 2, H - 10, 'rgba(255,255,255,0.45)', 8, 'center');
  }
}

export const titleScene = new TitleScene();
