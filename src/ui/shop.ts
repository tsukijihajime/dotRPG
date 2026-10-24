// 道具屋・武器屋の売買UI
import { drawWindow, drawText, drawCursor, W, H } from '../engine/screen';
import { input } from '../engine/input';
import { sound } from '../engine/audio';
import { party } from '../systems/party';
import { ITEMS } from '../data/items';

export class ShopUI {
  active = false;
  mode: 'root' | 'buy' | 'sell' = 'root';
  rootCursor = 0;
  listCursor = 0;
  shopItems: string[] = [];
  onCloseCallback: (() => void) | null = null;
  message = '';

  open(items: string[], onClose?: () => void): void {
    this.active = true;
    this.mode = 'root';
    this.rootCursor = 0;
    this.listCursor = 0;
    this.shopItems = items;
    this.onCloseCallback = onClose ?? null;
    this.message = '何をお求めですかな？';
    sound.sfx('confirm');
  }

  close(): void {
    this.active = false;
    sound.sfx('cancel');
    const cb = this.onCloseCallback;
    this.onCloseCallback = null;
    cb?.();
  }

  update(frame: number): void {
    if (!this.active) return;

    if (this.mode === 'root') {
      if (input.pressed('up')) {
        this.rootCursor = (this.rootCursor - 1 + 3) % 3;
        sound.sfx('cursor');
        input.consume();
      } else if (input.pressed('down')) {
        this.rootCursor = (this.rootCursor + 1) % 3;
        sound.sfx('cursor');
        input.consume();
      } else if (input.pressed('a')) {
        input.consume();
        if (this.rootCursor === 0) {
          // かう
          this.mode = 'buy';
          this.listCursor = 0;
          this.message = 'どれをお買い上げですか？';
          sound.sfx('confirm');
        } else if (this.rootCursor === 1) {
          // うる
          this.mode = 'sell';
          this.listCursor = 0;
          this.message = 'どれを売ってくださいますか？';
          sound.sfx('confirm');
        } else {
          // やめる
          this.close();
        }
      } else if (input.pressed('b')) {
        input.consume();
        this.close();
      }
      return;
    }

    if (this.mode === 'buy') {
      if (input.pressed('up')) {
        this.listCursor = (this.listCursor - 1 + this.shopItems.length) % this.shopItems.length;
        sound.sfx('cursor');
        input.consume();
      } else if (input.pressed('down')) {
        this.listCursor = (this.listCursor + 1) % this.shopItems.length;
        sound.sfx('cursor');
        input.consume();
      } else if (input.pressed('a')) {
        input.consume();
        const itemId = this.shopItems[this.listCursor];
        const item = ITEMS[itemId];
        if (item) {
          if (party.player.gold < item.price) {
            sound.sfx('bump');
            this.message = 'ゴールドが たりないようですぜ！';
          } else if (party.player.items.length >= 12) {
            sound.sfx('bump');
            this.message = '持ち物がいっぱいで 持てないようだ！';
          } else {
            party.player.gold -= item.price;
            party.addItem(item.id);
            sound.sfx('buy');
            this.message = `${item.name}をお買い上げ！毎度あり！`;
          }
        }
      } else if (input.pressed('b')) {
        input.consume();
        this.mode = 'root';
        this.message = 'ほかにも ご用はありますかい？';
        sound.sfx('cancel');
      }
      return;
    }

    if (this.mode === 'sell') {
      const items = party.player.items;
      if (items.length === 0) {
        if (input.pressed('a') || input.pressed('b')) {
          input.consume();
          this.mode = 'root';
          sound.sfx('cancel');
        }
        return;
      }

      if (input.pressed('up')) {
        this.listCursor = (this.listCursor - 1 + items.length) % items.length;
        sound.sfx('cursor');
        input.consume();
      } else if (input.pressed('down')) {
        this.listCursor = (this.listCursor + 1) % items.length;
        sound.sfx('cursor');
        input.consume();
      } else if (input.pressed('a')) {
        input.consume();
        const itemId = items[this.listCursor];
        const item = ITEMS[itemId];
        if (item) {
          const sellPrice = Math.floor(item.price / 2);
          party.player.gold += sellPrice;
          party.removeItem(this.listCursor);
          if (this.listCursor >= party.player.items.length) {
            this.listCursor = Math.max(0, party.player.items.length - 1);
          }
          sound.sfx('buy');
          this.message = `${item.name}を ${sellPrice}Gで買い取ったよ！`;
        }
      } else if (input.pressed('b')) {
        input.consume();
        this.mode = 'root';
        this.message = 'ほかにも ご用はありますかい？';
        sound.sfx('cancel');
      }
      return;
    }
  }

  draw(frame: number): void {
    if (!this.active) return;

    // 所持金ウィンドウ (右上)
    drawWindow(W - 88, 16, 72, 32);
    drawText('ゴールド', W - 80, 22, '#a098c8', 10);
    drawText(`${party.player.gold} G`, W - 80, 34, '#ffd700', 10);

    // ルート選択ウィンドウ (左上)
    drawWindow(16, 16, 68, 64);
    drawText('かう', 32, 24, '#ffffff', 11);
    drawText('うる', 32, 40, '#ffffff', 11);
    drawText('やめる', 32, 56, '#ffffff', 11);
    drawCursor(22, 25 + this.rootCursor * 16, this.mode !== 'root', frame);

    // 商品・売却リストウィンドウ
    if (this.mode === 'buy') {
      const lwX = 90;
      const lwY = 16;
      const lwW = 150;
      const lwH = 150;
      drawWindow(lwX, lwY, lwW, lwH, '商品');

      this.shopItems.forEach((id, idx) => {
        const item = ITEMS[id];
        if (item) {
          drawText(item.name, lwX + 16, lwY + 12 + idx * 16, '#ffffff', 10);
          drawText(`${item.price}G`, lwX + lwW - 12, lwY + 12 + idx * 16, '#ffd700', 10, 'right');
        }
      });
      drawCursor(lwX + 6, lwY + 13 + this.listCursor * 16, false, frame);

      // アイテム説明
      const curItem = ITEMS[this.shopItems[this.listCursor]];
      if (curItem) {
        drawWindow(16, H - 76, W - 32, 26);
        drawText(curItem.desc, 24, H - 70, '#f4c95d', 10);
      }
    } else if (this.mode === 'sell') {
      const lwX = 90;
      const lwY = 16;
      const lwW = 150;
      const lwH = 150;
      drawWindow(lwX, lwY, lwW, lwH, '売るもの');

      const items = party.player.items;
      if (items.length === 0) {
        drawText('売れるものが ありません', lwX + 16, lwY + 16, '#888888', 10);
      } else {
        items.forEach((id, idx) => {
          const item = ITEMS[id];
          if (item) {
            const price = Math.floor(item.price / 2);
            drawText(item.name, lwX + 16, lwY + 12 + idx * 14, '#ffffff', 10);
            drawText(`${price}G`, lwX + lwW - 12, lwY + 12 + idx * 14, '#ffd700', 10, 'right');
          }
        });
        drawCursor(lwX + 6, lwY + 13 + this.listCursor * 14, false, frame);
      }
    }

    // 会話・メッセージ枠 (最下部)
    drawWindow(16, H - 46, W - 32, 36);
    drawText(this.message, 24, H - 36, '#ffffff', 11);
  }
}

export const shopUI = new ShopUI();
