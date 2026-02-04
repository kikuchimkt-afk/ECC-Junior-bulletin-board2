'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ManualPage() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const sessionData = sessionStorage.getItem('ecc_session');
        if (!sessionData) { window.location.href = '/'; return; }
        const parsed = JSON.parse(sessionData);
        if (!parsed.isAdmin) { window.location.href = '/bulletin'; return; }
        setSession(parsed);
        setLoading(false);
    }, []);

    if (loading) return <div className="container"><p>読み込み中...</p></div>;

    return (
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
            <Link href="/admin" className="btn btn-secondary btn-small" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '20px' }}>
                ← 管理画面に戻る
            </Link>

            <header style={{
                background: 'linear-gradient(135deg, #FFB6C1 0%, #FF91A4 100%)',
                padding: '40px',
                borderRadius: '20px',
                color: 'white',
                marginBottom: '40px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ margin: 0, fontSize: '2rem' }}>ECC Junior 掲示板 運用マニュアル</h1>
                <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>管理者向け操作ガイド</p>
            </header>

            <div className="manual-content">
                <style jsx>{`
                    .manual-content h2 {
                        color: #FF91A4;
                        border-bottom: 2px solid #FFB6C1;
                        padding-bottom: 10px;
                        margin-top: 40px;
                        margin-bottom: 20px;
                    }
                    .manual-content h3 {
                        color: #5D5D5D;
                        margin-top: 30px;
                        margin-bottom: 15px;
                        border-left: 5px solid #98D8C8;
                        padding-left: 10px;
                    }
                    .manual-content p {
                        line-height: 1.8;
                        margin-bottom: 15px;
                        color: #444;
                    }
                    .manual-content img {
                        max-width: 100%;
                        border-radius: 10px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                        margin: 20px 0;
                        border: 1px solid #eee;
                    }
                    .alert {
                        background: #FFF9C4;
                        padding: 15px;
                        border-radius: 10px;
                        color: #5D5D5D;
                        margin: 20px 0;
                        border-left: 5px solid #FFB347;
                    }
                    .step-list {
                        counter-reset: step;
                        padding-left: 0;
                        list-style: none;
                    }
                    .step-list li {
                        position: relative;
                        padding-left: 40px;
                        margin-bottom: 15px;
                    }
                    .step-list li::before {
                        counter-increment: step;
                        content: counter(step);
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 30px;
                        height: 30px;
                        background: #98D8C8;
                        color: white;
                        border-radius: 50%;
                        text-align: center;
                        line-height: 30px;
                        font-weight: bold;
                    }
                `}</style>

                <section>
                    <h2>1. ログイン</h2>
                    <ul>
                        <li><strong>URL</strong>: <a href="https://ecc-junior-bulletin-board2.vercel.app/">https://ecc-junior-bulletin-board2.vercel.app/</a></li>
                        <li><strong>管理者ID</strong>: <code>admin</code></li>
                        <li><strong>初期パスワード</strong>: <code>adminpass</code></li>
                    </ul>
                    <img src="/manual_images/1_login.png" alt="ログイン画面" />
                    <div className="alert">
                        <strong>重要:</strong> 管理画面へは、ログイン後にナビゲーションバーの「管理」ボタンをクリックしてアクセスします。
                    </div>
                </section>

                <section>
                    <h2>2. お知らせの管理（管理者・講師）</h2>
                    <p>管理画面の「お知らせ管理」タブで操作します。</p>
                    <img src="/manual_images/2_announcements.png" alt="管理画面-お知らせタブ" />

                    <h3>新規投稿</h3>
                    <ol className="step-list">
                        <li>「＋ 新しいお知らせを追加」ボタンをクリック。</li>
                        <li><strong>配信日</strong>: カレンダーから選択。</li>
                        <li><strong>タイトル/内容</strong>: 掲示板に表示される情報を入力。<br /><small>※ メッセージ内にURLを貼ると、自動的にリンクになります。</small></li>
                        <li><strong>対象教室</strong>: チェックを入れた教室のユーザーにのみ表示されます（未選択で全教室）。</li>
                        <li><strong>PDF添付</strong>: 「ファイル選択」からPDFをアップロードします。</li>
                        <li><strong>講師限定</strong>: オンにすると、生徒権限のユーザーには表示されません。</li>
                        <li><strong>メール通知</strong>: チェックを入れると、登録時にユーザーへ一括送信されます。</li>
                    </ol>
                    <img src="/manual_images/3_add_modal.png" alt="お知らせ追加モーダル" />

                    <h3>編集・削除</h3>
                    <p>一覧の各カードにある「編集」「削除」ボタンより操作可能です。<br />「✉️ 再送」ボタンで、過去の投稿を再度メール通知できます。</p>
                </section>

                <section>
                    <h2>3. ユーザーの管理</h2>
                    <p>「ユーザー管理」タブで操作します。</p>
                    <img src="/manual_images/4_users.png" alt="管理画面-ユーザータブ" />

                    <h3>個別登録・編集</h3>
                    <p>「＋ 新しいユーザーを登録」から1人ずつ登録可能。<br />役割（管理者・講師・生徒）と所属教室を正確に設定してください。</p>

                    <h3>CSV一括登録（推奨）</h3>
                    <ol className="step-list">
                        <li>「📄 CSVテンプレート」をダウンロードします。</li>
                        <li>Excelなどで情報を入力します。
                            <ul>
                                <li><strong>ID</strong>: 重複不可</li>
                                <li><strong>講師/管理者(1=はい)</strong>: <code>1</code> または <code>0</code> を入力</li>
                                <li><strong>所属教室</strong>: <code>aizumi-jr</code> 等のIDをカンマ区切りで入力</li>
                            </ul>
                        </li>
                        <li>「📥 CSV一括登録」からファイルを読み込みます。</li>
                    </ol>
                </section>

                <section>
                    <h2>4. ログの確認</h2>
                    <p>「ログ監視」タブにて、誰がいつPDFを閲覧したか、ログインしたか等の履歴を確認できます。不審なアクセスのチェックや、周知状況の把握に役立ててください。</p>
                    <img src="/manual_images/5_logs.png" alt="管理画面-ログタブ" />
                </section>

                <footer style={{ marginTop: '60px', borderTop: '1px solid #eee', paddingTop: '20px', color: '#888', textAlign: 'center' }}>
                    ECC Junior Bulletin Board System Manual
                </footer>
            </div>
        </div>
    );
}
