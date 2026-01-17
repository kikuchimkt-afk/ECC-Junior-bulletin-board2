import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// 初期ユーザー（KVが空の場合に使用）
const DEFAULT_USERS = {
    'user001': { id: 'user001', password: 'pass001', name: '田中 花子', isAdmin: false, schools: [] },
    'user002': { id: 'user002', password: 'pass002', name: '鈴木 太郎', isAdmin: false, schools: [] },
    'admin': { id: 'admin', password: 'adminpass', name: '管理者', isAdmin: true, schools: [] }
};

// ユーザー一覧取得
export async function GET() {
    try {
        // KVからユーザー一覧を取得
        let users = await kv.hgetall('users');

        // 初回起動時は初期ユーザーを設定
        if (!users || Object.keys(users).length === 0) {
            for (const [id, user] of Object.entries(DEFAULT_USERS)) {
                await kv.hset('users', { [id]: JSON.stringify(user) });
            }
            users = DEFAULT_USERS;
        } else {
            // JSONパース
            const parsed = {};
            for (const [key, value] of Object.entries(users)) {
                parsed[key] = typeof value === 'string' ? JSON.parse(value) : value;
            }
            users = parsed;
        }

        // パスワードを除外して返す
        const safeUsers = Object.values(users).map(user => ({
            id: user.id,
            name: user.name,
            isAdmin: user.isAdmin,
            schools: user.schools || []
        }));

        return NextResponse.json({ users: safeUsers });
    } catch (error) {
        console.error('Get users error:', error);

        // KV未設定の場合はデフォルトユーザーを返す
        if (error.message?.includes('KV')) {
            const safeUsers = Object.values(DEFAULT_USERS).map(user => ({
                id: user.id,
                name: user.name,
                isAdmin: user.isAdmin,
                schools: user.schools || []
            }));
            return NextResponse.json({ users: safeUsers, fallback: true });
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ユーザー登録
export async function POST(request) {
    try {
        const body = await request.json();
        const { id, password, name, isAdmin } = body;

        if (!id || !password || !name) {
            return NextResponse.json(
                { error: 'ID、パスワード、名前は必須です' },
                { status: 400 }
            );
        }

        // 既存ユーザーチェック
        const existing = await kv.hget('users', id);
        if (existing) {
            return NextResponse.json(
                { error: 'このユーザーIDは既に存在します' },
                { status: 400 }
            );
        }

        // ユーザー保存
        const user = { id, password, name, isAdmin: !!isAdmin, schools: body.schools || [] };
        await kv.hset('users', { [id]: JSON.stringify(user) });

        return NextResponse.json({
            success: true,
            user: { id, name, isAdmin: !!isAdmin, schools: user.schools }
        });
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
