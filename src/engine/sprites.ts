// マップチップとキャラクターのドット絵をコードで生成する
// （モンスターとタイトル画像は AI 生成画像を public/assets から読み込む）

export type Dir = 'down' | 'up' | 'left' | 'right';

function mk(w = 16, h = 16): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  return [c, g];
}

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type G = CanvasRenderingContext2D;
const px = (g: G, x: number, y: number, c: string) => {
  g.fillStyle = c;
  g.fillRect(x, y, 1, 1);
};
const rect = (g: G, x: number, y: number, w: number, h: number, c: string) => {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
};
const disc = (g: G, cx: number, cy: number, r: number, c: string) => {
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) px(g, x, y, c);
};

// ---------------- タイル ----------------
function grass(g: G, seed = 1): void {
  const r = rng(seed);
  rect(g, 0, 0, 16, 16, '#3f9a3a');
  for (let i = 0; i < 6; i++) {
    const x = Math.floor(r() * 13) + 1;
    const y = Math.floor(r() * 13) + 1;
    px(g, x, y, '#2c7a2e');
    px(g, x + 2, y, '#2c7a2e');
    px(g, x + 1, y + 1, '#2c7a2e');
  }
  for (let i = 0; i < 5; i++) px(g, Math.floor(r() * 16), Math.floor(r() * 16), '#63bd52');
}

function tree(g: G, seed = 3): void {
  grass(g, seed);
  // 影
  for (let x = 3; x < 13; x++) px(g, x, 14, '#2a6a28');
  rect(g, 7, 11, 2, 4, '#6b4423');
  px(g, 7, 14, '#4a2e16');
  disc(g, 8, 7, 6.6, '#0e3a18');
  disc(g, 8, 7, 5.8, '#1f6e2c');
  disc(g, 6.5, 5.5, 3.2, '#2f8c38');
  disc(g, 5.8, 4.8, 1.4, '#4cae4a');
  const r = rng(seed + 9);
  for (let i = 0; i < 5; i++) px(g, 4 + Math.floor(r() * 9), 4 + Math.floor(r() * 7), '#175a24');
}

function mountain(g: G): void {
  grass(g, 5);
  for (let y = 2; y < 16; y++) {
    const hw = Math.floor((y - 2) * 0.55) + 1;
    for (let x = 8 - hw; x < 8 + hw; x++) {
      const left = x < 8;
      let c = left ? '#a07c52' : '#7a5b3a';
      if (y < 6) c = left ? '#f4f6fa' : '#c4ccd8';
      else if (y === 6 && (x % 2 === 0)) c = left ? '#f4f6fa' : '#c4ccd8';
      px(g, x, y, c);
    }
    px(g, 8 - hw - 1, y, '#3d2b1a');
    px(g, 8 + hw, y, '#3d2b1a');
  }
  px(g, 7, 1, '#3d2b1a');
  px(g, 8, 1, '#3d2b1a');
  px(g, 6, 9, '#7a5b3a');
  px(g, 5, 12, '#7a5b3a');
  px(g, 10, 11, '#5e4428');
}

function water(g: G, frame: number, light = false): void {
  rect(g, 0, 0, 16, 16, light ? '#3a8ae0' : '#2a62c6');
  for (let y = 0; y < 16; y += 4) rect(g, 0, y + 2, 16, 1, light ? '#3478cc' : '#2354ae');
  const hi = light ? '#d8f0ff' : '#86b8ff';
  const off = frame * 4;
  for (const [x, y] of [
    [2, 1],
    [10, 5],
    [4, 9],
    [12, 13],
  ]) {
    const xx = (x + off) % 16;
    px(g, xx, y, hi);
    px(g, (xx + 1) % 16, y, hi);
    px(g, (xx + 2) % 16, y + 1, hi);
  }
}

function path(g: G): void {
  const r = rng(11);
  rect(g, 0, 0, 16, 16, '#cdac6c');
  for (let i = 0; i < 7; i++) {
    const x = Math.floor(r() * 15);
    const y = Math.floor(r() * 15);
    px(g, x, y, '#a88a4e');
    px(g, x + 1, y, '#a88a4e');
    px(g, x, y - 1 < 0 ? 0 : y - 1, '#e4c890');
  }
}

function bridge(g: G, frame: number): void {
  water(g, frame);
  rect(g, 0, 2, 16, 12, '#a8743c');
  for (let x = 3; x < 16; x += 4) rect(g, x, 2, 1, 12, '#6b4423');
  rect(g, 0, 1, 16, 2, '#5a3a1e');
  rect(g, 0, 13, 16, 2, '#5a3a1e');
  for (let x = 1; x < 16; x += 4) px(g, x, 7, '#c8945a');
}

