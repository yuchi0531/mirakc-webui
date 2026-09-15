# mirakc WebUI

[mirakc](https://github.com/mirakc/mirakc) 用の静的 WebUI (SPA)。Mirakurun 3.9.0-beta4 の公式 WebUI と同等の画面構成(ステータス / イベント / 接続ガイド)を持ち、MUI v5 のダークテーマ(Material Design 2)で日本語のみ表示します。

- バックエンド不要: `dist/` を mirakc 内蔵 Web サーバの `server.mounts` にマウントするだけで動作
- same-origin 前提(mirakc に認証・CORS 層はないため、別オリジン配信は非対応)
- **same-origin ルート配信のみ対応**: API・SSE のパスはオリジンルート絶対 (`/api/...`, `/events`) です。mirakc をオリジンのルート (`/`) にマウントするか、同一オリジン上で直接 mount する構成でのみ動作します。`https://host/mirakc/` のようなリバースプロキシのサブパス配下では API 呼び出しが失敗します。
- `base: './'` により任意のマウントパス(`/www` など)に対応

## 機能

| タブ | 内容 |
| --- | --- |
| ステータス | バージョン情報、サービスグリッド(ロゴ・EPG 状態)、チューナー一覧(使用状況・ユーザー) |
| イベント | `GET /events` (SSE) のフィード。新着順・最大 200 件 |
| 接続ガイド | 各種 URL とコピーボタン |

接続状態はヘッダーに表示: 接続中 / 稼働中 / 待機中 / 切断。

## 制限事項(API が存在しないため非対応)

- Config 編集タブ(`/api/config` なし)
- Logs タブ(`/api/log` なし)
- Restart ボタン(`/api/restart` なし)
- チューナープロセスの kill(`DELETE /api/tuners/{index}/process` なし)
- 更新アラート(`latest == current` のため無意味)
- ライブプレイヤー / EPG 番組表 / 録画・タイムシフト UI(mirakc に該当 UI 向け API はあるが、本 WebUI のスコープ外)
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

React 18 + TypeScript + Vite + MUI v5。ルータ・状態管理ライブラリ・プレイヤーライブラリは使用していません。
