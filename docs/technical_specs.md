# ECC Junior 掲示板 技術仕様書

## 1. データ構造 (Vercel KV)

### 1-1. `announcements` (JSON 配列)
掲示板の投稿データを保持します。
```json
{
  "id": 1675234567890,
  "year": 2026,
  "month": 2,
  "day": 4,
  "title": "タイトル",
  "content": "本文 (URLは自動リンク化されます)",
  "pdfUrl": "https://...",
  "schools": ["aizumi-jr", "kitajima-bo"],
  "teacherOnly": false
}
```

### 1-2. `users` (Hash Map)
キーを `userId` としたハッシュマップです。
- **権限**: `isAdmin` (管理者), `isTeacher` (講師) が true の場合、特別なアクセス権が付与されます。
- **所属教室**: `schools` 配列に教室IDを保持します。

## 2. 環境変数
- `BREVO_API_KEY`: メール送信用の Brevo API キー。
- `BREVO_FROM_EMAIL`: 送信元として表示する認証済みアドレス。
- `KV_URL`, `KV_REST_API_TOKEN` 等: Vercel KV との接続情報。

## 3. 主要なAPIエンドポイント
- `/api/announcements`: お知らせの取得・追加。
    - `GET`: 日付およびID順でソートして返却。
- `/api/users`: ユーザー管理。
- `/api/notify`: Brevo を介したBCCメール送信。
- `/api/upload`: Vercel Blob へのファイルアップロード。

## 4. メンテナンス
- **教室の追加**: `src/app/lib/schools.js` に ID、名称、カラーコードを追加してください。
- **ログの削除**: `src/app/api/logs/route.js` に削除ロジックがありますが、通常は管理画面からクリア可能です。
- **バックアップ**: 管理画面から「ユーザー情報をDL」を行うことで、KV内の主要なユーザーデータのコピーをCSV形式で保存できます。