function town(g: G): void {
  grass(g, 21);
  const house = (x: number, y: number, roof: string) => {
    rect(g, x, y + 4, 7, 5, '#efe6d0');
    rect(g, x, y + 8, 7, 1, '#a8987a');
    for (let i = 0; i < 4; i++) rect(g, x - 1 + i, y + 3 - i, 9 - i * 2, 1, roof);
    rect(g, x - 1, y + 3, 9, 1, '#7a2418');
    rect(g, x + 3, y + 6, 2, 3, '#6b4423');
    px(g, x + 1, y + 5, '#4a7ad0');
  };
  house(1, 5, '#c8402c');
  house(8, 2, '#3a6ad0');
}

function cave(g: G): void {
  mountain(g);
  disc(g, 8, 13.5, 4.2, '#2a1810');
  disc(g, 8, 14, 3.4, '#0a0608');
  rect(g, 5, 15, 6, 1, '#0a0608');
}

function stone(g: G): void {
  rect(g, 0, 0, 16, 16, '#8e8676');
  for (let row = 0; row < 4; row++) {
    const off = row % 2 === 0 ? 0 : 4;
    for (let col = -1; col < 3; col++) {
      const x = col * 8 + off;
      rect(g, x + 1, row * 4 + 1, 6, 3, '#bdb5a5');
      rect(g, x + 1, row * 4 + 1, 6, 1, '#d6cfc0');
    }
  }
}

function brick(g: G): void {
  rect(g, 0, 0, 16, 16, '#5e2a1e');
  for (let row = 0; row < 4; row++) {
    const off = row % 2 === 0 ? 0 : 4;
    for (let col = -1; col < 3; col++) {
      const x = col * 8 + off;
      rect(g, x, row * 4, 7, 3, '#a24e36');
      rect(g, x, row * 4, 7, 1, '#c26a4c');
    }
  }
}

function floor(g: G): void {
  const r = rng(31);
  rect(g, 0, 0, 16, 16, '#b9844c');
  for (let y = 3; y < 16; y += 4) rect(g, 0, y, 16, 1, '#8d5c30');
  for (let row = 0; row < 4; row++) {
    const x = Math.floor(r() * 16);
    rect(g, x, row * 4, 1, 3, '#8d5c30');
    px(g, Math.floor(r() * 16), row * 4 + 1, '#d09a60');
  }
}

function counter(g: G): void {
  floor(g);
  rect(g, 0, 2, 16, 12, '#4a2a12');
  rect(g, 0, 3, 16, 6, '#d8a868');
  rect(g, 0, 3, 16, 1, '#f0c890');
  rect(g, 0, 9, 16, 4, '#9a6434');
  for (let x = 2; x < 16; x += 5) rect(g, x, 9, 1, 4, '#6b4020');
}

function flowers(g: G): void {
  grass(g, 41);
  for (const [x, y, c] of [
    [3, 3, '#e8505a'],
    [11, 4, '#f4d040'],
    [6, 10, '#f4f0ff'],
    [12, 11, '#e8505a'],
    [2, 13, '#f4d040'],
  ] as [number, number, string][]) {
    px(g, x, y - 1, c);
    px(g, x - 1, y, c);
    px(g, x + 1, y, c);
    px(g, x, y + 1, c);
    px(g, x, y, '#fff6a0');
  }
}

function bed(g: G): void {
  floor(g);
  rect(g, 2, 1, 12, 14, '#5a3418');
  rect(g, 3, 2, 10, 4, '#f4f0e6');
  rect(g, 4, 3, 8, 2, '#ffffff');
  rect(g, 3, 6, 10, 8, '#3a6ad0');
  rect(g, 3, 6, 10, 1, '#6a9af0');
  for (let x = 4; x < 13; x += 3) rect(g, x, 8, 1, 5, '#2a50a8');
}

function altar(g: G): void {
  floor(g);
  rect(g, 2, 7, 12, 8, '#a89c88');
  rect(g, 2, 7, 12, 2, '#efe6d6');
  rect(g, 3, 10, 10, 4, '#d0c6b4');
  rect(g, 7, 0, 2, 7, '#f4c94a');
  rect(g, 5, 2, 6, 2, '#f4c94a');
  px(g, 7, 0, '#fff4c0');
}

