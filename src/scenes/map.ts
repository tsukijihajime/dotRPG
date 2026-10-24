import { W, H, ctx, TILE } from '../engine/screen';
import { input } from '../engine/input';
import { sound } from '../engine/audio';
import { fadeOut, fadeIn, flash } from '../engine/fx';
import { tiles, chars, chestSprites, type Dir } from '../engine/sprites';
import { MAPS, type MapData } from '../data/maps';
import { ITEMS } from '../data/items';
import { party } from '../systems/party';
import { dialog } from '../ui/dialog';
import { fieldMenu } from '../ui/menu';
import { shopUI } from '../ui/shop';

export class MapScene {
  currentMapData!: MapData;

  // プレイヤー移動状態 (グリッド歩行)
  playerX = 10;
  playerY = 17;
  fromX = 10;
  fromY = 17;
  playerDir: Dir = 'down';
  isMoving = false;
  moveProgress = 0; // 0..1
  moveSpeed = 0.125; // 8フレームで1マス移動
  walkAnimFrame = 0;

  // ステップ数カウント（エンカウント用）
  stepCount = 0;

  onEncounterCallback: ((monsterId: string) => void) | null = null;
  onBossEncounterCallback: (() => void) | null = null;
  onEndingCallback: (() => void) | null = null;

  init(
    mapId: string,
    x: number,
    y: number,
    dir: Dir,
    onEncounter: (monsterId: string) => void,
    onBoss: () => void,
    onEnding: () => void
  ): void {
    this.currentMapData = MAPS[mapId] || MAPS['town'];
    this.playerX = x;
    this.playerY = y;
    this.fromX = x;
    this.fromY = y;
    this.playerDir = dir;
    this.isMoving = false;
    this.moveProgress = 0;
    this.onEncounterCallback = onEncounter;
    this.onBossEncounterCallback = onBoss;
    this.onEndingCallback = onEnding;

    sound.bgm(this.currentMapData.bgm);
  }

  triggerOpeningEvent(): void {
    if (party.openingSeen || this.currentMapData.id !== 'castle') return;
    this.playerDir = 'up';

    const parts = [
      '国王「おお、若き勇者よ！\nよくぞ余の呼び出しに応えてくれた。',
      '国王「いま、世界は暗黒の雲に覆われようとしておる。\n北東の山奥にある「やみの洞くつ」にて、古の魔導王ザルバが邪悪な魔力を高めておるのじゃ。',
      '国王「ザルバを討ち滅ぼし、この地に再び光を取り戻せるのは……まこと、おぬししかおらぬ！',
      '国王「旅の支度金として、50ゴールドを授けよう。\nまた、城内の宝箱にある品も持っていくがよい！',
    ];

    let idx = 0;
    const nextPart = () => {
      if (idx < parts.length) {
        dialog.show(parts[idx++], { onFinish: nextPart });
      } else {
        party.player.gold += 50;
        party.openingSeen = true;
        sound.sfx('confirm');
        dialog.show('勇者は 支度金として 50ゴールドを 受け取った！', {
          onFinish: () => {
            dialog.show(
              '国王「まずは南の扉から城を出て、東にある「ルルの町」で装備をととのえるのじゃ！\n頼んだぞ、勇者よ！'
            );
          },
        });
      }
    };

    nextPart();
  }

  triggerTriumphalEvent(onComplete: () => void): void {
    if (this.currentMapData.id !== 'castle') return;
    this.playerDir = 'up';

    void (async () => {
      sound.stopBgm();
      await sound.jingle('fanfare');
      sound.bgm('castle');

      const parts = [
        '兵士たち「ワーーーッ！！\n勇者様が魔導王ザルバを倒されたぞーーっ！！」',
        '大臣「おお……！ なんという奇跡！\n我が国に……いや、全世界に平和が戻ったのです！」',
        '国王「おお、勇者よ！\nよくぞ魔導王ザルバを打ち倒してくれた！」',
        '国王「闇の霧は晴れ渡り、ふたたび世界に希望の光が満ちあふれたのじゃ。」',
        '国王「おぬしの名は、この国の歴史に永遠の伝説として刻まれるであろう！」',
        '国王「真の勇者よ、心から礼を言うぞ！」',
        '兵士たち「勇者万歳！　平和万歳！！」',
      ];

      let idx = 0;
      const nextPart = () => {
        if (idx < parts.length) {
          dialog.show(parts[idx++], { onFinish: nextPart });
        } else {
          onComplete();
        }
      };

      nextPart();
    })();
  }

