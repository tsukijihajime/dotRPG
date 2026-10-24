# お城マップとオープニング・凱旋イベント 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** お城マップ（玉座の間）を新設し、王様からの勅命オープニングイベントと、魔導王ザルバ討伐後の凱旋イベントを実装する。

**Architecture:** マップチップとNPCスプライトを拡張し、城マップデータ（`castle`）を作成。フィールドマップに城シンボルを配置してワープを繋ぎ、ゲーム初期化（ニューゲーム）とボス討伐後の遷移ロジックを更新してドラマチックな王道RPGの導入と結末を実現する。

**Tech Stack:** TypeScript, HTML5 Canvas 2D, Vite, Web Audio API

**Spec:** `docs/superpowers/specs/2026-10-24-castle-and-events-design.md`

## Global Constraints

- ゲーム内解像度: 256x240 論理ピクセル、1マス16pxタイル
- 既存セーブデータ形式との互換性を維持（`party.ts`）
- `npm run build` によるTypeScript型チェックおよびビルドが正常に通ること

## Review Focus

1. ニューゲーム開始時に玉座の間で王様との会話が自動発生し、支度金50Gが確実に付与されること
2. 城内の宝箱から「こんぼう」と「やくそう」が正しく取得でき、開いた状態が保持されること
3. 城の南端の扉からフィールドへ出られ、フィールド上の城シンボルから城へ再入場できること
4. フィールド上で城から東へ進むと既存の「ルルの町」へアクセスできること
5. ボス「魔導王ザルバ」討伐後、自動で城へ凱旋し、王様たちの祝福会話を経てエンディング（スタッフロール）へ進むこと

---

### Task 1: 王様スプライトと王城タイルの追加

**Files:**
- Modify: `src/engine/sprites.ts`

**Interfaces:**
- Produces: `chars['king']`, tiles for castle (`'C_WALL'`, `'C_FLOOR'`, `'C_CARPET'`, `'C_THRONE'`, `'CASTLE_EXT'`)

- [ ] **Step 1: 王様スプライト定義の追加**
  `PALETTES` に `king`（王冠ゴールド、赤マント、白髭）を追加し、`chars['king']` を生成可能にする。
- [ ] **Step 2: お城用タイルの追加**
  `defTile` に玉座 (`K`)、赤絨毯 (`c`)、大理石床 (`e`)、城壁 (`w`)、フィールド用城外観アイコン (`H`) を追加。
- [ ] **Step 3: ビルド検証**
  `npm run build` を実行し、型エラーがないことを確認。
- [ ] **Step 4: コミット**
  `git add src/engine/sprites.ts && git commit -m "feat: add king sprite and castle tiles"`

---

### Task 2: 城マップデータの定義とフィールド連携

**Files:**
- Modify: `src/data/maps.ts`

**Interfaces:**
- Consumes: `chars['king']`, castle tiles from Task 1
- Produces: `MAPS['castle']`, updated `MAPS['field']` with castle warp

- [ ] **Step 1: 城マップ (`castle`) データの作成**
  16x14 サイズの玉座の間マップを作成。
  - NPC: 王様 (`king`), 大臣 (`elder`), 近衛兵2名 (`soldier`)
  - 宝箱: 宝箱1（こんぼう: `club`）、宝箱2（やくそう: `herb`）
  - ワープ: 南端からフィールド (X: 3, Y: 10) へワープ
- [ ] **Step 2: フィールドマップ (`field`) に城を配置**
  ルルの町（X:7, Y:10）の西側（X:3, Y:10）に城タイル `H` を配置し、城内玉座の間へワープする設定を追加。
- [ ] **Step 3: ビルド検証**
  `npm run build` を実行し、マップ定義の整合性を確認。
- [ ] **Step 4: コミット**
  `git add src/data/maps.ts && git commit -m "feat: define castle map and link with field"`

---

### Task 3: オープニング勅命イベントと初期パラメータの実装

**Files:**
- Modify: `src/systems/party.ts`
- Modify: `src/scenes/map.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `MAPS['castle']`
- Produces: `party.resetNewGame()` (starts at castle), opening dialog trigger on map load

- [ ] **Step 1: ニューゲームの初期状態を城に変更**
  `party.resetNewGame()` で初期マップを `'castle'`、初期座標を王様の前 (X: 7, Y: 6) に設定。初期ゴールドを0G、初期装備を服のみ（武器なし、城で支給）に調整。
- [ ] **Step 2: オープニング自動ダイアログの実装**
  ニューゲーム開始時に初回のみ自動で王様からの勅命イベント（魔導王討伐の依頼、支度金50Gの手渡し）を起動。
- [ ] **Step 3: ビルド検証**
  `npm run build` を実行し、エラーがないことを確認。
- [ ] **Step 4: コミット**
  `git add src/systems/party.ts src/scenes/map.ts src/main.ts && git commit -m "feat: implement royal opening quest event"`

---

### Task 4: 凱旋イベントとエンディング連携の実装

**Files:**
- Modify: `src/scenes/battle.ts`
- Modify: `src/scenes/map.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `party.bossDefeated`
- Produces: Castle triumph sequence after defeating Zarba

- [ ] **Step 1: ボス討伐後の凱旋シーン遷移**
  魔導王ザルバ討伐後、直接エンディングに行かず、城の玉座の間（王様の前）へワープ。
- [ ] **Step 2: 祝福会話とファンファーレの再生**
  城内NPCたちのセリフが「平和への感謝・勇者を讃える言葉」に変化。王様に話しかけると（または自動で）歓声ファンファーレとともに最後の感謝が述べられ、決定ボタンでエンディングスタッフロールへ進む。
- [ ] **Step 3: ビルド検証**
  `npm run build` を実行し、動作フローを確認。
- [ ] **Step 4: コミット**
  `git add src/scenes/battle.ts src/scenes/map.ts src/main.ts && git commit -m "feat: implement triumph event at castle after boss defeat"`

---

### Task 5: 全体結合テストとデプロイ

**Files:**
- None (Verification & Deployment)

- [ ] **Step 1: ローカルでの通しプレイ確認**
  ニューゲーム開始 $\rightarrow$ 王様の勅命 $\rightarrow$ 宝箱開封 $\rightarrow$ フィールドへ外出 $\rightarrow$ ルルの町 $\rightarrow$ 洞くつ・戦闘 $\rightarrow$ 凱旋 $\rightarrow$ エンディングの遷移を確認。
- [ ] **Step 2: プロダクションビルド検証**
  `npm run build` の完全な成功を確認。
- [ ] **Step 3: GitHub へのプッシュと GitHub Pages 反映**
  GitHubリポジトリへプッシュし、GitHub Actions でのデプロイ成功を確認。