function door(g: G): void {
  brick(g);
  rect(g, 3, 3, 10, 13, '#2a160a');
  rect(g, 4, 2, 8, 1, '#2a160a');
  rect(g, 4, 4, 8, 12, '#7a4622');
  rect(g, 5, 3, 6, 1, '#7a4622');
  for (let x = 6; x < 12; x += 3) rect(g, x, 4, 1, 12, '#5a3214');
  px(g, 10, 10, '#f4c94a');
}

function rock(g: G, seed = 51): void {
  const r = rng(seed);
  rect(g, 0, 0, 16, 16, '#241e2e');
  for (let i = 0; i < 4; i++) {
    const cx = 2 + r() * 12;
    const cy = 2 + r() * 12;
    const rad = 3 + r() * 2.5;
    disc(g, cx + 0.6, cy + 0.6, rad, '#16121c');
    disc(g, cx, cy, rad, '#4a3f58');
    disc(g, cx - 0.8, cy - 0.8, rad * 0.5, '#625574');
  }
}

function caveFloor(g: G): void {
  const r = rng(61);
  rect(g, 0, 0, 16, 16, '#4b3c35');
  for (let i = 0; i < 10; i++) px(g, Math.floor(r() * 16), Math.floor(r() * 16), r() > 0.5 ? '#5e4c43' : '#3a2e29');
}

function stairs(g: G, down: boolean): void {
  caveFloor(g);
  const cols = down ? ['#a89880', '#7a6a58', '#4e4236', '#221a14'] : ['#4e4236', '#7a6a58', '#a89880', '#d8cbb4'];
  rect(g, 1, 1, 14, 14, '#16100c');
  cols.forEach((c, i) => {
    rect(g, 2, 2 + i * 3, 12, 3, c);
    rect(g, 2, 2 + i * 3, 12, 1, '#00000033');
  });
}

function castleWall(g: G): void {
  rect(g, 0, 0, 16, 16, '#9ea7b8');
  for (let row = 0; row < 4; row++) {
    const off = row % 2 === 0 ? 0 : 4;
    for (let col = -1; col < 3; col++) {
      const x = col * 8 + off;
      rect(g, x, row * 4, 7, 3, '#c2cbd9');
      rect(g, x, row * 4, 7, 1, '#e2e9f5');
      rect(g, x, row * 4 + 2, 7, 1, '#788294');
    }
  }
}

function castleFloor(g: G): void {
  rect(g, 0, 0, 16, 16, '#e8ebf0');
  rect(g, 0, 0, 16, 1, '#ffffff');
  rect(g, 0, 0, 1, 16, '#ffffff');
  rect(g, 15, 0, 1, 16, '#cbd2de');
  rect(g, 0, 15, 16, 1, '#cbd2de');
  px(g, 7, 7, '#cbd2de');
  px(g, 8, 8, '#cbd2de');
}

function carpet(g: G): void {
  castleFloor(g);
  rect(g, 1, 0, 14, 16, '#b81e28');
  rect(g, 2, 0, 12, 16, '#d62839');
  rect(g, 1, 0, 1, 16, '#f4c94a');
  rect(g, 14, 0, 1, 16, '#f4c94a');
  for (let y = 1; y < 16; y += 4) {
    px(g, 4, y, '#981018');
    px(g, 11, y, '#981018');
  }
}

function throne(g: G): void {
  carpet(g);
  rect(g, 3, 1, 10, 14, '#f4c94a');
  rect(g, 4, 2, 8, 11, '#981018');
  rect(g, 5, 3, 6, 9, '#c41e3a');
  px(g, 3, 0, '#fff0a0');
  px(g, 7, 0, '#fff0a0');
  px(g, 8, 0, '#fff0a0');
  px(g, 12, 0, '#fff0a0');
  rect(g, 2, 8, 2, 6, '#f4c94a');
  rect(g, 12, 8, 2, 6, '#f4c94a');
  rect(g, 3, 11, 10, 3, '#981018');
  rect(g, 4, 11, 8, 2, '#d62839');
}

function castleExterior(g: G): void {
  grass(g, 25);
  // 左塔
  rect(g, 1, 4, 4, 10, '#c2cbd9');
  rect(g, 1, 4, 4, 1, '#e2e9f5');
  rect(g, 0, 2, 6, 2, '#3a6ad0');
  px(g, 2, 1, '#3a6ad0');
  // 右塔
  rect(g, 11, 4, 4, 10, '#c2cbd9');
  rect(g, 11, 4, 4, 1, '#e2e9f5');
  rect(g, 10, 2, 6, 2, '#3a6ad0');
  px(g, 12, 1, '#3a6ad0');
  // 中央本館
  rect(g, 4, 6, 8, 8, '#a6b1c2');
  rect(g, 4, 5, 8, 1, '#e2e9f5');
  for (let x = 4; x <= 11; x += 2) px(g, x, 5, '#c2cbd9');
  // 中央門
  rect(g, 7, 10, 2, 4, '#2a160a');
  // 旗
  rect(g, 2, 0, 2, 1, '#f4c94a');
  rect(g, 12, 0, 2, 1, '#f4c94a');
}