  changeMap(targetMapId: string, targetX: number, targetY: number, targetDir: Dir = 'down', sfxName = 'stairs'): void {
    const nextMap = MAPS[targetMapId];
    if (!nextMap) return;

    sound.sfx(sfxName);
    this.isMoving = false;
    this.moveProgress = 0;

    void (async () => {
      await fadeOut(12);
      this.currentMapData = nextMap;
      this.playerX = targetX;
      this.playerY = targetY;
      this.fromX = targetX;
      this.fromY = targetY;
      this.playerDir = targetDir;
      party.currentMap = targetMapId;
      party.playerX = targetX;
      party.playerY = targetY;
      sound.bgm(nextMap.bgm);
      await fadeIn(12);
    })();
  }

  update(frame: number): void {
    // ショップやダイアログ、メニューが開いている間は移動しない
    if (shopUI.active) {
      shopUI.update(frame);
      return;
    }
    if (dialog.active) {
      dialog.update(frame);
      return;
    }
    if (fieldMenu.isOpen()) {
      fieldMenu.update(
        frame,
        () => this.talkToFacing(),
        () => this.searchFacing(),
        (msg) => dialog.show(msg)
      );
      return;
    }

    // X/Escでメニューを開く
    if (input.pressed('b')) {
      input.consume();
      fieldMenu.open();
      return;
    }

    // Aボタンで話しかける / 調べる
    if (input.pressed('a')) {
      input.consume();
      const talked = this.talkToFacing();
      if (!talked) {
        this.searchFacing();
      }
      return;
    }

    // 移動補間中
    if (this.isMoving) {
      this.moveProgress += this.moveSpeed;
      if (Math.floor(this.moveProgress * 4) % 2 === 0) {
        this.walkAnimFrame = 1;
      } else {
        this.walkAnimFrame = 0;
      }

      if (this.moveProgress >= 1) {
        this.moveProgress = 0;
        this.isMoving = false;
        this.fromX = this.playerX;
        this.fromY = this.playerY;
        this.walkAnimFrame = 0;

        // ワープ判定
        const warp = this.currentMapData.warps.find(
          (w) => w.x === this.playerX && w.y === this.playerY
        );
        if (warp) {
          this.changeMap(warp.targetMap, warp.targetX, warp.targetY, warp.targetDir, warp.sfx || 'stairs');
          return;
        }

        // エンカウント判定
        this.checkEncounter();
      }
      return;
    }

    // 入力受付
    let dx = 0;
    let dy = 0;
    let nextDir: Dir = this.playerDir;

    if (input.isDown('up')) {
      dy = -1;
      nextDir = 'up';
    } else if (input.isDown('down')) {
      dy = 1;
      nextDir = 'down';
    } else if (input.isDown('left')) {
      dx = -1;
      nextDir = 'left';
    } else if (input.isDown('right')) {
      dx = 1;
      nextDir = 'right';
    }

    if (dx !== 0 || dy !== 0) {
      this.playerDir = nextDir;
      const targetX = this.playerX + dx;
      const targetY = this.playerY + dy;

      if (this.canPass(targetX, targetY)) {
        this.fromX = this.playerX;
        this.fromY = this.playerY;
        this.playerX = targetX;
        this.playerY = targetY;
        this.isMoving = true;
        this.moveProgress = 0;
        party.playerX = targetX;
        party.playerY = targetY;
      } else {
        // ぶつかった音
        if (input.pressed('up') || input.pressed('down') || input.pressed('left') || input.pressed('right')) {
          sound.sfx('bump');
        }
      }
    }
  }

  private canPass(x: number, y: number): boolean {
    if (x < 0 || x >= this.currentMapData.width || y < 0 || y >= this.currentMapData.height) {
      return false;
    }

    // タイルの障害物判定
    const row = this.currentMapData.tiles[y];
    const tileChar = row ? row[x] : '#';
    const tileInfo = tiles[tileChar];
    if (!tileInfo || tileInfo.solid) {
      return false;
    }

    // NPCとの衝突判定
    const hasNpc = this.currentMapData.npcs.some((n) => {
      if (n.id === 'boss_npc' && party.bossDefeated) return false;
      return n.x === x && n.y === y;
    });
    if (hasNpc) return false;

    // 宝箱との衝突判定（未開封のみ障害物）
    const hasChest = this.currentMapData.chests.some(
      (c) => c.x === x && c.y === y && !party.openedChests.has(c.id)
    );
    if (hasChest) return false;

    return true;
  }

