// フィールド上のコマンドメニュー (はなす、じゅもん、どうぐ、つよさ、そうび)
import { drawWindow, drawText, drawCursor, W, H } from '../engine/screen';
import { input } from '../engine/input';
import { sound } from '../engine/audio';
import { party } from '../systems/party';
import { ITEMS, SPELLS } from '../data/items';

export type MenuState = 'closed' | 'main' | 'status' | 'items' | 'spells' | 'equip';

export class FieldMenu {
  state: MenuState = 'closed';
  mainCursor = 0;
  subCursor = 0;

  readonly MAIN_COMMANDS = ['はなす', 'じゅもん', 'どうぐ', 'つよさ', 'そうび', 'しらべる'];

  open(): void {
    this.state = 'main';
    this.mainCursor = 0;
    this.subCursor = 0;
    sound.sfx('confirm');
  }

  close(): void {
    this.state = 'closed';
    sound.sfx('cancel');
  }

  isOpen(): boolean {
    return this.state !== 'closed';
  }

  update(
    frame: number,
    onTalk: () => void,
    onSearch: () => void,
    onMessage: (msg: string) => void
  ): void {
    if (this.state === 'closed') return;

    if (this.state === 'main') {
      if (input.pressed('up')) {
        this.mainCursor = (this.mainCursor - 1 + this.MAIN_COMMANDS.length) % this.MAIN_COMMANDS.length;
        sound.sfx('cursor');
        input.consume();
      } else if (input.pressed('down')) {
        this.mainCursor = (this.mainCursor + 1) % this.MAIN_COMMANDS.length;
        sound.sfx('cursor');
        input.consume();
      } else if (input.pressed('a')) {
        const cmd = this.MAIN_COMMANDS[this.mainCursor];
        input.consume();
        if (cmd === 'はなす') {
          this.close();
          onTalk();
        } else if (cmd === 'しらべる') {
          this.close();
          onSearch();
        } else if (cmd === 'つよさ') {
          this.state = 'status';
          sound.sfx('confirm');
        } else if (cmd === 'どうぐ') {
          this.state = 'items';
          this.subCursor = 0;
          sound.sfx('confirm');
        } else if (cmd === 'じゅもん') {
          this.state = 'spells';
          this.subCursor = 0;
          sound.sfx('confirm');
        } else if (cmd === 'そうび') {
          this.state = 'equip';
          this.subCursor = 0;
          sound.sfx('confirm');
        }
      } else if (input.pressed('b')) {
        input.consume();
        this.close();
      }
      return;
    }

    if (this.state === 'status') {
      if (input.pressed('a') || input.pressed('b')) {
        input.consume();
        this.state = 'main';
        sound.sfx('cancel');
      }
      return;
    }

    if (this.state === 'items') {
      const items = party.player.items;
      if (items.length === 0) {
        if (input.pressed('a') || input.pressed('b')) {
          input.consume();
          this.state = 'main';
          sound.sfx('cancel');
        }
        return;
      }

      if (input.pressed('up')) {
        this.subCursor = (this.subCursor - 1 + items.length) % items.length;
        sound.sfx('cursor');
        input.consume();
      } else if (input.pressed('down')) {
        this.subCursor = (this.subCursor + 1) % items.length;
        sound.sfx('cursor');
        input.consume();
      } else if (input.pressed('a')) {
        input.consume();
        const itemId = items[this.subCursor];
        const def = ITEMS[itemId];
        if (def && def.type === 'consumable') {
          if (def.healHp) {
            party.player.hp = Math.min(party.player.maxHp, party.player.hp + def.healHp);
            sound.sfx('heal');
            party.removeItem(this.subCursor);
            this.close();
            onMessage(`${party.player.name}は ${def.name}をつかった！\nHPが回復した！`);
          } else if (def.healMp) {
            party.player.mp = Math.min(party.player.maxMp, party.player.mp + def.healMp);
            sound.sfx('heal');
            party.removeItem(this.subCursor);
            this.close();
            onMessage(`${party.player.name}は ${def.name}をつかった！\nMPが回復した！`);
          }
        } else {
          sound.sfx('bump');
          onMessage('ここでは つかえない！');
        }
      } else if (input.pressed('b')) {
        input.consume();
        this.state = 'main';
        sound.sfx('cancel');
      }
      return;
    }

    if (this.state === 'spells') {
      const spells = party.player.spells;
      if (spells.length === 0) {
        if (input.pressed('a') || input.pressed('b')) {
          input.consume();
          this.state = 'main';
          sound.sfx('cancel');
        }
        return;
      }

      if (input.pressed('up')) {
        this.subCursor = (this.subCursor - 1 + spells.length) % spells.length;
        sound.sfx('cursor');
        input.consume();
      } else if (input.pressed('down')) {
        this.subCursor = (this.subCursor + 1) % spells.length;
        sound.sfx('cursor');
        input.consume();
      } else if (input.pressed('a')) {
        input.consume();
        const spellId = spells[this.subCursor];
        const def = SPELLS[spellId];
        if (def && def.heal) {
          if (party.player.mp < def.mp) {
            sound.sfx('bump');
            onMessage('MPが たりない！');
          } else {
            party.player.mp -= def.mp;
            party.player.hp = Math.min(party.player.maxHp, party.player.hp + def.heal);
            sound.sfx('heal');
            this.close();
            onMessage(`${party.player.name}は ${def.name}をとなえた！\nHPが回復した！`);
          }
        } else {
          sound.sfx('bump');
          onMessage('ここでは つかえない！');
        }
      } else if (input.pressed('b')) {
        input.consume();
        this.state = 'main';
        sound.sfx('cancel');
      }
      return;
    }

    if (this.state === 'equip') {
      // 装備可能な所持アイテムをリストアップ
      const equipableIndices: number[] = [];
      party.player.items.forEach((id, idx) => {
        const item = ITEMS[id];
        if (item && (item.type === 'weapon' || item.type === 'armor' || item.type === 'shield')) {
          equipableIndices.push(idx);
        }
      });

      if (equipableIndices.length === 0) {
        if (input.pressed('a') || input.pressed('b')) {
          input.consume();
          this.state = 'main';
          sound.sfx('cancel');
        }
        return;
      }

      if (input.pressed('up')) {
        this.subCursor = (this.subCursor - 1 + equipableIndices.length) % equipableIndices.length;
        sound.sfx('cursor');
        input.consume();
      } else if (input.pressed('down')) {
        this.subCursor = (this.subCursor + 1) % equipableIndices.length;
        sound.sfx('cursor');
        input.consume();
      } else if (input.pressed('a')) {
        input.consume();
        const itemIndex = equipableIndices[this.subCursor];
        const itemId = party.player.items[itemIndex];
        const item = ITEMS[itemId];
        if (item) {
          // 現在装備しているものを外して手持ちへ、選択したものを装備
          let prevEquip: string | null = null;
          if (item.type === 'weapon') {
            prevEquip = party.player.weapon;
            party.player.weapon = item.id;
          } else if (item.type === 'armor') {
            prevEquip = party.player.armor;
            party.player.armor = item.id;
          } else if (item.type === 'shield') {
            prevEquip = party.player.shield;
            party.player.shield = item.id;
          }
          party.removeItem(itemIndex);
          if (prevEquip) party.addItem(prevEquip);
          sound.sfx('confirm');
          onMessage(`${item.name}をそうびした！`);
          this.state = 'main';
        }
      } else if (input.pressed('b')) {
        input.consume();
        this.state = 'main';
        sound.sfx('cancel');
      }
      return;
    }
  }

