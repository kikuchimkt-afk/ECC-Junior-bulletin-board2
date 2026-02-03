import { Resend } from 'resend';
import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// メール通知送信
export async function POST(request) {
    try {
        const body = await request.json();
        const { announcement, targetSchools } = body;

        if (!announcement || !announcement.title) {
            return NextResponse.json(
                { error: 'お知らせ情報が必要です' },
                { status: 400 }
            );
        }

        // Resend APIキーチェック
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'RESEND_API_KEYが設定されていません', skipped: true },
                { status: 200 }
            );
        }

        const resend = new Resend(apiKey);

        // ユーザー一覧を取得
        let users = await kv.hgetall('users') || {};
        const parsedUsers = {};
        for (const [key, value] of Object.entries(users)) {
            parsedUsers[key] = typeof value === 'string' ? JSON.parse(value) : value;
        }

        // 対象ユーザーを抽出（メールアドレスがあり、対象教室に所属）
        const targetUsers = Object.values(parsedUsers).filter(user => {
            // メールアドレスがない場合はスキップ
            if (!user.email) return false;

            // 管理者・講師は全教室対象
            if (user.isAdmin || user.isTeacher) return true;

            // 対象教室が指定されていない場合は全員
            if (!targetSchools || targetSchools.length === 0) return true;

            // ユーザーの所属教室と対象教室が一致するか
            if (!user.schools || user.schools.length === 0) return false;
            return user.schools.some(s => targetSchools.includes(s));
        });

        if (targetUsers.length === 0) {
            return NextResponse.json({
                success: true,
                message: '対象ユーザーがいません',
                sent: 0
            });
        }

        // メール送信
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'ECC in Tokushima <onboarding@resend.dev>';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';

        let sentCount = 0;
        const errors = [];

        for (const user of targetUsers) {
            try {
                await resend.emails.send({
                    from: fromEmail,
                    to: [user.email],
                    subject: `【ECC】${announcement.title}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #FF91A4;">🏫 ECC in Tokushima</h2>
                            <p>${user.name} 様</p>
                            <p>新しいお知らせが登録されました。</p>
                            <div style="background: #FFF0F5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                                <h3 style="margin: 0 0 10px 0; color: #5D5D5D;">📢 ${announcement.title}</h3>
                                <p style="margin: 0; color: #8B8B8B;">配信日: ${announcement.year}年${announcement.month}月${announcement.day}日</p>
                            </div>
                            <p>
                                <a href="${appUrl}" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #FFB6C1 0%, #FF91A4 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: bold;">
                                    掲示板を確認する
                                </a>
                            </p>
                            <hr style="border: none; border-top: 1px solid #E6E6FA; margin: 30px 0;">
                            <p style="color: #8B8B8B; font-size: 12px;">
                                このメールは ECC in Tokushima お知らせ掲示板から自動送信されています。
                            </p>
                        </div>
                    `
                });
                sentCount++;
            } catch (err) {
                console.error(`Failed to send email to ${user.email}:`, err);
                errors.push({ email: user.email, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            sent: sentCount,
            total: targetUsers.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Send notification error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
