// コマンド式バトルシーン
import { drawWindow, drawText, drawCursor, wrapText, W, H, ctx } from '../engine/screen';
import { input } from '../engine/input';
import { sound } from '../engine/audio';
import { shake, flash } from '../engine/fx';
import { party } from '../systems/party';
import { MONSTERS, type MonsterDef, ITEMS, SPELLS } from '../data/items';

export interface BattleResult {
  won: boolean;
  escaped: boolean;
  gameover: boolean;
}

export type BattleState =
  | 'start'
  | 'player_command'
  | 'spell_select'
  | 'item_select'
  | 'executing'
  | 'message'
  | 'victory'
  | 'defeat';

export class BattleScene {
  monster!: MonsterDef;
  monsterHp = 0;
  monsterMaxHp = 0;
  monsterImg: HTMLImageElement | null = null;

  state: BattleState = 'start';
  commandCursor = 0;
  subCursor = 0;

  readonly COMMANDS = ['たたかう', 'じゅもん', 'どうぐ', 'にげる'];

  // メッセージキュー
  messages: string[] = [];
  currentMessage = '';
  waitingPrompt = false;
  resolveMessage: (() => void) | null = null;
  onFinishCallback: ((res: BattleResult) => void) | null = null;

  monsterBlink = 0;
  monsterShake = 0;

  start(monsterId: string, onFinish: (res: BattleResult) => void): void {
    const def = MONSTERS[monsterId] || MONSTERS['jelly'];
    this.monster = def;
    this.monsterHp = def.maxHp;
    this.monsterMaxHp = def.maxHp;
    this.onFinishCallback = onFinish;
    this.commandCursor = 0;
    this.subCursor = 0;
    this.monsterBlink = 0;
    this.monsterShake = 0;

    // 画像読み込み
    this.monsterImg = new Image();
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    this.monsterImg.src = `${base}/assets/${def.sprite}`;

    sound.bgm(def.boss ? 'boss' : 'battle');

    this.runBattleFlow();
  }

  private async runBattleFlow(): Promise<void> {
    await this.say(`${this.monster.name}が あらわれた！`);
    this.state = 'player_command';
  }

  private say(text: string): Promise<void> {
    this.currentMessage = text;
    this.waitingPrompt = true;
    sound.sfx('text');
    return new Promise((resolve) => {
      this.resolveMessage = resolve;
    });
  }

  private async playerAttack(): Promise<void> {
    this.state = 'executing';
    await this.say(`${party.player.name}の こうげき！`);

    // 会心判定
    const isCrit = Math.random() < 0.12;
    let dmg = 0;
    if (isCrit) {
      sound.sfx('crit');
      shake(16, 5);
      flash('#ffffff', 8);
      dmg = Math.floor(party.totalAtk * 1.5 + Math.random() * 6);
      await this.say('かいしんの いちげき！！');
    } else {
      sound.sfx('attack');
      const baseDmg = Math.max(1, Math.floor((party.totalAtk - this.monster.def / 2) / 2));
      const variance = Math.max(1, Math.floor(baseDmg * 0.3));
      dmg = Math.max(1, baseDmg + Math.floor(Math.random() * variance * 2 - variance));
    }

    this.monsterShake = 16;
    this.monsterBlink = 20;
    sound.sfx('hit');
    this.monsterHp = Math.max(0, this.monsterHp - dmg);
    await this.say(`${this.monster.name}に ${dmg}の ダメージ！`);

    if (this.monsterHp <= 0) {
      await this.win();
      return;
    }

    await this.enemyTurn();
  }

