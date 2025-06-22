# ローカル開発環境セットアップガイド

## 問題解決

### npm run dev エラーの修正
- `vite.config.js`の`optimizeDeps.exclude`設定を修正しました
- esbuildのワイルドカードエラーを解決

## 利用可能な開発コマンド

### 通常の開発
```bash
npm run dev
```
- ポート: 5173
- ホスト: localhost + ネットワークアクセス可能

### ローカル専用開発（推奨）
```bash
npm run local
```
- ポート: 3000
- ホスト: 127.0.0.1（ローカルのみ）
- ローカル専用設定ファイル使用
- 自動ブラウザ起動
- より安定した開発環境

### その他のオプション
```bash
# ローカルホストのみ（ポート3000）
npm run dev:local

# localhostのみ（ポート3000）
npm run dev:localhost

# デバッグモード
npm run dev:debug

# 標準的な起動
npm run start

# ビルド後のプレビュー
npm run serve
```

## ローカル専用設定の特徴

### `npm run local`の利点
- ローカル専用のVite設定ファイル (`vite.config.local.js`) を使用
- ポート3000での起動
- 自動ブラウザ起動
- CORSヘッダー設定済み
- HMR（Hot Module Replacement）最適化
- 外部ネットワークからアクセス不可（セキュリティ向上）

### 設定の違い

**メイン設定 (`vite.config.js`)**
- 本番ビルド向け最適化
- ゲームモジュールの分割
- ネットワークアクセス可能

**ローカル設定 (`vite.config.local.js`)**
- 開発専用最適化
- シンプルな依存関係管理
- ローカルアクセスのみ
- より高速な開発体験

## トラブルシューティング

### ポートが使用中の場合
```bash
# ポート確認
lsof -ti:3000
lsof -ti:5173

# プロセス終了
kill -9 $(lsof -ti:3000)
```

### ブラウザキャッシュクリア
- Chrome: Cmd + Shift + R
- Safari: Cmd + Option + R

### 完全リセット
```bash
rm -rf node_modules
npm install
npm run local
```
