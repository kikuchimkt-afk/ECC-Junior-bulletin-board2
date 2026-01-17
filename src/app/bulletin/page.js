'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// 月の絵文字
const MONTH_EMOJIS = {
    1: '🎍', 2: '💝', 3: '🌸', 4: '🌷',
    5: '🎏', 6: '☔', 7: '🎋', 8: '🌻',
    9: '🎑', 10: '🎃', 11: '🍂', 12: '🎄'
};

export default function BulletinPage() {
    const [session, setSession] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 認証チェック
        const sessionData = sessionStorage.getItem('ecc_session');
        if (!sessionData) {
            window.location.href = '/';
            return;
        }
        setSession(JSON.parse(sessionData));

        // お知らせ取得
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        try {
            // サーバーからお知らせ取得
            const response = await fetch('/api/announcements');
            const result = await response.json();

            if (result.announcements) {
                setAnnouncements(result.announcements);
            }
        } catch (error) {
            console.error('Error loading announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        // ログアウトログを記録
        const sessionData = sessionStorage.getItem('ecc_session');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            try {
                await fetch('/api/logs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: session.userId,
                        action: 'logout',
                        details: 'ログアウト'
                    })
                });
            } catch (err) {
                console.error('Logout log error:', err);
            }
        }

        sessionStorage.removeItem('ecc_session');
        window.location.href = '/';
    };

    const openPdf = async (announcement) => {
        // PDF閲覧ログを記録
        try {
            await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: session?.userId,
                    action: 'view_pdf',
                    details: `PDF閲覧: ${announcement.title}`
                })
            });
        } catch (err) {
            console.error('PDF log error:', err);
        }

        if (announcement.pdfUrl) {
            window.open(announcement.pdfUrl, '_blank');
        } else {
            alert('PDFがまだアップロードされていません');
        }
    };

    // 月ごとにグループ化
    const groupedAnnouncements = announcements.reduce((groups, item) => {
        const key = `${item.year}-${String(item.month).padStart(2, '0')}`;
        if (!groups[key]) {
            groups[key] = { year: item.year, month: item.month, items: [] };
        }
        groups[key].items.push(item);
        return groups;
    }, {});

    // ソート
    const sortedGroups = Object.values(groupedAnnouncements).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
    });

    if (loading) {
        return (
            <div className="container">
                <div className="empty-state">
                    <div className="icon">⏳</div>
                    <p>読み込み中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <header className="header">
                <h1>🐰 ECC Junior お知らせ掲示板</h1>
                <p>最新のお知らせをチェックしましょう！</p>
            </header>

            <nav className="nav-bar">
                <div className="user-info">
                    <span>👤 {session?.name} さん</span>
                    {session?.isAdmin && (
                        <Link href="/admin" className="btn btn-small btn-secondary">管理画面</Link>
                    )}
                    <button onClick={handleLogout} className="btn btn-small btn-danger">ログアウト</button>
                </div>
            </nav>

            <main>
                {sortedGroups.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">📭</div>
                        <p>現在お知らせはありません</p>
                    </div>
                ) : (
                    sortedGroups.map((group) => (
                        <div key={`${group.year}-${group.month}`} className="month-section">
                            <div className="month-header">
                                <span className="icon">{MONTH_EMOJIS[group.month] || '📅'}</span>
                                <h2>{group.year}年{group.month}月のお知らせ</h2>
                            </div>
                            <div className="announcement-list">
                                {group.items
                                    .sort((a, b) => b.day - a.day)
                                    .map((item) => (
                                        <div key={item.id} className="announcement-item">
                                            <span className="announcement-date">{group.month}月{item.day}日配信</span>
                                            <span className="announcement-title">{item.title}</span>
                                            <span
                                                className="announcement-link"
                                                onClick={() => openPdf(item)}
                                            >
                                                {item.title}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
