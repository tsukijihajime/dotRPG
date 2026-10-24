import { drawText, drawTextOutline, W, H, ctx } from '../engine/screen';
import { input } from '../engine/input';
import { sound } from '../engine/audio';

export class EndingScene {
  scrollY = H + 20;
  onFinishCallback: (() => void) | null = null;
  bgImg: HTMLImageElement | null = null;

  readonly CREDITS = [
    'ドットクエスト ～やみの魔導王～',
    '',
    '魔導王ザルバの邪悪な野望は打ち砕かれ、',
    'ルルの町とアレフの地に',
    '再び平和が訪れた……！',
    '',
    '若き勇者の伝説は',
    '永遠に語り継がれることだろう。',
    '',
    '--------------------------------',
    '企画・開発: dotRPG Project',
    'グラフィック: Pixel AI Generator',
    'サウンド: Web Audio Chiptune Engine',
    '--------------------------------',
    '',
    'THANK YOU FOR PLAYING!!',
    '',
    'Press A / Enter to Title',
  ];

  start(onFinish: () => void): void {
    this.onFinishCallback = onFinish;
    this.scrollY = H + 20;

    this.bgImg = new Image();
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    this.bgImg.src = `${base}/assets/title.png`;

    sound.bgm('ending');
  }

  update(frame: number): void {
    if (this.scrollY > 40) {
      this.scrollY -= 0.6;
    }

    if (input.pressed('a') || input.pressed('b')) {
      input.consume();
      const cb = this.onFinishCallback;
      this.onFinishCallback = null;
      cb?.();
    }
  }

  draw(frame: number): void {
    if (this.bgImg && this.bgImg.complete) {
      ctx.drawImage(this.bgImg, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#0a0818';
      ctx.fillRect(0, 0, W, H);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, W, H);

    drawTextOutline('THE END', W / 2, 28, '#ffd700', '#221100', 20, 'center', 4);

    let y = this.scrollY;
    for (const line of this.CREDITS) {
      if (y >= 40 && y <= H - 10) {
        if (line === 'THANK YOU FOR PLAYING!!') {
          drawText(line, W / 2, y, '#ffd700', 12, 'center');
        } else if (line.startsWith('Press')) {
          if (Math.floor(frame / 20) % 2 === 0) {
            drawText(line, W / 2, y, '#ffffff', 11, 'center');
          }
        } else {
          drawText(line, W / 2, y, '#e8e4ff', 10, 'center');
        }
      }
      y += 16;
    }
  }
}

export const endingScene = new EndingScene();
