import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json(
                { error: 'ファイルが選択されていません' },
                { status: 400 }
            );
        }

        // ファイル名を安全な形式に変換
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `pdfs/${timestamp}_${safeName}`;

        // Vercel Blobにアップロード
        const blob = await put(filename, file, {
            access: 'public',
            addRandomSuffix: false
        });

        return NextResponse.json({
            success: true,
            url: blob.url,
            filename: filename
        });
    } catch (error) {
        console.error('Upload error:', error);

        // Vercel Blob未設定の場合のフォールバック
        if (error.message?.includes('BLOB_READ_WRITE_TOKEN')) {
            return NextResponse.json(
                {
                    error: 'Vercel Blobが設定されていません。Vercelダッシュボードで設定してください。',
                    details: 'BLOB_READ_WRITE_TOKEN環境変数が必要です'
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'アップロードに失敗しました', details: error.message },
            { status: 500 }
        );
    }
}