  private async castSpell(spellId: string): Promise<void> {
    this.state = 'executing';
    const sp = SPELLS[spellId];
    if (!sp || party.player.mp < sp.mp) {
      await this.say('MPが たりない！');
      this.state = 'player_command';
      return;
    }

    party.player.mp -= sp.mp;
    sound.sfx(sp.sfx);
    await this.say(`${party.player.name}は ${sp.name}を となえた！`);

    if (sp.heal) {
      const healAmount = Math.min(party.player.maxHp - party.player.hp, sp.heal);
      party.player.hp += healAmount;
      flash('#88ff88', 8);
      await this.say(`${party.player.name}の HPが ${healAmount} 回復した！`);
    } else if (sp.damage) {
      const [minD, maxD] = sp.damage;
      const dmg = Math.floor(minD + Math.random() * (maxD - minD + 1));
      flash('#ffaa44', 10);
      shake(14, 4);
      this.monsterShake = 16;
      this.monsterBlink = 20;
      this.monsterHp = Math.max(0, this.monsterHp - dmg);
      await this.say(`${this.monster.name}に ${dmg}の ダメージ！`);

      if (this.monsterHp <= 0) {
        await this.win();
        return;
      }
    }

    await this.enemyTurn();
  }

  private async useItem(itemIndex: number): Promise<void> {
    this.state = 'executing';
    const itemId = party.player.items[itemIndex];
    const item = ITEMS[itemId];
    if (!item) {
      this.state = 'player_command';
      return;
    }

    party.removeItem(itemIndex);
    sound.sfx('item');
    await this.say(`${party.player.name}は ${item.name}をつかった！`);

    if (item.healHp) {
      const amt = Math.min(party.player.maxHp - party.player.hp, item.healHp);
      party.player.hp += amt;
      sound.sfx('heal');
      flash('#88ff88', 8);
      await this.say(`${party.player.name}の HPが ${amt} 回復した！`);
    } else if (item.healMp) {
      const amt = Math.min(party.player.maxMp - party.player.mp, item.healMp);
      party.player.mp += amt;
      sound.sfx('heal');
      flash('#88aaff', 8);
      await this.say(`${party.player.name}の MPが ${amt} 回復した！`);
    }

    await this.enemyTurn();
  }

  private async tryRun(): Promise<void> {
    this.state = 'executing';
    sound.sfx('run');
    await this.say(`${party.player.name}は にげだした！`);

    if (this.monster.boss) {
      await this.say('しかし 魔導王の前からは にげられない！');
      await this.enemyTurn();
      return;
    }

    const success = Math.random() < 0.65;
    if (success) {
      await this.say('うまく にげきれた！');
      this.finish({ won: false, escaped: true, gameover: false });
    } else {
      await this.say('しかし まわりこまれてしまった！');
      await this.enemyTurn();
    }
  }

  private async enemyTurn(): Promise<void> {
    // 敵の行動
    let usedSpell = false;
    if (this.monster.spells && this.monster.spells.length > 0 && Math.random() < 0.35) {
      const spId = this.monster.spells[Math.floor(Math.random() * this.monster.spells.length)];
      const sp = SPELLS[spId];
      if (sp) {
        usedSpell = true;
        sound.sfx(sp.sfx);
        await this.say(`${this.monster.name}は ${sp.name}を となえた！`);

        const [minD, maxD] = sp.damage || [10, 20];
        const dmg = Math.floor(minD + Math.random() * (maxD - minD + 1));
        sound.sfx('hurt');
        shake(18, 5);
        flash('#ff4444', 8);
        party.player.hp = Math.max(0, party.player.hp - dmg);
        await this.say(`${party.player.name}は ${dmg}の ダメージをうけた！`);
      }
    }

    if (!usedSpell) {
      await this.say(`${this.monster.name}の こうげき！`);
      const baseDmg = Math.max(1, Math.floor((this.monster.atk - party.totalDef / 2) / 2));
      const variance = Math.max(1, Math.floor(baseDmg * 0.3));
      const dmg = Math.max(1, baseDmg + Math.floor(Math.random() * variance * 2 - variance));

      sound.sfx('hurt');
      shake(16, 4);
      flash('#ff4444', 6);
      party.player.hp = Math.max(0, party.player.hp - dmg);
      await this.say(`${party.player.name}は ${dmg}の ダメージをうけた！`);
    }

    if (party.player.hp <= 0) {
      await this.defeat();
      return;
    }

    this.state = 'player_command';
  }

