# ドットクエスト ～やみの魔導王～ (dotRPG)

ブラウザでそのまま遊べる、レトロなドラクエ風コマンド式RPGです。
GitHub Pagesへの自動デプロイ（GitHub Actions）に対応しています。

## 🎮 ゲームの特徴

- **ドラクエ風コマンド式バトル**：たたかう / じゅもん / どうぐ / にげる
- **世界とダンジョン**：
  - ルルの町（村長、道具屋、宿屋、教会）
  - アレフ平原（ランダムエンカウント）
  - やみの洞くつ B1F / B2F（宝箱、モンスター、魔導王ザルバ）
- **成長と装備**：
  - レベルアップで最大HP・MP、攻撃力・守備力が上昇し呪文を習得
  - 武器・防具・盾の購入と装備変更
- **AI生成ドット絵**：オリジナルモンスター（リーフスライム、オオコウモリ、マッシュおやじ、がいこつへい、ひのたまこぞう、ロックゴーレム、魔導王ザルバ）＆タイトル背景
- **Web Audio チップチューン音源**：7曲のBGM（タイトル、町、平原、洞くつ、バトル、ボス、エンディング）＋各種効果音・ジングル（音声ファイル不要）
- **セーブ＆ロード**：教会で祈ることでブラウザ（`localStorage`）に旅の記録を保存
- **レスポンシブ＆スマホ対応**：画面上のバーチャル十字キー＆A/Bボタンでスマートフォンでも快適にプレイ可能

## 🕹 操作方法

| アクション | キーボード | スマホ・タッチ |
|---|---|---|
| いどう / カーソル | 矢印キー（↑ ↓ ← →）または WASD | 画面下の十字キー |
| けってい / はなす / しらべる | Z / Enter / Space | Aボタン |
| キャンセル / メニューをひらく | X / Esc / Backspace | Bボタン |
| BGMミュート切り替え | 画面右下の「♪ ON / OFF」ボタン | タップ |

## 🚀 ローカルでの遊び方

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev

# ブラウザでアクセス
# http://localhost:5173/dotRPG/
```

## 🌐 GitHub Pages への公開手順

本リポジトリは GitHub Actions (`.github/workflows/deploy.yml`) による自動デプロイが設定されています。

1. GitHub上にリポジトリ `dotRPG` を作成します。
2. 作成したリポジトリにローカルコードをプッシュします：
   ```bash
   git init
   git add .
   git commit -m "Initial commit: dotRPG release"
   git branch -M main
   git remote add origin https://github.com/<あなたのユーザー名>/dotRPG.git
   git push -u origin main
   ```
3. GitHubリポジトリの **Settings** > **Pages** を開きます。
4. **Build and deployment** の **Source** を **GitHub Actions** に設定します。
5. mainブランチへのプッシュによりワークフローが自動実行され、数分で以下のURLにゲームが公開されます：
   `https://<あなたのユーザー名>.github.io/dotRPG/`
