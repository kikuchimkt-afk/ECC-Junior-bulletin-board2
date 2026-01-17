import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// ログ一覧取得
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const action = searchParams.get('action');
        const limit = parseInt(searchParams.get('limit') || '100');

        // KVからログを取得
        let logs = await kv.lrange('logs', 0, limit - 1);

        if (!logs || logs.length === 0) {
            return NextResponse.json({ logs: [] });
        }

        // JSONパース
        logs = logs.map(log => typeof log === 'string' ? JSON.parse(log) : log);

        // フィルタリング
        if (userId) {
            logs = logs.filter(log => log.userId === userId);
        }
        if (action) {
            logs = logs.filter(log => log.action === action);
        }

        return NextResponse.json({ logs });
    } catch (error) {
        console.error('Get logs error:', error);

        // KV未設定の場合は空配列を返す
        if (error.message?.includes('KV')) {
            return NextResponse.json({ logs: [], fallback: true });
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ログ追加
export async function POST(request) {
    try {
        const body = await request.json();
        const { userId, action, details } = body;

        if (!userId || !action) {
            return NextResponse.json(
                { error: 'userIdとactionは必須です' },
                { status: 400 }
            );
        }

        const log = {
            userId,
            action,
            details: details || '',
            timestamp: new Date().toISOString()
        };

        // KVにログを追加
        await kv.lpush('logs', JSON.stringify(log));

        // 最大1000件まで保持
        await kv.ltrim('logs', 0, 999);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Add log error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ログクリア
export async function DELETE() {
    try {
        await kv.del('logs');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Clear logs error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
