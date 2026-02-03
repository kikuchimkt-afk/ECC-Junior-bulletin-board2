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
- **ストレージ**: Vercel Blob, Vercel KV
- **メール**: Resend
- **スタイル**: カスタムCSS (パステルカラーの可愛いデザイン)

---

## 📧 メール通知設定（任意）

お知らせ登録時にメール通知を送信する機能があります。設定しなくても掲示板は正常に動作します。

### 1. Resendアカウント作成

1. https://resend.com にアクセス
2. 「Get Started」でアカウント作成（GitHub連携可）
3. ダッシュボードで「API Keys」→「Create API Key」
4. 生成されたキー（`re_xxxxxxxx`）をコピー

### 2. Vercelに環境変数を設定

Vercelダッシュボード → プロジェクト → Settings → Environment Variables

| 変数名 | 値 | 備考 |
|--------|-----|------|
| `RESEND_API_KEY` | `re_xxxxxxxx` | Resendで取得したAPIキー |
| `RESEND_FROM_EMAIL` | `ECC in Tokushima <onboarding@resend.dev>` | 送信元アドレス |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | 掲示板のURL |

### 3. 再デプロイ

環境変数を設定後、Vercelで「Redeploy」を実行

### 注意事項

- **無料プラン**: 月3,000通まで
- **送信元ドメイン**: 独自ドメインを使う場合はResendでDNS設定が必要
- **未設定でもOK**: チェックを入れても送信されないだけでエラーにはなりません

