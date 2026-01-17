import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// 初期お知らせ（KVが空の場合に使用）
const DEFAULT_ANNOUNCEMENTS = [
    { id: 1, year: 2026, month: 1, day: 10, title: '年始のご挨拶', pdfUrl: '', schools: [] },
    { id: 2, year: 2026, month: 1, day: 12, title: 'レッスンの変更のお知らせ', pdfUrl: '', schools: [] },
    { id: 3, year: 2026, month: 2, day: 1, title: '講師の変更のご案内', pdfUrl: '', schools: [] }
];

// お知らせ一覧取得
export async function GET() {
    try {
        // KVからお知らせ一覧を取得
        let announcements = await kv.get('announcements');

        // 初回起動時は初期データを設定
        if (!announcements || announcements.length === 0) {
            await kv.set('announcements', DEFAULT_ANNOUNCEMENTS);
            announcements = DEFAULT_ANNOUNCEMENTS;
        }

        // 日付順にソート（新しい順）
        announcements.sort((a, b) => {
            const dateA = new Date(a.year, a.month - 1, a.day);
            const dateB = new Date(b.year, b.month - 1, b.day);
            return dateB - dateA;
        });

        return NextResponse.json({ announcements });
    } catch (error) {
        console.error('Get announcements error:', error);

        // KV未設定の場合はデフォルトを返す
        if (error.message?.includes('KV')) {
            return NextResponse.json({ announcements: DEFAULT_ANNOUNCEMENTS, fallback: true });
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// お知らせ追加
export async function POST(request) {
    try {
        const body = await request.json();
        const { year, month, day, title, pdfUrl } = body;

        if (!year || !month || !day || !title) {
            return NextResponse.json(
                { error: '日付とタイトルは必須です' },
                { status: 400 }
            );
        }

        // 既存データ取得
        let announcements = await kv.get('announcements') || [];

        // 新しいお知らせを追加
        const newAnnouncement = {
            id: Date.now(),
            year: parseInt(year),
            month: parseInt(month),
            day: parseInt(day),
            title,
            pdfUrl: pdfUrl || '',
            schools: body.schools || []
        };

        announcements.push(newAnnouncement);

        // 保存
        await kv.set('announcements', announcements);

        return NextResponse.json({
            success: true,
            announcement: newAnnouncement
        });
    } catch (error) {
        console.error('Create announcement error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