export type TileId =
  | 'G' | 'F' | 'M' | 'W' | 'P' | 'B' | 'T' | 'C'
  | 't' | 'g' | ',' | '#' | '.' | '=' | '~' | 'f' | 'b' | 'a' | 'D'
  | 'R' | '_' | '>' | '<'
  | 'K' | 'c' | 'e' | 'w' | 'H';

export interface TileInfo {
  solid: boolean;
  /** エンカウントのしやすさ（0 = 出ない） */
  enc: number;
  frames: HTMLCanvasElement[];
}

export const tiles: Record<string, TileInfo> = {};

function defTile(id: TileId, solid: boolean, enc: number, painter: (g: G, frame: number) => void, frameCount = 1): void {
  const frames: HTMLCanvasElement[] = [];
  for (let f = 0; f < frameCount; f++) {
    const [c, g] = mk();
    painter(g, f);
    frames.push(c);
  }
  tiles[id] = { solid, enc, frames };
}

// ---------------- キャラクター ----------------
const DOWN = [
  '......OOOO......',
  '....OOHHHHOO....',
  '...OHHHHHHHHO...',
  '...OHHHHHHHHO...',
  '..OHHSSSSSSHHO..',
  '..OHSESSSSESHO..',
  '..OHSESSSSESHO..',
  '...OSSSSSSSSO...',
  '....OOSSSSOO....',
  '...OCCCCCCCCO...',
  '..OSOCCCCCCOSO..',
  '..OSODCBBCDOSO..',
  '...OOCCCCCCOO...',
  '....OPPOOPPO....',
  '....OPPO.OFFO...',
  '....OFFO..OO....',
];

const UP = [
  ...DOWN.slice(0, 4),
  '..OHHHHHHHHHHO..',
  '..OHHHHHHHHHHO..',
  '..OHHHHHHHHHHO..',
  '...OHHHHHHHHO...',
  '....OOSSSSOO....',
  '...OCCCCCCCCO...',
  '..OSOCCCCCCOSO..',
  '..OSODCCCCDOSO..',
  ...DOWN.slice(12),
];

const LEFT_BODY = [
  ...DOWN.slice(0, 4),
  '..OSSHHHHHHHO...',
  '..OSESHHHHHHO...',
  '..OSESSHHHHHO...',
  '...OSSSSSSSO....',
  '....OOSSSOO.....',
  '....OCCCCCCO....',
  '....OCSSCCCO....',
  '....ODBBBBDO....',
  '....OCCCCCCO....',
];
const LEFT_A = [...LEFT_BODY, '.....OPPPPO.....', '.....OPPPPO.....', '....OFFFFFO.....'];
const LEFT_B = [...LEFT_BODY, '....OPPOOPPO....', '...OPPO..OPPO...', '...OFFO...OFFO..'];

const mirror = (rows: string[]) => rows.map((r) => r.split('').reverse().join(''));

export interface Palette {
  H: string;
  S?: string;
  E?: string;
  C: string;
  D: string;
  P: string;
  B?: string;
  F?: string;
  O?: string;
}

function paintRows(rows: string[], pal: Record<string, string>): HTMLCanvasElement {
  const [c, g] = mk();
  rows.forEach((row, y) => {
    for (let x = 0; x < 16; x++) {
      const ch = row[x] ?? '.';
      if (ch !== '.' && pal[ch]) px(g, x, y, pal[ch]);
    }
  });
  return c;
}

export type CharSprites = Record<Dir, HTMLCanvasElement[]>;

export function makeCharacter(p: Palette): CharSprites {
  const pal: Record<string, string> = {
    O: p.O ?? '#1a1020',
    E: p.E ?? '#1a1020',
    S: p.S ?? '#f2c6a0',
    B: p.B ?? '#f4c94a',
    F: p.F ?? '#5a3a20',
    H: p.H,
    C: p.C,
    D: p.D,
    P: p.P,
  };
  return {
    down: [paintRows(DOWN, pal), paintRows(mirror(DOWN), pal)],
    up: [paintRows(UP, pal), paintRows(mirror(UP), pal)],
    left: [paintRows(LEFT_A, pal), paintRows(LEFT_B, pal)],
    right: [paintRows(mirror(LEFT_A), pal), paintRows(mirror(LEFT_B), pal)],
  };
}

