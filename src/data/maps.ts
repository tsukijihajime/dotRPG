import type { Dir } from '../engine/sprites';

export interface WarpDef {
  x: number;
  y: number;
  targetMap: string;
  targetX: number;
  targetY: number;
  targetDir?: Dir;
  sfx?: string;
}

export interface ChestDef {
  id: string;
  x: number;
  y: number;
  item: string;
  gold?: number;
}

export interface NpcDef {
  id: string;
  name: string;
  sprite: string;
  x: number;
  y: number;
  dir: Dir;
  dialog: string[];
  action?: 'shop_weapon' | 'shop_item' | 'inn' | 'church' | 'boss_trigger';
}

export interface MapData {
  id: string;
  name: string;
  bgm: string;
  width: number;
  height: number;
  tiles: string[];
  warps: WarpDef[];
  chests: ChestDef[];
  npcs: NpcDef[];
  encounterGroup?: string[];
  encounterRate?: number;
}

// ----------------- 町: はじまりの町 (24x20) -----------------
// 凡例:
// t: 木  g: 草地  ,: 石畳  #: レンガ壁  .: 床  =: カウンター  ~: 池  f: 花壇  b: ベッド  a: 祭壇  D: 扉
const TOWN_ROWS = [
  'tttttttttttttttttttttttt',
  'tggggggggggggggttttttttt',
  'tg######ggg######gttffff',
  'tg#....#ggg#....#gttffff',
  'tg#....#ggg#....#gttffff',
  'tg#..b.#ggg#..=.#gt,,,,,',
  'tg##D###ggg##D###gt,,,,,',
  'tg,,,,,,,,,,,,,,,,,,,ggg',
  'tg,,ffg~~~~~~gff,,,,,ggg',
  'tg,,ffg~~~~~~gff,,,,,ggg',
  'tg,,,,,,,,,,,,,,,,,,,ggg',
  'tg######ggg######g,,gggg',
  'tg#....#ggg#....#g,,gggg',
  'tg#....#ggg#....#g,,gggg',
  'tg#..=.#ggg#..a.#g,,gggg',
  'tg##D###ggg##D###g,,gggg',
  'tg,,,,,,,,,,,,,,,,,,gggg',
  'tg,,gggggggggggggg,,gggg',
  'tg,,,,,,,,,,,,,,,,,,gggg',
  'ttttttttttDDtttttttttttt',
];

// ----------------- お城: ラダ王城 (16x14) -----------------
// 凡例:
// w: 城壁  e: 大理石床  c: 赤絨毯  K: 玉座  D: 扉
const CASTLE_ROWS = [
  'wwwwwwwwwwwwwwww',
  'wweeeeeceeeeeeww',
  'wweeeeeKeeeeeeww',
  'wweeeeeceeeeeeww',
  'wweeeeeceeeeeeww',
  'wweeeeeceeeeeeww',
  'wweeeeeceeeeeeww',
  'wweeeeeceeeeeeww',
  'wweeeeeceeeeeeww',
  'wweeeeeceeeeeeww',
  'wweeeeeceeeeeeww',
  'wweeeeeceeeeeeww',
  'wwweeeeDeeeewwww',
  'wwwwwwwwwwwwwwww',
];

// ----------------- フィールド (32x32) -----------------
// G: 平原  F: 森  M: 山  W: 水  P: 道  B: 橋  T: 町  C: 洞窟  H: 城
const FIELD_ROWS = [
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  'MMGGGGFFFFFFFFFMMMMMMMMMMMMMMMMM',
  'MGGGGFFFFFFFFFFMMMMMMMCGGGGGGMMM',
  'MGGFFFFFFFFFFFFFMMMMMGGGGGGGGMMM',
  'MGGFFFFGGGGFFFFFMMMMMGGGGGGGGGMM',
  'MGGFFFGGGGGGFFFFFMMMMGGFFFFFGGGM',
  'MGFFFGGGGGGGGFFFFMMMMFFFFFFFFFGM',
  'MGFFGGGGGGGGGGFFFMMMFFFFFFFFFFGM',
  'MGGGGGGGGGGGGGGFFFFFFFFFFFFFFFGM',
  'MGGGGGGGGGGGGGGFFFFFFFFWWWWFFFGM',
  'MGGHGGTTGGGGGGFFFFFFWWWWWWWWFGM',
  'MGGGGGGPPGGGGGGFFFFFWWWWWWWWWFGM',
  'MGGGGGGPPPGGGGGFFFFWWWWWWWWWWFGM',
  'MGGGGGGGPPPGGGGFFFFWWWWWWWWWWFGM',
  'MGGGGGGGGPPPGGGFFFFWWWWWWWWWWFGM',
  'MFFFFGGGGGPPGGGGFFFWWWWWWWWWWFGM',
  'MFFFFFGGGGPPPPBPPPPWWWWWWWWWWFGM',
  'MFFFFFFGGGGGGGGPPPPWWWWWWWWWWFGM',
  'MFFFFFFFFGGGGGGGGPPBPPPGGGGFFFGM',
  'MMFFFFFFFFGGGGGGGGPPPGGGGGGFFFGM',
  'MMMFFFFFFFFGGGGGGGPPPGGGGGGFFFGM',
  'MMMMFFFFFFFGGGGGGGPPGGGGGGGFFFGM',
  'MMMMMFFFFFFGGGGGGPPPGGGGGGGFFFGM',
  'MMMMMMFFFFFGGGGGPPPGGGGGGGFFFFGM',
  'MMMMMMMFFFFGGGGPPPGGGGGGGFFFFFGM',
  'MMMMMMMMFFFGGGPPPGGGGGGGFFFFFFGM',
  'MMMMMMMMMFFGGPPPGGGGGGGFFFFFFFGM',
  'MMMMMMMMMMFGPPPGGGGGGGFFFFFFFFGM',
  'MMMMMMMMMMMGPPGGGGGGGFFFFFFFFFGM',
  'MMMMMMMMMMMGPGGGGGGGFFFFFFFFFFGM',
  'MMMMMMMMMMMGGGGGGGGFFFFFFFFFFFGM',
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
];

