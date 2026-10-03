# mirakc WebUI

[mirakc](https://github.com/mirakc/mirakc) 用の静的 WebUI (SPA)。最新版 [Mirakurun](https://github.com/Chinachu/Mirakurun) (4.1.x) 公式 WebUI の画面構成・テーマに寄せつつ、mirakc が提供する Web API で実装しています。日本語のみ表示します。

- バックエンド不要: `dist/` を mirakc 内蔵 Web サーバの `server.mounts` にマウントするだけで動作
- same-origin 前提(mirakc に認証・CORS 層はないため、別オリジン配信は非対応)
- **same-origin ルート配信のみ対応**: API・SSE のパスはオリジンルート絶対 (`/api/...`, `/events`) です。mirakc をオリジンのルート (`/`) にマウントするか、同一オリジン上で直接 mount する構成でのみ動作します。`https://host/mirakc/` のようなリバースプロキシのサブパス配下では API 呼び出しが失敗します。
- `base: './'` により任意のマウントパス(`/www` など)に対応
- ルーティングは `HashRouter` を使用(`#### /epg` のようにハッシュ経由)。mirakc の静的配信には SPA フォールバックが無いため、リロード時も 404 になりません。

## 公式 Mirakurun WebUI との関係

Mirakurun 4.1.x の公式 UI は React + Blueprint.js 製で、ナビゲーションは **Home / EPG / ジョブ / ログ / 設定(サーバー・チューナー・チャンネル) / About**、通信は WebSocket JSON-RPC (`/rpc`) です。mirakc には `/rpc` が無いため、本 UI では同じ操作感を **Home / EPG(番組表)/ About** の3画面と **SSE (`/events`)+ REST ポーリング**で再現しています。テーマ(amber `#ffd56c` / light `#ffc126`、ダークデフォルト + ライト/ダーク切替)と日本語ラベルを公式 UI に合わせています。

## 機能

| 画面 | 内容 |
| --- | --- |
| ホーム | ステータス(バージョン・接続状態・統計)、サービス一覧(種別フィルタ・ロゴ・EPG 状態)、チューナー詳細(使用状況・ユーザー) |
| EPG 番組表 | 日付タブ(今日〜8日先)とチャンネル種別フィルタ(全波 / GR / BS / CS / SKY / BS4K)。サービス列に番組ブロック、現在時刻ジャンプ、番組詳細へ遷移。サービス単位の 8 日間ビューにも対応 |
| 番組詳細 | 内容・詳細情報(extended)・ジャンル・メタ情報・ストリーム URL |
| 番組検索 | 番組名・内容・詳細を NFKC + かな正規化してクライアント検索 |
| mirakc WebUI について | バージョン、接続ガイド(URL コピー)、mirakc-BS4K 固有機能、制限事項、SSE イベントフィード |

接続状態はヘッダー左のインジケータに表示: 待機中 / 稼働中 / 切断。

## mirakc-BS4K フォーク対応

[yuchi0531/mirakc-BS4K](https://github.com/yuchi0531/mirakc-BS4K) の独自機能を認識します。

- **BS4K / MMT**: チャンネル種別 `BS4K` のサービスは「4K」バッジ付きで表示。`channel` は StreamID(10進または `0x` 16進)としてそのまま扱います。BS4K はデコード済み TLV のパススルー配信で、番組単位ストリームは非対応です(「mirakc WebUI について」に明記)。
- **`X-Mirakc-Tuner`**: チャンネルストリームのみチューナーを厳密固定できる旨と curl 例を「mirakc WebUI について」に掲載。
- **`routes` / `disabled`**: サーバ内部の設定専用で Web API には公開されないため、本 UI では表示・編集できません(README ではなく About 画面にも明記)。

## 制限事項(mirakc に API が存在しないため非対応)

最新版 Mirakurun 公式 UI には存在しますが、mirakc に対応 API が無いため本 UI ではメニューに出しません。

- 設定編集 (Config) — `/api/config` なし
- ログ (Logs) — `/api/log` なし
- ジョブ (Jobs) — `/api/jobs` なし
- 再起動 — `/api/restart` なし
- チューナープロセスの kill — `DELETE /api/tuners/{index}/process` なし
- 更新アラート(`latest == current` のため無意味)
- ライブプレイヤー / 録画・タイムシフト UI(mirakc に API はあるが本 UI のスコープ外)
- リバースプロキシのサブパス配下での配信(API・SSE がオリジンルート絶対パスのため、same-origin ルート配信のみ対応)

## ビルド

```sh
npm install
npm run typecheck
npm run build
```

生成物は `dist/` です。

## デプロイ

`config.yml`:

```yaml
server:
  mounts:
    /www:
      path: /path/to/mirakc-webui/dist
      index: index.html
```

`http://<host>:40772/www/` を開いてください。

Docker Compose の例:

```yaml
services:
  mirakc:
    image: mirakc/mirakc:latest
    ports:
      - 40772:40772
    volumes:
      - ./mirakc-webui/dist:/www:ro
      - ./config.yml:/etc/mirakc/config.yml:ro
```

## 開発

```sh
npm run dev
```

Vite の dev サーバが `/api` と `/events` を `http://localhost:40772` の mirakc にプロキシします(`vite.config.ts` で変更可)。

## 技術スタック

React 18 + TypeScript + Vite + MUI v5 + react-router-dom (HashRouter) + luxon。状態管理ライブラリ・プレイヤーライブラリは使用していません。テーマは Mirakurun 4.1.x 公式 UI に合わせた amber パレット(primary dark `#ffd56c` / light `#ffc126`)で、ライト/ダーク切替を localStorage に永続します。

## スモークテスト

mirakc 実機が無くても、モック API + ヘッドレス Chromium で主要画面を検証できます。

```sh
npm run build
npm run mock        # 別シェルで起動 (http://localhost:4180)
# 初回のみ: npx playwright install chromium
npm run e2e
```

`scripts/mock-mirakc.mjs` が BS4K を含むモックデータを返し、`scripts/e2e.mjs` がホーム / EPG / 週間ビュー / 検索 / About / 404 の描画を検査します。
