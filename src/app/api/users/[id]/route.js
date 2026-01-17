import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// ユーザー更新
export async function PUT(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { password, name, isAdmin } = body;

        // 既存ユーザー取得
        const existingStr = await kv.hget('users', id);
        if (!existingStr) {
            return NextResponse.json(
                { error: 'ユーザーが見つかりません' },
                { status: 404 }
            );
        }

        const existing = typeof existingStr === 'string' ? JSON.parse(existingStr) : existingStr;

        // 更新
        const updated = {
            ...existing,
            password: password || existing.password,
            name: name || existing.name,
            isAdmin: isAdmin !== undefined ? isAdmin : existing.isAdmin,
            isTeacher: body.isTeacher !== undefined ? body.isTeacher : (existing.isTeacher || false),
            schools: body.schools !== undefined ? body.schools : (existing.schools || [])
        };

        await kv.hset('users', { [id]: JSON.stringify(updated) });

        return NextResponse.json({
            success: true,
            user: { id, name: updated.name, isAdmin: updated.isAdmin, isTeacher: updated.isTeacher, schools: updated.schools }
        });
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ユーザー削除
export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        // 管理者アカウントは削除不可
        if (id === 'admin') {
            return NextResponse.json(
                { error: '管理者アカウントは削除できません' },
                { status: 400 }
            );
        }

        await kv.hdel('users', id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