// ----------------- 洞くつ 1F (20x16) -----------------
// R: 壁  _: 床  >: 降り階段  <: 昇り階段
const CAVE1_ROWS = [
  'RRRRRRRRRRRRRRRRRRRR',
  'RR________RR______RR',
  'RR___RR___RR______RR',
  'RR___RR___________RR',
  'RR___RRRRRRRRR____RR',
  'RR<_______RR______RR',
  'RR________RR______RR',
  'RRRRRR____RR__RRRRRR',
  'RR________RR______RR',
  'RR________RR______RR',
  'RR____RRRRRR______RR',
  'RR____RR__________RR',
  'RR____RR___RRRRR__RR',
  'RR_________RR_____RR',
  'RR_________RR___>_RR',
  'RRRRRRRRRRRRRRRRRRRR',
];

// ----------------- 洞くつ 2F (ボスフロア) (20x16) -----------------
const CAVE2_ROWS = [
  'RRRRRRRRRRRRRRRRRRRR',
  'RR<_______RR______RR',
  'RR________RR______RR',
  'RR___RRRRRRR______RR',
  'RR___RR___________RR',
  'RR___RR___RRRRRRRRRR',
  'RR___RR___________RR',
  'RR___RR___________RR',
  'RR________________RR',
  'RRRRRR____RR______RR',
  'RR________RR______RR',
  'RR___RRRRRRR______RR',
  'RR________RR______RR',
  'RR________RR______RR',
  'RR________________RR',
  'RRRRRRRRRRRRRRRRRRRR',
];