export const PALETTES: Record<string, Palette> = {
  hero: { H: '#6b3a1e', C: '#3a6ae0', D: '#2a4aa8', P: '#4a3a6a', F: '#7a4a22' },
  elder: { H: '#ececec', C: '#7a4aa0', D: '#5a3080', P: '#5a3080', B: '#c8a040' },
  woman: { H: '#e8a030', C: '#e86090', D: '#b84070', P: '#e86090', B: '#fff0f0' },
  soldier: { H: '#a0a8b8', C: '#8890a0', D: '#606878', P: '#505868', B: '#c84030' },
  priest: { H: '#e8e4f0', C: '#f0ecf8', D: '#b8b0d0', P: '#c8c0e0' },
  merchant: { H: '#3a2a1a', C: '#3a9a50', D: '#2a7038', P: '#6a4a2a' },
  kid: { H: '#d05030', C: '#f0c040', D: '#c09020', P: '#4a70c0' },
  innkeeper: { H: '#5a3a2a', C: '#c86a3a', D: '#9a4a2a', P: '#5a4a3a', B: '#f0e0c0' },
  oldwoman: { H: '#c8c8d0', C: '#6a8a6a', D: '#4a6a4a', P: '#4a6a4a' },
  man: { H: '#2a2a3a', C: '#c8a050', D: '#9a7830', P: '#4a4a5a' },
  king: { H: '#f4c94a', S: '#f2c6a0', C: '#c41e3a', D: '#8b0000', P: '#3a1a1a', B: '#fff0f0', F: '#5a3a20' },
  boss: { H: '#3a1a4a', S: '#7a6a8a', E: '#ff3030', C: '#5a2a7a', D: '#3a1a5a', P: '#2a1a3a', F: '#1a1020' },
};

export const chars: Record<string, CharSprites> = {};

// ---------------- 宝箱 ----------------
export const chestSprites: { closed: HTMLCanvasElement; open: HTMLCanvasElement } = {} as never;

function makeChest(open: boolean): HTMLCanvasElement {
  const [c, g] = mk();
  rect(g, 2, 5, 12, 10, '#1a1020');
  rect(g, 3, 6, 10, 8, '#a8642a');
  rect(g, 3, 10, 10, 1, '#f4c94a');
  rect(g, 7, 6, 2, 8, '#f4c94a');
  if (open) {
    rect(g, 3, 6, 10, 3, '#2a160a');
    rect(g, 2, 1, 12, 5, '#1a1020');
    rect(g, 3, 2, 10, 3, '#c07a3a');
    rect(g, 3, 4, 10, 1, '#f4c94a');
  } else {
    rect(g, 3, 6, 10, 1, '#d08a48');
    rect(g, 7, 9, 2, 3, '#fff0a0');
  }
  return c;
}

// ---------------- 初期化 ----------------
export function initSprites(): void {
  defTile('G', false, 1, (g) => grass(g, 1));
  defTile('F', false, 1.6, (g) => tree(g, 3));
  defTile('M', true, 0, mountain);
  defTile('W', true, 0, (g, f) => water(g, f), 2);
  defTile('P', false, 0.6, path);
  defTile('B', false, 0, (g, f) => bridge(g, f), 2);
  defTile('T', false, 0, town);
  defTile('C', false, 0, cave);

  defTile('t', true, 0, (g) => tree(g, 7));
  defTile('g', false, 0, (g) => grass(g, 17));
  defTile(',', false, 0, stone);
  defTile('#', true, 0, brick);
  defTile('.', false, 0, floor);
  defTile('=', true, 0, counter);
  defTile('~', true, 0, (g, f) => water(g, f, true), 2);
  defTile('f', false, 0, flowers);
  defTile('b', true, 0, bed);
  defTile('a', true, 0, altar);
  defTile('D', false, 0, door);

  defTile('w', true, 0, castleWall);
  defTile('e', false, 0, castleFloor);
  defTile('c', false, 0, carpet);
  defTile('K', true, 0, throne);
  defTile('H', false, 0, castleExterior);

  defTile('R', true, 0, (g) => rock(g));
  defTile('_', false, 1, caveFloor);
  defTile('>', false, 0, (g) => stairs(g, true));
  defTile('<', false, 0, (g) => stairs(g, false));

  for (const [k, p] of Object.entries(PALETTES)) chars[k] = makeCharacter(p);
  chestSprites.closed = makeChest(false);
  chestSprites.open = makeChest(true);
}
