'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SCHOOLS, getSchoolName, getSchoolColor } from '../lib/schools';

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
    const [selectedSchools, setSelectedSchools] = useState([]);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

    useEffect(() => {
        const sessionData = sessionStorage.getItem('ecc_session');
        if (!sessionData) {
            window.location.href = '/';
            return;
        }
        const parsed = JSON.parse(sessionData);
        setSession(parsed);

        // 講師・管理者は全教室、それ以外は自分の所属教室をデフォルトに
        if (!parsed.isTeacher && !parsed.isAdmin && parsed.schools?.length > 0) {
            setSelectedSchools(parsed.schools);
        }

        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        try {
            const response = await fetch('/api/announcements');
            const result = await response.json();
            if (result.announcements) setAnnouncements(result.announcements);
        } catch (error) { console.error('Error loading announcements:', error); }
        finally { setLoading(false); }
    };

    const handleLogout = async () => {
        const sessionData = sessionStorage.getItem('ecc_session');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            try {
                await fetch('/api/logs', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: session.userId, action: 'logout', details: 'ログアウト' })
                });
            } catch (err) { }
        }
        sessionStorage.removeItem('ecc_session');
        window.location.href = '/';
    };

    const openPdf = async (announcement) => {
        try {
            await fetch('/api/logs', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: session?.userId, action: 'view_pdf', details: `PDF閲覧: ${announcement.title}` })
            });
        } catch (err) { }

        if (announcement.pdfUrl) {
            window.open(announcement.pdfUrl, '_blank');
        } else {
            alert('PDFがまだアップロードされていません');
        }
    };

    // 教室フィルター切り替え
    const toggleSchoolFilter = (schoolId) => {
        setSelectedSchools(prev => prev.includes(schoolId) ? prev.filter(id => id !== schoolId) : [...prev, schoolId]);
    };

    // 全件表示
    const showAll = () => setSelectedSchools([]);

    // フィルタリング
    const filteredAnnouncements = announcements.filter(item => {
        // 講師・管理者でない場合は講師限定を除外
        if (item.teacherOnly && !session?.isTeacher && !session?.isAdmin) return false;

        if (selectedSchools.length === 0) return true;
        if (!item.schools || item.schools.length === 0) return true;
        return item.schools.some(s => selectedSchools.includes(s));
    });

    // 月ごとにグループ化
    const groupedAnnouncements = filteredAnnouncements.reduce((groups, item) => {
        const key = `${item.year}-${String(item.month).padStart(2, '0')}`;
        if (!groups[key]) groups[key] = { year: item.year, month: item.month, items: [] };
        groups[key].items.push(item);
        return groups;
    }, {});

    const sortedGroups = Object.values(groupedAnnouncements).sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month);

    // ユーザーのバッジ表示
    const getUserBadges = () => {
        if (!session) return null;
        if (session.isAdmin) return <span className="user-badge admin">👑 管理者</span>;
        if (session.isTeacher) return <span className="user-badge teacher">👩‍🏫 講師</span>;
        if (session.schools?.length > 0) {
            return (
                <div className="user-badges">
                    {session.schools.map(s => (
                        <span key={s} className="user-badge" style={{ backgroundColor: getSchoolColor(s) }}>{getSchoolName(s)}</span>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return <div className="container"><div className="empty-state"><div className="icon">⏳</div><p>読み込み中...</p></div></div>;
    }

    return (
        <div className="container">
            <header className="header">
                <h1>🏫 ECC お知らせ</h1>
                <p>最新のお知らせをチェック！</p>
            </header>

            <nav className="nav-bar">
                <div className="user-info">
                    <span className="user-name">👤 {session?.name}</span>
                    {getUserBadges()}
                    {session?.isAdmin && <Link href="/admin" className="btn btn-small btn-secondary">管理</Link>}
                    <button onClick={handleLogout} className="btn btn-small btn-danger">ログアウト</button>
                </div>
            </nav>

            {/* 教室フィルター */}
            <div className="school-filter">
                <div className="filter-buttons">
                    <button className={`filter-btn ${selectedSchools.length === 0 ? 'active' : ''}`} onClick={showAll}>全て</button>
                    {SCHOOLS.map(school => (
                        <button
                            key={school.id}
                            className={`filter-btn ${selectedSchools.includes(school.id) ? 'active' : ''}`}
                            style={{
                                backgroundColor: selectedSchools.includes(school.id) ? school.color : 'transparent',
                                borderColor: school.color,
                                color: selectedSchools.includes(school.id) ? 'white' : school.color
                            }}
                            onClick={() => toggleSchoolFilter(school.id)}
                        >
                            {school.name}
                        </button>
                    ))}
                </div>
            </div>

            <main>
                {sortedGroups.length === 0 ? (
                    <div className="empty-state"><div className="icon">📭</div><p>該当するお知らせはありません</p></div>
                ) : (
                    sortedGroups.map((group) => (
                        <div key={`${group.year}-${group.month}`} className="month-section">
                            <div className="month-header">
                                <span className="icon">{MONTH_EMOJIS[group.month] || '📅'}</span>
                                <h2>{group.year}年{group.month}月</h2>
                            </div>
                            <div className="announcement-list">
                                {group.items.sort((a, b) => b.day - a.day).map((item) => (
                                    <div key={item.id} className="announcement-item" onClick={() => setSelectedAnnouncement(item)} style={{ cursor: 'pointer' }}>
                                        <div className="announcement-main" style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', width: '100%' }}>
                                            <span className="announcement-date">{item.month}/{item.day}</span>
                                            <span className="announcement-title" style={{ flex: '0 1 auto' }}>
                                                {item.title}
                                                {item.teacherOnly && (
                                                    <span className="school-tag" style={{ marginLeft: '10px', backgroundColor: '#FFD7E0', color: '#D81B60', fontWeight: 'bold' }}>
                                                        🔒 講師限定
                                                    </span>
                                                )}
                                            </span>
                                            <div className="school-tags" style={{ marginTop: '0', marginLeft: 'auto' }}>
                                                {item.schools?.length > 0 ? item.schools.map(s => <span key={s} className="school-tag" style={{ backgroundColor: getSchoolColor(s) }}>{getSchoolName(s)}</span>) : <span className="school-tag" style={{ backgroundColor: '#999' }}>全教室</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* お知らせ詳細モーダル */}
            {selectedAnnouncement && (
                <div className="modal-overlay show" onClick={() => setSelectedAnnouncement(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <button className="modal-close" onClick={() => setSelectedAnnouncement(null)}>&times;</button>
                        <div style={{ marginBottom: '20px' }}>
                            <span className="announcement-date" style={{ display: 'inline-block', marginBottom: '10px' }}>
                                {selectedAnnouncement.year}年{selectedAnnouncement.month}月{selectedAnnouncement.day}日 配信
                            </span>
                            <h2 style={{ fontSize: '1.4rem', color: '#5D5D5D', lineHeight: '1.4' }}>
                                {selectedAnnouncement.title}
                                {selectedAnnouncement.teacherOnly && (
                                    <span style={{
                                        marginLeft: '10px',
                                        backgroundColor: '#FFD7E0',
                                        color: '#D81B60',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        verticalAlign: 'middle'
                                    }}>
                                        🔒 講師限定
                                    </span>
                                )}
                            </h2>
                        </div>

                        <div className="announcement-content" style={{
                            padding: '20px',
                            backgroundColor: '#F9F9F9',
                            borderRadius: '12px',
                            marginBottom: '25px',
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.8',
                            color: '#444',
                            border: '1px solid #eee'
                        }}>
                            {selectedAnnouncement.content || '詳細メッセージはありません。'}
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            {selectedAnnouncement.pdfUrl ? (
                                <a
                                    href={selectedAnnouncement.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '15px' }}
                                    onClick={() => {
                                        fetch('/api/logs', {
                                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ userId: session?.userId, action: 'view_pdf', details: `PDF閲覧: ${selectedAnnouncement.title}` })
                                        }).catch(() => { });
                                    }}
                                >
                                    📄 PDFの内容を確認する
                                </a>
                            ) : (
                                <p style={{ color: '#888' }}>PDFファイルはありません。</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