export const MAPS: Record<string, MapData> = {
  town: {
    id: 'town',
    name: 'ルルの町',
    bgm: 'town',
    width: 24,
    height: 20,
    tiles: TOWN_ROWS,
    warps: [
      { x: 10, y: 19, targetMap: 'field', targetX: 7, targetY: 11, targetDir: 'down', sfx: 'stairs' },
      { x: 11, y: 19, targetMap: 'field', targetX: 7, targetY: 11, targetDir: 'down', sfx: 'stairs' },
    ],
    chests: [],
    npcs: [
      {
        id: 'elder',
        name: '村長',
        sprite: 'elder',
        x: 17,
        y: 4,
        dir: 'down',
        dialog: [
          'よくぞ参られた、若き旅人よ！',
          '北東の山奥にある「やみの洞くつ」に\nおそろしい魔導王ザルバがよみがえったのじゃ。',
          'どうか町の装備をととのえ、\n魔導王を討ち滅ぼしてくだされ！',
        ],
      },
      {
        id: 'innkeeper',
        name: '宿屋の主人',
        sprite: 'innkeeper',
        x: 5,
        y: 5,
        dir: 'down',
        dialog: ['旅の宿屋へようこそ！\n一晩泊まればHPもMPも全回復するよ。（10G）'],
        action: 'inn',
      },
      {
        id: 'priest',
        name: '神父',
        sprite: 'priest',
        x: 17,
        y: 14,
        dir: 'down',
        dialog: ['おお神よ、この者に祝福を……\nここまでの旅の記録をお残しになりますか？'],
        action: 'church',
      },
      {
        id: 'shop_item',
        name: '道具屋',
        sprite: 'merchant',
        x: 5,
        y: 14,
        dir: 'down',
        dialog: ['いらっしゃい！\n旅に欠かせない道具をそろえているよ！'],
        action: 'shop_item',
      },
      {
        id: 'soldier',
        name: '兵士',
        sprite: 'soldier',
        x: 12,
        y: 8,
        dir: 'down',
        dialog: [
          '外のモンスターは手ごわいぞ。',
          'まずは町のまわりでスライムなどを倒して\nレベルを上げると安全だ！',
        ],
      },
      {
        id: 'woman',
        name: '町娘',
        sprite: 'woman',
        x: 8,
        y: 13,
        dir: 'right',
        dialog: ['南東の道具屋では武器やよろいも\n少し扱ってくれるみたいよ。'],
      },
    ],
  },

  castle: {
    id: 'castle',
    name: 'ラダ王城',
    bgm: 'castle',
    width: 16,
    height: 14,
    tiles: CASTLE_ROWS,
    warps: [
      { x: 7, y: 12, targetMap: 'field', targetX: 3, targetY: 11, targetDir: 'down', sfx: 'stairs' },
    ],
    chests: [
      { id: 'castle_chest_1', x: 3, y: 3, item: 'club' },
      { id: 'castle_chest_2', x: 12, y: 3, item: 'herb' },
    ],
    npcs: [
      {
        id: 'king',
        name: '国王',
        sprite: 'king',
        x: 7,
        y: 2,
        dir: 'down',
        dialog: [
          'おお、若き勇者よ！\n世界の平和はおぬしの双肩にかかっておる。',
          '町で装備をととのえ、北東の山奥にある\n「やみの洞くつ」の魔導王ザルバを倒すのじゃ！',
        ],
      },
      {
        id: 'minister',
        name: '大臣',
        sprite: 'elder',
        x: 9,
        y: 3,
        dir: 'left',
        dialog: [
          '王様から授かった支度金50Gと、\n左右の宝箱にある品をお役立てください。',
          '南の扉から城を出て東へ少し歩けば、\n「ルルの町」がございますぞ。',
        ],
      },
      {
        id: 'guard_left',
        name: '近衛兵',
        sprite: 'soldier',
        x: 5,
        y: 6,
        dir: 'right',
        dialog: [
          '我ら近衛兵も命を賭して王城を死守する！\nどうかご無事で、勇者殿！',
        ],
      },
      {
        id: 'guard_right',
        name: '近衛兵',
        sprite: 'soldier',
        x: 9,
        y: 6,
        dir: 'left',
        dialog: [
          '外の魔物は凶暴です。\n薬草や防具をしっかり準備してください！',
        ],
      },
    ],
  },

  field: {
    id: 'field',
    name: 'アレフ平原',
    bgm: 'field',
    width: 32,
    height: 32,
    tiles: FIELD_ROWS,
    warps: [
      { x: 3, y: 10, targetMap: 'castle', targetX: 7, targetY: 11, targetDir: 'up', sfx: 'stairs' },
      { x: 6, y: 10, targetMap: 'town', targetX: 10, targetY: 18, targetDir: 'up', sfx: 'stairs' },
      { x: 7, y: 10, targetMap: 'town', targetX: 10, targetY: 18, targetDir: 'up', sfx: 'stairs' },
      { x: 22, y: 2, targetMap: 'cave1', targetX: 2, targetY: 5, targetDir: 'right', sfx: 'stairs' },
    ],
    chests: [],
    npcs: [],
    encounterGroup: ['jelly', 'bat', 'mushroom'],
    encounterRate: 0.08,
  },

  cave1: {
    id: 'cave1',
    name: 'やみの洞くつ B1F',
    bgm: 'cave',
    width: 20,
    height: 16,
    tiles: CAVE1_ROWS,
    warps: [
      { x: 2, y: 5, targetMap: 'field', targetX: 22, targetY: 3, targetDir: 'down', sfx: 'stairs' },
      { x: 16, y: 14, targetMap: 'cave2', targetX: 2, targetY: 1, targetDir: 'right', sfx: 'stairs' },
    ],
    chests: [
      { id: 'c1_herb', x: 17, y: 1, item: 'magic_water' },
      { id: 'c1_gold', x: 2, y: 13, item: 'copper_sword', gold: 50 },
    ],
    npcs: [],
    encounterGroup: ['bat', 'mushroom', 'skeleton', 'wisp'],
    encounterRate: 0.1,
  },

  cave2: {
    id: 'cave2',
    name: 'やみの洞くつ B2F',
    bgm: 'boss',
    width: 20,
    height: 16,
    tiles: CAVE2_ROWS,
    warps: [
      { x: 2, y: 1, targetMap: 'cave1', targetX: 16, targetY: 14, targetDir: 'left', sfx: 'stairs' },
    ],
    chests: [
      { id: 'c2_blade', x: 17, y: 1, item: 'iron_armor' },
    ],
    npcs: [
      {
        id: 'boss_npc',
        name: '魔導王ザルバ',
        sprite: 'boss',
        x: 16,
        y: 8,
        dir: 'left',
        dialog: [
          'ククク……よくぞここまでたどり着いた。',
          'だが我が闇の魔力の前では、\n貴様のごとき羽虫など消し炭にすぎぬ！',
          '死をもって貴様の愚かさを悔いるがよい！！',
        ],
        action: 'boss_trigger',
      },
    ],
    encounterGroup: ['skeleton', 'wisp', 'golem'],
    encounterRate: 0.09,
  },
};