  private async win(): Promise<void> {
    this.state = 'victory';
    sound.sfx('enemyDie');
    await this.say(`${this.monster.name}を たおした！`);

    // 勝利ジングル
    await sound.jingle('victory');

    party.player.gold += this.monster.gold;
    await this.say(`${this.monster.gold}ゴールドを 手に入れた！`);

    const result = party.gainExp(this.monster.exp);
    await this.say(`${party.player.name}は ${this.monster.exp}ポイントの けいけんちを かくとく！`);

    if (result.leveledUp) {
      sound.sfx('confirm');
      await sound.jingle('levelup');
      await this.say(`${party.player.name}は レベル${result.newLevel}に あがった！`);
      for (const spName of result.learnedSpells) {
        await this.say(`${spName}の じゅもんを おぼえた！`);
      }
    }

    this.finish({ won: true, escaped: false, gameover: false });
  }

  private async defeat(): Promise<void> {
    this.state = 'defeat';
    await sound.jingle('defeat');
    await this.say(`${party.player.name}は たおれてしまった……`);
    party.player.hp = party.player.maxHp;
    party.player.gold = Math.floor(party.player.gold / 2);
    this.finish({ won: false, escaped: false, gameover: true });
  }

  private finish(res: BattleResult): void {
    const cb = this.onFinishCallback;
    this.onFinishCallback = null;
    cb?.(res);
  }

  update(frame: number): void {
    if (this.monsterShake > 0) this.monsterShake--;
    if (this.monsterBlink > 0) this.monsterBlink--;

    // メッセージ送り待ち
    if (this.waitingPrompt) {
      if (input.pressed('a') || input.pressed('b')) {
        sound.sfx('confirm');
        input.consume();
        this.waitingPrompt = false;
        const res = this.resolveMessage;
        this.resolveMessage = null;
        res?.();
      }
      return;
    }

    if (this.state === 'player_command') {
      if (input.pressed('up')) {
        this.commandCursor = (this.commandCursor - 1 + 4) % 4;
        sound.sfx('cursor');
        input.consume();
      } else if (input.pressed('down')) {
        this.commandCursor = (this.commandCursor + 1) % 4;
        sound.sfx('cursor');
        input.consume();
      } else if (input.pressed('a')) {
        input.consume();
        sound.sfx('confirm');
        const cmd = this.COMMANDS[this.commandCursor];
        if (cmd === 'たたかう') {
          void this.playerAttack();
        } else if (cmd === 'じゅもん') {
          if (party.player.spells.length === 0) {
            void this.say('唱えられる呪文が ない！').then(() => {
              this.state = 'player_command';
            });
          } else {
            this.state = 'spell_select';
            this.subCursor = 0;
          }
        } else if (cmd === 'どうぐ') {
          if (party.player.items.length === 0) {
            void this.say('道具を持っていない！').then(() => {
              this.state = 'player_command';
            });
          } else {
            this.state = 'item_select';
            this.subCursor = 0;
          }
        } else if (cmd === 'にげる') {
          void this.tryRun();
        }
      }
      return;
    }

    if (this.state === 'spell_select') {
      const spells = party.player.spells;
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
        void this.castSpell(spells[this.subCursor]);
      } else if (input.pressed('b')) {
        input.consume();
        this.state = 'player_command';
        sound.sfx('cancel');
      }
      return;
    }

