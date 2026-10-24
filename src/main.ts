// ゲームのエントリーポイントとメインループ
import './style.css';
import { initScreen, resetTransform, ctx, W, H } from './engine/screen';
import { input } from './engine/input';
import { sound } from './engine/audio';
import { updateFx, drawFx, shakeOffset, fadeOut, fadeIn } from './engine/fx';
import { initSprites } from './engine/sprites';
import { party } from './systems/party';
import { titleScene } from './scenes/title';
import { mapScene } from './scenes/map';
import { battleScene, type BattleResult } from './scenes/battle';
import { endingScene } from './scenes/ending';

export type CurrentScene = 'title' | 'map' | 'battle' | 'ending';

let activeScene: CurrentScene = 'title';
let frameCount = 0;

function switchScene(scene: CurrentScene): void {
  activeScene = scene;
}

// ---------------- 初期化 ----------------
function init(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  initScreen(canvas);
  initSprites();
  input.init();

  // 最初の操作時にWeb Audioのコンテキストをアクティブにする
  input.onFirstInteraction(() => {
    sound.unlock();
  });

  // ミュート切り替えボタン
  const muteBtn = document.getElementById('btn-mute');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      sound.setMuted(!sound.muted);
      muteBtn.textContent = sound.muted ? '♪ OFF' : '♪ ON';
    });
  }

  // グローバルエラーを画面上に表示（デバッグ用）
  window.addEventListener('error', (e) => {
    console.error('Game Error:', e.error || e.message);
  });

  // ローディング画面を非表示にする
  const loading = document.getElementById('loading');
  if (loading) loading.classList.add('hidden');

  // 最初はタイトル画面から
  startTitle();

  // ゲームループ開始
  requestAnimationFrame(gameLoop);
}

function startTitle(): void {
  switchScene('title');
  titleScene.start((isContinue) => {
    void (async () => {
      await fadeOut(15);
      if (isContinue) {
        party.load();
      } else {
        party.resetNewGame();
      }
      startMap();
      await fadeIn(15);
    })();
  });
}

function startMap(): void {
  switchScene('map');
  mapScene.init(
    party.currentMap,
    party.playerX,
    party.playerY,
    'down',
    (monsterId) => startBattle(monsterId),
    () => startBossBattle(),
    () => startEnding()
  );
}

function startBattle(monsterId: string): void {
  switchScene('battle');
  void fadeIn(12);
  battleScene.start(monsterId, (res: BattleResult) => {
    void (async () => {
      await fadeOut(15);
      if (res.gameover) {
        // 教会で復活
        party.currentMap = 'town';
        party.playerX = 17;
        party.playerY = 15;
      }
      startMap();
      await fadeIn(15);
    })();
  });
}

function startBossBattle(): void {
  switchScene('battle');
  void fadeIn(15);
  battleScene.start('boss', (res: BattleResult) => {
    void (async () => {
      await fadeOut(20);
      if (res.won) {
        party.bossDefeated = true;
        startEnding();
      } else {
        party.currentMap = 'town';
        party.playerX = 17;
        party.playerY = 15;
        startMap();
      }
      await fadeIn(20);
    })();
  });
}

function startEnding(): void {
  switchScene('ending');
  endingScene.start(() => {
    void (async () => {
      await fadeOut(20);
      startTitle();
      await fadeIn(20);
    })();
  });
}

// ---------------- メインループ ----------------
function gameLoop(): void {
  frameCount++;

  // 1. 入力更新
  input.update();

  // 2. シーン更新
  switch (activeScene) {
    case 'title':
      titleScene.update(frameCount);
      break;
    case 'map':
      mapScene.update(frameCount);
      break;
    case 'battle':
      battleScene.update(frameCount);
      break;
    case 'ending':
      endingScene.update(frameCount);
      break;
  }

  // 3. エフェクト更新
  updateFx();

  // 4. 描画
  resetTransform();
  ctx.clearRect(0, 0, W, H);

  // 画面揺れオフセット
  const [sx, sy] = shakeOffset();
  if (sx !== 0 || sy !== 0) {
    ctx.translate(sx, sy);
  }

  switch (activeScene) {
    case 'title':
      titleScene.draw(frameCount);
      break;
    case 'map':
      mapScene.draw(frameCount);
      break;
    case 'battle':
      battleScene.draw(frameCount);
      break;
    case 'ending':
      endingScene.draw(frameCount);
      break;
  }

  // 5. フェード・フラッシュ効果描画
  resetTransform();
  drawFx();

  requestAnimationFrame(gameLoop);
}

// DOM読み込み後に起動
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