  private checkEncounter(): void {
    if (!this.currentMapData.encounterGroup || this.currentMapData.encounterGroup.length === 0) {
      return;
    }

    this.stepCount++;
    const row = this.currentMapData.tiles[this.playerY];
    const tileChar = row ? row[this.playerY] : 'G';
    const encMul = tiles[tileChar]?.enc || 1;
    const baseRate = this.currentMapData.encounterRate || 0.08;

    // 数歩は出ない保証、その後確率判定
    if (this.stepCount > 3 && Math.random() < baseRate * encMul) {
      this.stepCount = 0;
      sound.sfx('encounter');
      const grp = this.currentMapData.encounterGroup;
      const monsterId = grp[Math.floor(Math.random() * grp.length)];
      flash('#ffffff', 10);
      void (async () => {
        await fadeOut(10);
        this.onEncounterCallback?.(monsterId);
      })();
    }
  }

  private getFacingCoord(): [number, number] {
    let fx = this.playerX;
    let fy = this.playerY;
    if (this.playerDir === 'up') fy--;
    else if (this.playerDir === 'down') fy++;
    else if (this.playerDir === 'left') fx--;
    else if (this.playerDir === 'right') fx++;
    return [fx, fy];
  }

  private talkToFacing(): boolean {
    const [fx, fy] = this.getFacingCoord();

    const npc = this.currentMapData.npcs.find((n) => {
      if (n.id === 'boss_npc' && party.bossDefeated) return false;
      return n.x === fx && n.y === fy;
    });

    if (npc) {
      sound.sfx('confirm');
      // NPCをプレイヤーの方に向かせる
      if (this.playerDir === 'up') npc.dir = 'down';
      else if (this.playerDir === 'down') npc.dir = 'up';
      else if (this.playerDir === 'left') npc.dir = 'right';
      else if (this.playerDir === 'right') npc.dir = 'left';

      // アクション判定
      if (npc.action === 'inn') {
        dialog.show('一晩泊まりますか？（10G）', {
          choices: ['はい', 'いいえ'],
          onChoice: (idx) => {
            if (idx === 0) {
              if (party.player.gold < 10) {
                dialog.show('お金がたりないよ！');
              } else {
                party.player.gold -= 10;
                void (async () => {
                  await fadeOut(15);
                  party.player.hp = party.player.maxHp;
                  party.player.mp = party.player.maxMp;
                  await sound.jingle('inn');
                  await fadeIn(15);
                  dialog.show('おはようございます！\nいってらっしゃい！');
                })();
              }
            } else {
              dialog.show('またいつでもどうぞ！');
            }
          },
        });
        return true;
      }

      if (npc.action === 'church') {
        dialog.show('旅の記録をお残しになりますか？', {
          choices: ['はい', 'いいえ'],
          onChoice: (idx) => {
            if (idx === 0) {
              party.save();
              void (async () => {
                await sound.jingle('save');
                dialog.show('神の御加護により\n旅の記録をセーブしました。');
              })();
            } else {
              dialog.show('神の御加護があらんことを……');
            }
          },
        });
        return true;
      }

      if (npc.action === 'shop_item') {
        shopUI.open([
          'herb',
          'magic_water',
          'copper_sword',
          'iron_sword',
          'leather_armor',
          'chain_mail',
          'leather_shield',
          'iron_shield',
        ]);
        return true;
      }

      if (npc.action === 'boss_trigger') {
        const fullMsg = npc.dialog.join('\n');
        dialog.show(fullMsg, {
          onFinish: () => {
            this.onBossEncounterCallback?.();
          },
        });
        return true;
      }

      // 通常会話
      if (party.bossDefeated && this.currentMapData.id === 'castle') {
        if (npc.id === 'king') {
          dialog.show('国王「おお、世界を救いし勇者よ！\n民はおぬしの偉業を永遠に語り継ぐであろう！」');
          return true;
        }
        if (npc.id === 'minister') {
          dialog.show('大臣「勇者様、まことにありがとうございました！\n全世界が歓喜に包まれておりますぞ！」');
          return true;
        }
        if (npc.id.startsWith('guard')) {
          dialog.show('近衛兵「勇者殿！　あなたこそまことの英雄だ！\nこの国の誇りです！」');
          return true;
        }
      }

      const fullMsg = npc.dialog.join('\n');
      dialog.show(fullMsg);
      return true;
    }

    return false;
  }

