# ECC Junior お知らせ掲示板

英会話スクール向けのお知らせ掲示板システムです。

## 機能

- **ユーザーログイン**: ID/パスワードによる認証
- **お知らせ閲覧**: 月別にグループ化されたお知らせ一覧
- **PDF閲覧**: お知らせに添付されたPDFファイルを開く
- **管理者機能**: お知らせ・ユーザーの管理、ログ監視

## 初期ログイン情報

| ユーザーID | パスワード | 権限 |
|-----------|-----------|------|
| user001 | pass001 | 一般ユーザー |
| user002 | pass002 | 一般ユーザー |
| admin | adminpass | 管理者 |

## ファイル構成

```
ECC Junior bulletin board/
├── index.html      # ログインページ
├── bulletin.html   # お知らせ一覧
├── admin.html      # 管理者画面
├── css/
│   └── style.css   # スタイルシート
├── js/
│   ├── db.js       # IndexedDB管理
│   ├── auth.js     # 認証ロジック
│   ├── bulletin.js # お知らせ表示
│   └── admin.js    # 管理者機能
└── pdfs/           # PDFファイル置き場
    └── README.txt
```

## PDFの追加方法

1. PDFファイルを `pdfs/` フォルダに配置
2. 管理者画面でお知らせを追加
3. PDFパスに `pdfs/ファイル名.pdf` を入力

## デプロイ

このプロジェクトは静的サイトとしてVercelにデプロイできます。

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

Vercelでリポジトリを連携すれば自動デプロイされます。

## 注意事項

- データはブラウザのIndexedDBに保存されます
- 同じブラウザでのみデータが永続化されます
- 本番環境ではサーバーサイドとデータベースの導入を推奨
