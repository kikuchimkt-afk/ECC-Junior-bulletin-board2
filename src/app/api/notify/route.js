import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// メール通知送信 (Brevo API版)
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

        // Brevo APIキーチェック
        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'BREVO_API_KEYが設定されていません', skipped: true },
                { status: 200 }
            );
        }

        // ユーザー一覧を取得
        let users = await kv.hgetall('users') || {};
        const parsedUsers = {};
        for (const [key, value] of Object.entries(users)) {
            parsedUsers[key] = typeof value === 'string' ? JSON.parse(value) : value;
        }

        // 対象ユーザーを抽出（メールアドレスがあり、対象教室に所属）
        const targetUsers = Object.values(parsedUsers).filter(user => {
            if (!user.email) return false;
            if (user.isAdmin || user.isTeacher) return true;
            if (!targetSchools || targetSchools.length === 0) return true;
            if (!user.schools || user.schools.length === 0) return false;
            return user.schools.some(s => targetSchools.includes(s));
        });

        if (targetUsers.length === 0) {
            console.log('Notification skipped: No matching users found.');
            return NextResponse.json({
                success: true,
                message: '対象ユーザーがいません（メールアドレスが未登録、または所属教室が一致しません）',
                sent: 0
            });
        }

        console.log(`Attempting to send notification to ${targetUsers.length} users...`);

        // 送信設定
        const fromEmail = process.env.BREVO_FROM_EMAIL || 'info@brevo.com'; // 送信元 (Brevoで要認証)
        const fromName = 'ECC in Tokushima';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';

        // 宛先リスト作成
        const recipients = targetUsers.map(user => ({
            email: user.email,
            name: user.name
        }));

        // Brevo API 呼び出し (一括送信)
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': apiKey,
                'content-type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: fromName, email: fromEmail },
                to: recipients,
                subject: `【ECC】${announcement.title}`,
                htmlContent: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #FF91A4;">🏫 ECC in Tokushima</h2>
                        <p>皆様へ</p>
                        <p>新しいお知らせが登録されました。</p>
                        <div style="background: #FFF0F5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <h3 style="margin: 0 0 10px 0; color: #5D5D5D;">📢 ${announcement.title}</h3>
                            <p style="margin: 0; color: #8B8B8B;">配信日: ${announcement.year}年${announcement.month}月${announcement.day}日</p>
                            ${announcement.content ? `<p style="margin-top: 15px; color: #444; border-top: 1px dashed #FFB6C1; padding-top: 15px;">${announcement.content}</p>` : ''}
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
            })
        });

        if (response.ok) {
            console.log('Emails sent successfully via Brevo.');
            return NextResponse.json({
                success: true,
                sent: recipients.length,
                total: targetUsers.length
            });
        } else {
            const errorData = await response.json();
            console.error('Brevo API Error Details:', JSON.stringify(errorData));
            return NextResponse.json({
                error: `Brevo APIエラー: ${errorData.message || '不明なエラー'}`,
                details: errorData
            }, { status: 200 }); // 200で返してフロントでアラートを出す
        }

    } catch (error) {
        console.error('Send notification error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
