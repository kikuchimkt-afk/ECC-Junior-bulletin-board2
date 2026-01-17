import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// 初期ユーザー（フォールバック用）
const DEFAULT_USERS = {
    'user001': { id: 'user001', password: 'pass001', name: '田中 花子', isAdmin: false },
    'user002': { id: 'user002', password: 'pass002', name: '鈴木 太郎', isAdmin: false },
    'admin': { id: 'admin', password: 'adminpass', name: '管理者', isAdmin: true }
};

// ログイン認証
export async function POST(request) {
    try {
        const body = await request.json();
        const { userId, password } = body;

        if (!userId || !password) {
            return NextResponse.json(
                { error: 'ユーザーIDとパスワードを入力してください' },
                { status: 400 }
            );
        }

        let user = null;

        try {
            // KVからユーザー取得
            const userStr = await kv.hget('users', userId);
            if (userStr) {
                user = typeof userStr === 'string' ? JSON.parse(userStr) : userStr;
            }
        } catch (kvError) {
            console.log('KV not available, using fallback');
            // KV未設定の場合はデフォルトユーザーを使用
            user = DEFAULT_USERS[userId];
        }

        // ユーザーが見つからない場合はデフォルトも確認
        if (!user) {
            user = DEFAULT_USERS[userId];
        }

        if (!user) {
            // ログイン失敗を記録
            await logAction(userId, 'login_failed', 'ユーザーIDが見つかりません');
            return NextResponse.json(
                { error: 'ユーザーIDが見つかりません' },
                { status: 401 }
            );
        }

        if (user.password !== password) {
            // ログイン失敗を記録
            await logAction(userId, 'login_failed', 'パスワード不一致');
            return NextResponse.json(
                { error: 'パスワードが正しくありません' },
                { status: 401 }
            );
        }

        // ログイン成功を記録
        await logAction(userId, 'login', 'ログイン成功');

        return NextResponse.json({
            success: true,
            user: {
                userId: user.id,
                name: user.name,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ログ記録ヘルパー
async function logAction(userId, action, details) {
    try {
        const log = {
            userId,
            action,
            details,
            timestamp: new Date().toISOString()
        };

        // KVにログを追加（リストの先頭に追加）
        await kv.lpush('logs', JSON.stringify(log));

        // 最大1000件まで保持
        await kv.ltrim('logs', 0, 999);
    } catch (error) {
        console.error('Log error:', error);
        // ログ記録失敗は無視
    }
}
