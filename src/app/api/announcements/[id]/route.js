import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// お知らせ更新
export async function PUT(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { year, month, day, title, pdfUrl } = body;

        // 既存データ取得
        let announcements = await kv.get('announcements') || [];

        // 対象を探して更新
        const index = announcements.findIndex(a => a.id === parseInt(id));
        if (index === -1) {
            return NextResponse.json(
                { error: 'お知らせが見つかりません' },
                { status: 404 }
            );
        }

        announcements[index] = {
            ...announcements[index],
            year: year !== undefined ? parseInt(year) : announcements[index].year,
            month: month !== undefined ? parseInt(month) : announcements[index].month,
            day: day !== undefined ? parseInt(day) : announcements[index].day,
            title: title || announcements[index].title,
            pdfUrl: pdfUrl !== undefined ? pdfUrl : announcements[index].pdfUrl
        };

        // 保存
        await kv.set('announcements', announcements);

        return NextResponse.json({
            success: true,
            announcement: announcements[index]
        });
    } catch (error) {
        console.error('Update announcement error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// お知らせ削除
export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        // 既存データ取得
        let announcements = await kv.get('announcements') || [];

        // 対象を削除
        announcements = announcements.filter(a => a.id !== parseInt(id));

        // 保存
        await kv.set('announcements', announcements);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete announcement error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
