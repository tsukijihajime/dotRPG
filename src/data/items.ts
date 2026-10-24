// アイテム・装備・呪文・モンスター・NPC等のマスターデータ

export type ItemType = 'consumable' | 'weapon' | 'armor' | 'shield';

export interface ItemDef {
  id: string;
  name: string;
  type: ItemType;
  price: number;
  desc: string;
  atk?: number;
  def?: number;
  healHp?: number;
  healMp?: number;
}

export const ITEMS: Record<string, ItemDef> = {
  herb: { id: 'herb', name: 'やくそう', type: 'consumable', price: 8, desc: 'HPを約35かいふく', healHp: 35 },
  magic_water: { id: 'magic_water', name: 'まほうのせいすい', type: 'consumable', price: 30, desc: 'MPを約20かいふく', healMp: 20 },
  club: { id: 'club', name: 'こんぼう', type: 'weapon', price: 30, desc: 'こうげき力 +4', atk: 4 },
  copper_sword: { id: 'copper_sword', name: 'どうのつるぎ', type: 'weapon', price: 100, desc: 'こうげき力 +10', atk: 10 },
  iron_sword: { id: 'iron_sword', name: 'はがねのつるぎ', type: 'weapon', price: 250, desc: 'こうげき力 +18', atk: 18 },
  light_blade: { id: 'light_blade', name: 'ひかりのつるぎ', type: 'weapon', price: 600, desc: 'こうげき力 +28', atk: 28 },
  cloth_armor: { id: 'cloth_armor', name: 'ぬののふく', type: 'armor', price: 20, desc: 'しゅび力 +2', def: 2 },
  leather_armor: { id: 'leather_armor', name: 'かわのよろい', type: 'armor', price: 70, desc: 'しゅび力 +6', def: 6 },
  chain_mail: { id: 'chain_mail', name: 'くさりかたびら', type: 'armor', price: 180, desc: 'しゅび力 +12', def: 12 },
  iron_armor: { id: 'iron_armor', name: 'てつのよろい', type: 'armor', price: 400, desc: 'しゅび力 +20', def: 20 },
  leather_shield: { id: 'leather_shield', name: 'かわのたて', type: 'shield', price: 40, desc: 'しゅび力 +3', def: 3 },
  iron_shield: { id: 'iron_shield', name: 'てつのたて', type: 'shield', price: 120, desc: 'しゅび力 +8', def: 8 },
};

export interface SpellDef {
  id: string;
  name: string;
  mp: number;
  desc: string;
  target: 'enemy' | 'self';
  heal?: number;
  damage?: [number, number];
  sfx: string;
}

export const SPELLS: Record<string, SpellDef> = {
  heal: { id: 'heal', name: 'ホイミ', mp: 3, desc: 'HPを約35かいふく', target: 'self', heal: 35, sfx: 'heal' },
  fire: { id: 'fire', name: 'メラ', mp: 2, desc: '小さな火の玉で攻撃', target: 'enemy', damage: [12, 18], sfx: 'fire' },
  thunder: { id: 'thunder', name: 'ライデイン', mp: 6, desc: 'いかずちで大ダメージ', target: 'enemy', damage: [36, 52], sfx: 'thunder' },
  healmore: { id: 'healmore', name: 'ベホイミ', mp: 7, desc: 'HPを約85かいふく', target: 'self', heal: 85, sfx: 'heal' },
};

export interface MonsterDef {
  id: string;
  name: string;
  sprite: string;
  maxHp: number;
  atk: number;
  def: number;
  exp: number;
  gold: number;
  spells?: string[];
  boss?: boolean;
}

export const MONSTERS: Record<string, MonsterDef> = {
  jelly: {
    id: 'jelly',
    name: 'リーフスライム',
    sprite: 'jelly.png',
    maxHp: 12,
    atk: 8,
    def: 3,
    exp: 4,
    gold: 5,
  },
  bat: {
    id: 'bat',
    name: 'オオコウモリ',
    sprite: 'bat.png',
    maxHp: 18,
    atk: 12,
    def: 5,
    exp: 7,
    gold: 9,
  },
  mushroom: {
    id: 'mushroom',
    name: 'マッシュおやじ',
    sprite: 'mushroom.png',
    maxHp: 25,
    atk: 15,
    def: 8,
    exp: 12,
    gold: 15,
  },
  skeleton: {
    id: 'skeleton',
    name: 'がいこつへい',
    sprite: 'skeleton.png',
    maxHp: 38,
    atk: 22,
    def: 12,
    exp: 22,
    gold: 28,
  },
  wisp: {
    id: 'wisp',
    name: 'ひのたまこぞう',
    sprite: 'wisp.png',
    maxHp: 32,
    atk: 20,
    def: 10,
    exp: 26,
    gold: 32,
    spells: ['fire'],
  },
  golem: {
    id: 'golem',
    name: 'ロックゴーレム',
    sprite: 'golem.png',
    maxHp: 65,
    atk: 32,
    def: 22,
    exp: 50,
    gold: 60,
  },
  boss: {
    id: 'boss',
    name: '魔導王ザルバ',
    sprite: 'boss.png',
    maxHp: 220,
    atk: 42,
    def: 25,
    exp: 300,
    gold: 500,
    spells: ['fire', 'thunder'],
    boss: true,
  },
};