  private searchFacing(): void {
    const [fx, fy] = this.getFacingCoord();

    // 宝箱判定
    const chest = this.currentMapData.chests.find((c) => c.x === fx && c.y === fy);
    if (chest) {
      if (party.openedChests.has(chest.id)) {
        dialog.show('宝箱は からっぽだ。');
      } else {
        party.openedChests.add(chest.id);
        sound.sfx('chest');
        if (chest.gold) {
          party.player.gold += chest.gold;
          dialog.show(`宝箱をあけた！\n${chest.gold}ゴールドを 手に入れた！`);
        } else if (chest.item) {
          party.addItem(chest.item);
          const itemName = ITEMS[chest.item]?.name ?? chest.item;
          dialog.show(`宝箱をあけた！\n${itemName}を 手に入れた！`);
        }
      }
      return;
    }

    // 足元判定
    const curChest = this.currentMapData.chests.find((c) => c.x === this.playerX && c.y === this.playerY);
    if (curChest && !party.openedChests.has(curChest.id)) {
      party.openedChests.add(curChest.id);
      sound.sfx('chest');
      if (curChest.gold) {
        party.player.gold += curChest.gold;
        dialog.show(`宝箱をあけた！\n${curChest.gold}ゴールドを 手に入れた！`);
      } else if (curChest.item) {
        party.addItem(curChest.item);
        dialog.show(`宝箱をあけた！\n${curChest.item}を 手に入れた！`);
      }
      return;
    }

    dialog.show('足元を しらべたが\n何も 見つからなかった。');
  }

  draw(frame: number): void {
    // 画面中央にプレイヤーを配置するカメラオフセット
    let drawPlayerPxX = this.playerX * TILE;
    let drawPlayerPxY = this.playerY * TILE;

    if (this.isMoving) {
      drawPlayerPxX = (this.fromX + (this.playerX - this.fromX) * this.moveProgress) * TILE;
      drawPlayerPxY = (this.fromY + (this.playerY - this.fromY) * this.moveProgress) * TILE;
    }

    const camX = Math.floor(drawPlayerPxX - W / 2 + TILE / 2);
    const camY = Math.floor(drawPlayerPxY - H / 2 + TILE / 2);

    ctx.save();
    ctx.translate(-camX, -camY);

    // タイル描画
    const startTileX = Math.max(0, Math.floor(camX / TILE));
    const endTileX = Math.min(this.currentMapData.width - 1, Math.floor((camX + W) / TILE) + 1);
    const startTileY = Math.max(0, Math.floor(camY / TILE));
    const endTileY = Math.min(this.currentMapData.height - 1, Math.floor((camY + H) / TILE) + 1);

    const animFrame = Math.floor(frame / 30) % 2;

    for (let ty = startTileY; ty <= endTileY; ty++) {
      const row = this.currentMapData.tiles[ty];
      if (!row) continue;
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const ch = row[tx] || 'G';
        const t = tiles[ch];
        if (t && t.frames.length > 0) {
          const frameImg = t.frames[animFrame % t.frames.length];
          ctx.drawImage(frameImg, tx * TILE, ty * TILE);
        }
      }
    }

    // 宝箱描画
    this.currentMapData.chests.forEach((c) => {
      const isOpened = party.openedChests.has(c.id);
      const img = isOpened ? chestSprites.open : chestSprites.closed;
      ctx.drawImage(img, c.x * TILE, c.y * TILE);
    });

    // NPC描画
    this.currentMapData.npcs.forEach((npc) => {
      if (npc.id === 'boss_npc' && party.bossDefeated) return;
      const spr = chars[npc.sprite] || chars['elder'];
      const dirFrames = spr[npc.dir];
      const img = dirFrames[0];
      ctx.drawImage(img, npc.x * TILE, npc.y * TILE);
    });

    // プレイヤー描画
    const heroSpr = chars['hero'];
    const pFrames = heroSpr[this.playerDir];
    const pImg = pFrames[this.isMoving ? this.walkAnimFrame : 0];
    ctx.drawImage(pImg, drawPlayerPxX, drawPlayerPxY);

    ctx.restore();

    // UIウィンドウ類描画
    fieldMenu.draw(frame);
    shopUI.draw(frame);
    dialog.draw(frame);
  }
}

export const mapScene = new MapScene();
