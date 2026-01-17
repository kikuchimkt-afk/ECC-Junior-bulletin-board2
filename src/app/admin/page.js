'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function AdminPage() {
    const [session, setSession] = useState(null);
    const [activeTab, setActiveTab] = useState('announcements');
    const [announcements, setAnnouncements] = useState([]);
    const [logs, setLogs] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    // フォーム状態
    const [formDate, setFormDate] = useState('');
    const [formTitle, setFormTitle] = useState('');
    const [formPdfUrl, setFormPdfUrl] = useState('');
    const [selectedFileName, setSelectedFileName] = useState('');

    useEffect(() => {
        // 認証チェック（管理者のみ）
        const sessionData = sessionStorage.getItem('ecc_session');
        if (!sessionData) {
            window.location.href = '/';
            return;
        }
        const parsed = JSON.parse(sessionData);
        if (!parsed.isAdmin) {
            window.location.href = '/bulletin';
            return;
        }
        setSession(parsed);

        loadAnnouncements();
        loadLogs();
    }, []);

    const loadAnnouncements = () => {
        const stored = localStorage.getItem('ecc_announcements');
        if (stored) {
            const data = JSON.parse(stored);
            data.sort((a, b) => {
                const dateA = new Date(a.year, a.month - 1, a.day);
                const dateB = new Date(b.year, b.month - 1, b.day);
                return dateB - dateA;
            });
            setAnnouncements(data);
        }
    };

    const loadLogs = () => {
        const stored = localStorage.getItem('ecc_logs');
        if (stored) {
            setLogs(JSON.parse(stored));
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('ecc_session');
        window.location.href = '/';
    };

    const openAddModal = () => {
        setEditingAnnouncement(null);
        const today = new Date();
        setFormDate(today.toISOString().split('T')[0]);
        setFormTitle('');
        setFormPdfUrl('');
        setSelectedFileName('');
        setShowModal(true);
    };

    const openEditModal = (announcement) => {
        setEditingAnnouncement(announcement);
        const dateStr = `${announcement.year}-${String(announcement.month).padStart(2, '0')}-${String(announcement.day).padStart(2, '0')}`;
        setFormDate(dateStr);
        setFormTitle(announcement.title);
        setFormPdfUrl(announcement.pdfUrl || '');
        setSelectedFileName(announcement.pdfUrl ? 'アップロード済み' : '');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAnnouncement(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('PDFファイルを選択してください');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setSelectedFileName(file.name);

        try {
            // FormDataを作成
            const formData = new FormData();
            formData.append('file', file);

            // Vercel Blob APIにアップロード
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();
            setFormPdfUrl(result.url);
            setUploadProgress(100);
            setSelectedFileName(`✅ ${file.name} (アップロード完了)`);
        } catch (error) {
            console.error('Upload error:', error);
            alert('アップロードに失敗しました。サーバー設定を確認してください。');
            setSelectedFileName('');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();

        if (!formDate || !formTitle) {
            alert('日付とタイトルを入力してください');
            return;
        }

        const [year, month, day] = formDate.split('-').map(Number);

        const newAnnouncement = {
            id: editingAnnouncement?.id || Date.now(),
            year,
            month,
            day,
            title: formTitle,
            pdfUrl: formPdfUrl
        };

        let updated;
        if (editingAnnouncement) {
            updated = announcements.map(a => a.id === editingAnnouncement.id ? newAnnouncement : a);
        } else {
            updated = [...announcements, newAnnouncement];
        }

        localStorage.setItem('ecc_announcements', JSON.stringify(updated));
        setAnnouncements(updated);
        closeModal();
        loadAnnouncements();
    };

    const handleDelete = (id) => {
        if (!confirm('このお知らせを削除しますか？')) return;
        const updated = announcements.filter(a => a.id !== id);
        localStorage.setItem('ecc_announcements', JSON.stringify(updated));
        setAnnouncements(updated);
    };

    const clearLogs = () => {
        if (!confirm('すべてのログを削除しますか？')) return;
        localStorage.setItem('ecc_logs', '[]');
        setLogs([]);
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    const getActionLabel = (action) => {
        switch (action) {
            case 'login': return '🔓 ログイン';
            case 'logout': return '🔒 ログアウト';
            case 'view_pdf': return '📄 PDF閲覧';
            case 'login_failed': return '❌ ログイン失敗';
            default: return action;
        }
    };

    return (
        <div className="container">
            <header className="header">
                <h1>⚙️ 管理者ダッシュボード</h1>
                <p>お知らせ・ユーザー・ログを管理</p>
            </header>

            <nav className="nav-bar">
                <div className="user-info">
                    <span>👤 {session?.name} さん</span>
                    <Link href="/bulletin" className="btn btn-small btn-secondary">掲示板</Link>
                    <button onClick={handleLogout} className="btn btn-small btn-danger">ログアウト</button>
                </div>
            </nav>

            {/* タブ */}
            <div className="admin-tabs">
                <button
                    className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
                    onClick={() => setActiveTab('announcements')}
                >
                    📢 お知らせ管理
                </button>
                <button
                    className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('logs'); loadLogs(); }}
                >
                    📋 ログ監視
                </button>
            </div>

            {/* お知らせ管理タブ */}
            {activeTab === 'announcements' && (
                <div className="admin-card">
                    <h3>📢 お知らせ一覧</h3>
                    <button className="btn btn-primary btn-small" onClick={openAddModal} style={{ marginBottom: '20px' }}>
                        ＋ 新しいお知らせを追加
                    </button>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>配信日</th>
                                    <th>タイトル</th>
                                    <th>PDF</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {announcements.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center' }}>お知らせがありません</td>
                                    </tr>
                                ) : (
                                    announcements.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.year}年{item.month}月{item.day}日</td>
                                            <td>{item.title}</td>
                                            <td>
                                                {item.pdfUrl ? (
                                                    <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer">📄 表示</a>
                                                ) : (
                                                    <span style={{ color: '#999' }}>未登録</span>
                                                )}
                                            </td>
                                            <td className="actions">
                                                <button className="btn-edit" onClick={() => openEditModal(item)}>編集</button>
                                                <button className="btn-delete" onClick={() => handleDelete(item.id)}>削除</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ログ監視タブ */}
            {activeTab === 'logs' && (
                <div className="admin-card">
                    <h3>📋 アクセスログ</h3>
                    <button className="btn btn-danger btn-small" onClick={clearLogs} style={{ marginBottom: '20px' }}>
                        ログをクリア
                    </button>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>日時</th>
                                    <th>ユーザーID</th>
                                    <th>アクション</th>
                                    <th>詳細</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center' }}>ログがありません</td>
                                    </tr>
                                ) : (
                                    logs.map((log, index) => (
                                        <tr key={index}>
                                            <td>{formatDate(log.timestamp)}</td>
                                            <td>{log.userId}</td>
                                            <td>{getActionLabel(log.action)}</td>
                                            <td>{log.details || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* モーダル */}
            {showModal && (
                <div className="modal-overlay show">
                    <div className="modal-content">
                        <button className="modal-close" onClick={closeModal}>&times;</button>
                        <h3>{editingAnnouncement ? 'お知らせを編集' : '新しいお知らせを追加'}</h3>

                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>📅 配信日</label>
                                <input
                                    type="date"
                                    value={formDate}
                                    onChange={(e) => setFormDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>タイトル</label>
                                <input
                                    type="text"
                                    placeholder="例: 年始のご挨拶"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>📄 PDFファイル</label>
                                <div className="file-input-wrapper">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept=".pdf"
                                        onChange={handleFileSelect}
                                        disabled={uploading}
                                    />
                                    <div className="file-input-label">
                                        <span className="icon">📁</span>
                                        <span>{uploading ? 'アップロード中...' : 'PDFファイルを選択'}</span>
                                    </div>
                                </div>
                                {selectedFileName && (
                                    <div className="selected-file show">{selectedFileName}</div>
                                )}
                                {uploading && (
                                    <div className="upload-progress show">
                                        <div className="progress-bar">
                                            <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ marginTop: '15px' }} disabled={uploading}>
                                保存する
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
