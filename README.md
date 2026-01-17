# ECC Junior お知らせ掲示板

英会話スクール向けのお知らせ掲示板システムです。Next.js + Vercel Blobで構築。

## 機能

- **ユーザーログイン**: ID/パスワード認証
- **お知らせ閲覧**: 月別にグループ化されたお知らせ一覧
- **PDF閲覧**: Vercel Blobに保存されたPDFを開く
- **管理者機能**: お知らせの追加・編集・削除、ログ監視
- **PDFアップロード**: ブラウザから直接Vercel Blobにアップロード

## 初期ログイン情報

| ユーザーID | パスワード | 権限 |
|-----------|-----------|------|
| user001 | pass001 | 一般ユーザー |
| user002 | pass002 | 一般ユーザー |
| admin | adminpass | 管理者 |

## ローカル開発

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

http://localhost:3000 でアクセス

## Vercelへのデプロイ

### 1. GitHubにプッシュ

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### 2. Vercelで設定

1. [Vercel](https://vercel.com) でGitHubリポジトリをインポート
2. デプロイが完了したら、**Storage** タブに移動
3. **Create Database** → **Blob** を選択
4. 自動で `BLOB_READ_WRITE_TOKEN` が設定されます
5. 再デプロイして完了！

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **ストレージ**: Vercel Blob
- **スタイル**: カスタムCSS (パステルカラーの可愛いデザイン)
- **データ**: localStorage + sessionStorage