    if (this.state === 'item_select') {
      const items = party.player.items;
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
        void this.useItem(this.subCursor);
      } else if (input.pressed('b')) {
        input.consume();
        this.state = 'player_command';
        sound.sfx('cancel');
      }
      return;
    }
  }

  draw(frame: number): void {
    // 背景（暗い黒紫のグラデーション）
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#060410');
    bgGrad.addColorStop(0.6, '#18122c');
    bgGrad.addColorStop(1, '#080514');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // プレイヤー簡易ステータスウィンドウ (左上)
    drawWindow(12, 12, 84, 50);
    const p = party.player;
    drawText(p.name, 20, 18, '#f4c95d', 10);
    drawText(`H: ${p.hp}/${p.maxHp}`, 20, 31, p.hp <= p.maxHp * 0.25 ? '#ff6666' : '#ffffff', 10);
    drawText(`M: ${p.mp}/${p.maxMp}`, 20, 44, '#88aaff', 10);

    // モンスター画像描画 (中央上部)
    if (this.monsterImg && this.monsterImg.complete && this.monsterHp > 0) {
      if (this.monsterBlink === 0 || Math.floor(frame / 3) % 2 === 0) {
        const shakeX = this.monsterShake > 0 ? (Math.random() * 6 - 3) : 0;
        const img = this.monsterImg;
        // モンスターの原寸に合わせてスケーリング
        const maxDrawW = this.monster.boss ? 140 : 100;
        const maxDrawH = this.monster.boss ? 140 : 100;
        const scale = Math.min(maxDrawW / img.width, maxDrawH / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = (W - dw) / 2 + shakeX;
        const dy = 24 + (maxDrawH - dh) / 2;

        ctx.drawImage(img, dx, dy, dw, dh);
      }
    }

    // コマンドウィンドウ (左下)
    if (this.state === 'player_command' || this.state === 'spell_select' || this.state === 'item_select') {
      const cwX = 12;
      const cwY = H - 94;
      const cwW = 76;
      const cwH = 80;
      drawWindow(cwX, cwY, cwW, cwH, 'コマンド');

      for (let i = 0; i < this.COMMANDS.length; i++) {
        drawText(this.COMMANDS[i], cwX + 16, cwY + 12 + i * 16, '#ffffff', 11);
      }
      drawCursor(cwX + 6, cwY + 13 + this.commandCursor * 16, this.state !== 'player_command', frame);
    }

    // 呪文選択ウィンドウ (右側)
    if (this.state === 'spell_select') {
      const swX = 94;
      const swY = H - 100;
      const swW = 150;
      const swH = 90;
      drawWindow(swX, swY, swW, swH, 'じゅもん');

      party.player.spells.forEach((id, idx) => {
        const sp = SPELLS[id];
        if (sp) {
          drawText(sp.name, swX + 16, swY + 12 + idx * 16, '#ffffff', 10);
          drawText(`${sp.mp}MP`, swX + swW - 12, swY + 12 + idx * 16, '#88aaff', 10, 'right');
        }
      });
      drawCursor(swX + 6, swY + 13 + this.subCursor * 16, false, frame);
    }

    // 道具選択ウィンドウ (右側)
    if (this.state === 'item_select') {
      const iwX = 94;
      const iwY = H - 100;
      const iwW = 150;
      const iwH = 90;
      drawWindow(iwX, iwY, iwW, iwH, 'どうぐ');

      party.player.items.forEach((id, idx) => {
        const item = ITEMS[id];
        if (item) {
          drawText(item.name, iwX + 16, iwY + 12 + idx * 14, '#ffffff', 10);
        }
      });
      drawCursor(iwX + 6, iwY + 13 + this.subCursor * 14, false, frame);
    }

    // メッセージウィンドウ (下部全体)
    if (this.state !== 'player_command' && this.state !== 'spell_select' && this.state !== 'item_select') {
      const mwX = 12;
      const mwY = H - 60;
      const mwW = W - 24;
      const mwH = 50;
      drawWindow(mwX, mwY, mwW, mwH);

      const lines = wrapText(this.currentMessage, mwW - 24, 11);
      for (let i = 0; i < Math.min(lines.length, 2); i++) {
        drawText(lines[i], mwX + 12, mwY + 11 + i * 16, '#ffffff', 11);
      }

      if (this.waitingPrompt && Math.floor(frame / 16) % 2 === 0) {
        drawText('▼', mwX + mwW - 16, mwY + mwH - 16, '#f4c95d', 10);
      }
    }
  }
}

export const battleScene = new BattleScene();