  draw(frame: number): void {
    if (this.state === 'closed') return;

    // メインコマンドウィンドウ (左上)
    const mwX = 16;
    const mwY = 16;
    const mwW = 68;
    const mwH = 114;
    drawWindow(mwX, mwY, mwW, mwH, 'コマンド');

    for (let i = 0; i < this.MAIN_COMMANDS.length; i++) {
      drawText(this.MAIN_COMMANDS[i], mwX + 16, mwY + 12 + i * 16, '#ffffff', 11);
    }
    drawCursor(mwX + 6, mwY + 13 + this.mainCursor * 16, this.state !== 'main', frame);

    // つよさ・ステータスウィンドウ
    if (this.state === 'status') {
      const swX = 92;
      const swY = 16;
      const swW = 148;
      const swH = 180;
      drawWindow(swX, swY, swW, swH, 'つよさ');

      const p = party.player;
      let y = swY + 14;
      drawText(`なまえ: ${p.name}`, swX + 10, y, '#f4c95d', 11); y += 15;
      drawText(`レベル: ${p.level}`, swX + 10, y, '#ffffff', 11); y += 15;
      drawText(`H P   : ${p.hp} / ${p.maxHp}`, swX + 10, y, '#ffffff', 11); y += 15;
      drawText(`M P   : ${p.mp} / ${p.maxMp}`, swX + 10, y, '#ffffff', 11); y += 15;
      drawText(`こうげき: ${party.totalAtk}`, swX + 10, y, '#ffffff', 11); y += 15;
      drawText(`しゅび  : ${party.totalDef}`, swX + 10, y, '#ffffff', 11); y += 15;
      drawText(`ゴールド: ${p.gold} G`, swX + 10, y, '#ffd700', 11); y += 15;
      drawText(`けいけん: ${p.exp}`, swX + 10, y, '#ffffff', 11); y += 15;
      drawText(`あと    : ${party.nextExp}`, swX + 10, y, '#a098c8', 11);
    }

    // どうぐウィンドウ
    if (this.state === 'items') {
      const iwX = 92;
      const iwY = 16;
      const iwW = 148;
      const iwH = 180;
      drawWindow(iwX, iwY, iwW, iwH, 'どうぐ');

      const items = party.player.items;
      if (items.length === 0) {
        drawText('何も持っていない', iwX + 16, iwY + 16, '#888888', 11);
      } else {
        items.forEach((id, idx) => {
          const item = ITEMS[id];
          const name = item ? item.name : id;
          drawText(name, iwX + 16, iwY + 12 + idx * 14, '#ffffff', 11);
        });
        drawCursor(iwX + 6, iwY + 13 + this.subCursor * 14, false, frame);

        // 説明文
        const curItem = ITEMS[items[this.subCursor]];
        if (curItem) {
          drawWindow(16, H - 40, W - 32, 32);
          drawText(curItem.desc, 24, H - 32, '#f4c95d', 10);
        }
      }
    }

    // じゅもんウィンドウ
    if (this.state === 'spells') {
      const swX = 92;
      const swY = 16;
      const swW = 148;
      const swH = 140;
      drawWindow(swX, swY, swW, swH, 'じゅもん');

      const spells = party.player.spells;
      if (spells.length === 0) {
        drawText('呪文をおぼえていない', swX + 16, swY + 16, '#888888', 11);
      } else {
        spells.forEach((id, idx) => {
          const sp = SPELLS[id];
          const name = sp ? `${sp.name} (${sp.mp})` : id;
          drawText(name, swX + 16, swY + 12 + idx * 16, '#ffffff', 11);
        });
        drawCursor(swX + 6, swY + 13 + this.subCursor * 16, false, frame);

        const curSpell = SPELLS[spells[this.subCursor]];
        if (curSpell) {
          drawWindow(16, H - 40, W - 32, 32);
          drawText(curSpell.desc, 24, H - 32, '#f4c95d', 10);
        }
      }
    }

    // そうびウィンドウ
    if (this.state === 'equip') {
      const ewX = 92;
      const ewY = 16;
      const ewW = 148;
      const ewH = 180;
      drawWindow(ewX, ewY, ewW, ewH, 'そうび');

      const p = party.player;
      let y = ewY + 12;
      const wName = p.weapon ? (ITEMS[p.weapon]?.name || p.weapon) : 'なし';
      const aName = p.armor ? (ITEMS[p.armor]?.name || p.armor) : 'なし';
      const sName = p.shield ? (ITEMS[p.shield]?.name || p.shield) : 'なし';

      drawText(`ぶき  : ${wName}`, ewX + 10, y, '#f4c95d', 10); y += 14;
      drawText(`よろい: ${aName}`, ewX + 10, y, '#f4c95d', 10); y += 14;
      drawText(`たて  : ${sName}`, ewX + 10, y, '#f4c95d', 10); y += 18;

      drawText('【持ち物の装備品】', ewX + 10, y, '#a098c8', 10); y += 14;

      const equipableIndices: number[] = [];
      party.player.items.forEach((id, idx) => {
        const item = ITEMS[id];
        if (item && (item.type === 'weapon' || item.type === 'armor' || item.type === 'shield')) {
          equipableIndices.push(idx);
        }
      });

      if (equipableIndices.length === 0) {
        drawText('装備可能な道具なし', ewX + 16, y, '#888888', 10);
      } else {
        equipableIndices.forEach((itemIdx, listIdx) => {
          const item = ITEMS[party.player.items[itemIdx]];
          drawText(item.name, ewX + 16, y + listIdx * 14, '#ffffff', 10);
        });
        drawCursor(ewX + 6, y + 1 + this.subCursor * 14, false, frame);
      }
    }
  }
}

export const fieldMenu = new FieldMenu();
