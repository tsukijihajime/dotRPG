// メッセージウィンドウ、文字送り（タイプライター）、選択肢ウィンドウ
import { drawWindow, drawText, drawCursor, wrapText, W, H } from '../engine/screen';
import { input } from '../engine/input';
import { sound } from '../engine/audio';

export interface DialogOptions {
  onFinish?: () => void;
  choices?: string[];
  onChoice?: (index: number) => void;
}

export class DialogBox {
  lines: string[] = [];
  currentLineIdx = 0;
  displayedCharCount = 0;
  charTimer = 0;
  charsPerTick = 1;
  isComplete = true;
  waitingForInput = false;

  choices: string[] | null = null;
  choiceCursor = 0;
  onChoiceCallback: ((idx: number) => void) | null = null;
  onFinishCallback: (() => void) | null = null;

  active = false;

  show(text: string, options?: DialogOptions): void {
    this.active = true;
    this.lines = wrapText(text, 204, 11);
    this.currentLineIdx = 0;
    this.displayedCharCount = 0;
    this.charTimer = 0;
    this.isComplete = false;
    this.waitingForInput = false;
    this.choices = options?.choices ?? null;
    this.choiceCursor = 0;
    this.onChoiceCallback = options?.onChoice ?? null;
    this.onFinishCallback = options?.onFinish ?? null;
  }

  hide(): void {
    this.active = false;
    this.choices = null;
    const cb = this.onFinishCallback;
    this.onFinishCallback = null;
    cb?.();
  }

  update(frame: number): void {
    if (!this.active) return;

    // テキスト送り中
    if (!this.isComplete) {
      this.charTimer++;
      if (this.charTimer >= 2) {
        this.charTimer = 0;
        this.displayedCharCount++;
        sound.sfx('text');

        // 現在表示中の最大文字数（2行分）
        const curWindowLines = this.lines.slice(this.currentLineIdx, this.currentLineIdx + 2);
        const totalCharsInWindow = curWindowLines.join('').length;

        if (this.displayedCharCount >= totalCharsInWindow) {
          this.isComplete = true;
          this.waitingForInput = true;
        }
      }

      // Aボタンで早送り
      if (input.pressed('a') || input.pressed('b')) {
        const curWindowLines = this.lines.slice(this.currentLineIdx, this.currentLineIdx + 2);
        this.displayedCharCount = curWindowLines.join('').length;
        this.isComplete = true;
        this.waitingForInput = true;
        input.consume();
      }
      return;
    }

    // 選択肢がある場合
    if (this.choices && this.choices.length > 0) {
      if (input.pressed('up')) {
        this.choiceCursor = (this.choiceCursor - 1 + this.choices.length) % this.choices.length;
        sound.sfx('cursor');
        input.consume();
      } else if (input.pressed('down')) {
        this.choiceCursor = (this.choiceCursor + 1) % this.choices.length;
        sound.sfx('cursor');
        input.consume();
      } else if (input.pressed('a')) {
        const chosen = this.choiceCursor;
        sound.sfx('confirm');
        input.consume();
        const cb = this.onChoiceCallback;
        this.hide();
        cb?.(chosen);
      } else if (input.pressed('b')) {
        sound.sfx('cancel');
        input.consume();
        const cb = this.onChoiceCallback;
        this.hide();
        cb?.(this.choices.length - 1); // Bは最後の選択肢（いいえ/やめる）
      }
      return;
    }

    // 次のページ送り or 終了
    if (this.waitingForInput) {
      if (input.pressed('a') || input.pressed('b')) {
        sound.sfx('confirm');
        input.consume();
        if (this.currentLineIdx + 2 < this.lines.length) {
          this.currentLineIdx += 2;
          this.displayedCharCount = 0;
          this.isComplete = false;
          this.waitingForInput = false;
        } else {
          this.hide();
        }
      }
    }
  }

  draw(frame: number): void {
    if (!this.active) return;

    // 会話ウィンドウ (下部)
    const winX = 16;
    const winY = H - 64;
    const winW = W - 32;
    const winH = 56;

    drawWindow(winX, winY, winW, winH);

    // テキスト描画 (最大2行)
    const curWindowLines = this.lines.slice(this.currentLineIdx, this.currentLineIdx + 2);
    let remaining = this.displayedCharCount;

    for (let i = 0; i < curWindowLines.length; i++) {
      const line = curWindowLines[i];
      const count = Math.min(line.length, remaining);
      const textToDraw = line.slice(0, count);
      drawText(textToDraw, winX + 10, winY + 10 + i * 16, '#ffffff', 11);
      remaining -= count;
      if (remaining <= 0) break;
    }

    // 次へ促す▼点滅アイコン
    if (this.waitingForInput && !this.choices) {
      if (Math.floor(frame / 16) % 2 === 0) {
        drawText('▼', winX + winW - 16, winY + winH - 16, '#f4c95d', 10);
      }
    }

    // 選択肢ウィンドウ
    if (this.choices && this.choices.length > 0) {
      const chW = 64;
      const chH = 16 + this.choices.length * 16;
      const chX = winX + winW - chW;
      const chY = winY - chH - 4;

      drawWindow(chX, chY, chW, chH);
      for (let i = 0; i < this.choices.length; i++) {
        drawText(this.choices[i], chX + 16, chY + 10 + i * 16, '#ffffff', 11);
      }
      drawCursor(chX + 6, chY + 11 + this.choiceCursor * 16, false, frame);
    }
  }
}

export const dialog = new DialogBox();
