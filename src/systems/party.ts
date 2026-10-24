import { ITEMS, SPELLS } from '../data/items';
import { sound } from '../engine/audio';

export interface PlayerStats {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  exp: number;
  gold: number;
  weapon: string | null;
  armor: string | null;
  shield: string | null;
  items: string[];
  spells: string[];
}

export interface SaveData {
  stats: PlayerStats;
  currentMap: string;
  playerX: number;
  playerY: number;
  openedChests: string[];
  bossDefeated: boolean;
  openingSeen?: boolean;
}

const SAVE_KEY = 'DOTRPG_SAVE_V1';

// レベルごとの必要経験値と成長テーブル
export const LEVEL_TABLE = [
  { exp: 0, hp: 25, mp: 0, atk: 9, def: 4, learn: '' },
  { exp: 15, hp: 32, mp: 6, atk: 12, def: 6, learn: 'heal' },
  { exp: 40, hp: 42, mp: 12, atk: 16, def: 9, learn: 'fire' },
  { exp: 90, hp: 55, mp: 18, atk: 21, def: 13, learn: '' },
  { exp: 170, hp: 70, mp: 26, atk: 27, def: 17, learn: 'healmore' },
  { exp: 300, hp: 90, mp: 35, atk: 34, def: 22, learn: 'thunder' },
  { exp: 500, hp: 115, mp: 45, atk: 42, def: 28, learn: '' },
  { exp: 800, hp: 145, mp: 58, atk: 52, def: 35, learn: '' },
];

class PartySystem {
  player: PlayerStats = {
    name: 'ゆうしゃ',
    level: 1,
    hp: 25,
    maxHp: 25,
    mp: 0,
    maxMp: 0,
    atk: 9,
    def: 4,
    exp: 0,
    gold: 0,
    weapon: null,
    armor: 'cloth_armor',
    shield: null,
    items: [],
    spells: [],
  };

  currentMap = 'castle';
  playerX = 7;
  playerY = 4;
  openedChests: Set<string> = new Set();
  bossDefeated = false;
  openingSeen = false;

  resetNewGame(): void {
    this.player = {
      name: 'ゆうしゃ',
      level: 1,
      hp: 25,
      maxHp: 25,
      mp: 0,
      maxMp: 0,
      atk: 9,
      def: 4,
      exp: 0,
      gold: 0,
      weapon: null,
      armor: 'cloth_armor',
      shield: null,
      items: [],
      spells: [],
    };
    this.currentMap = 'castle';
    this.playerX = 7;
    this.playerY = 4;
    this.openedChests.clear();
    this.bossDefeated = false;
    this.openingSeen = false;
  }

  get totalAtk(): number {
    let a = this.player.atk;
    if (this.player.weapon && ITEMS[this.player.weapon]?.atk) {
      a += ITEMS[this.player.weapon].atk!;
    }
    return a;
  }

  get totalDef(): number {
    let d = this.player.def;
    if (this.player.armor && ITEMS[this.player.armor]?.def) {
      d += ITEMS[this.player.armor].def!;
    }
    if (this.player.shield && ITEMS[this.player.shield]?.def) {
      d += ITEMS[this.player.shield].def!;
    }
    return d;
  }

  get nextExp(): number {
    const nextLvl = this.player.level;
    if (nextLvl >= LEVEL_TABLE.length) return 999999;
    return Math.max(0, LEVEL_TABLE[nextLvl].exp - this.player.exp);
  }

  gainExp(amount: number): { leveledUp: boolean; newLevel: number; learnedSpells: string[] } {
    this.player.exp += amount;
    let leveledUp = false;
    const learnedSpells: string[] = [];

    while (this.player.level < LEVEL_TABLE.length && this.player.exp >= LEVEL_TABLE[this.player.level].exp) {
      const info = LEVEL_TABLE[this.player.level];
      this.player.level++;
      leveledUp = true;
      this.player.maxHp = info.hp;
      this.player.maxMp = info.mp;
      this.player.atk = info.atk;
      this.player.def = info.def;
      this.player.hp = this.player.maxHp;
      this.player.mp = this.player.maxMp;

      if (info.learn && !this.player.spells.includes(info.learn)) {
        this.player.spells.push(info.learn);
        learnedSpells.push(SPELLS[info.learn]?.name || info.learn);
      }
    }

    return { leveledUp, newLevel: this.player.level, learnedSpells };
  }

  addItem(itemId: string): boolean {
    if (this.player.items.length >= 12) return false;
    this.player.items.push(itemId);
    return true;
  }

  removeItem(index: number): void {
    if (index >= 0 && index < this.player.items.length) {
      this.player.items.splice(index, 1);
    }
  }

  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  save(): boolean {
    try {
      const data: SaveData = {
        stats: this.player,
        currentMap: this.currentMap,
        playerX: this.playerX,
        playerY: this.playerY,
        openedChests: Array.from(this.openedChests),
        bossDefeated: this.bossDefeated,
        openingSeen: this.openingSeen,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      sound.sfx('confirm');
      return true;
    } catch (e) {
      console.error('Save failed', e);
      return false;
    }
  }

  load(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data: SaveData = JSON.parse(raw);
      this.player = data.stats;
      this.currentMap = data.currentMap;
      this.playerX = data.playerX;
      this.playerY = data.playerY;
      this.openedChests = new Set(data.openedChests);
      this.bossDefeated = data.bossDefeated ?? false;
      this.openingSeen = data.openingSeen ?? true;
      sound.sfx('confirm');
      return true;
    } catch (e) {
      console.error('Load failed', e);
      return false;
    }
  }
}

export const party = new PartySystem();
