'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function AdminPage() {
    const [session, setSession] = useState(null);
    const [activeTab, setActiveTab] = useState('announcements');
    const [announcements, setAnnouncements] = useState([]);
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    // お知らせフォーム状態
    const [formDate, setFormDate] = useState('');
    const [formTitle, setFormTitle] = useState('');
    const [formPdfUrl, setFormPdfUrl] = useState('');
    const [selectedFileName, setSelectedFileName] = useState('');

    // ユーザーフォーム状態
    const [userFormId, setUserFormId] = useState('');
    const [userFormPassword, setUserFormPassword] = useState('');
    const [userFormName, setUserFormName] = useState('');
    const [userFormIsAdmin, setUserFormIsAdmin] = useState(false);

    useEffect(() => {
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
        loadUsers();
    }, []);

    // ========== データ取得 ==========

    const loadAnnouncements = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/announcements');
            const result = await response.json();
            if (result.announcements) {
                setAnnouncements(result.announcements);
            }
        } catch (error) {
            console.error('Load announcements error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const response = await fetch('/api/users');
            const result = await response.json();
            if (result.users) {
                setUsers(result.users);
            }
        } catch (error) {
            console.error('Load users error:', error);
        }
    };

    const loadLogs = async () => {
        try {
            const response = await fetch('/api/logs?limit=200');
            const result = await response.json();
            if (result.logs) {
                setLogs(result.logs);
            }
        } catch (error) {
            console.error('Load logs error:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: session?.userId, action: 'logout', details: 'ログアウト' })
            });
        } catch (err) { }
        sessionStorage.removeItem('ecc_session');
        window.location.href = '/';
    };

    // ========== お知らせ関連 ==========

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
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            alert('PDFファイルを選択してください');
            return;
        }

        setUploading(true);
        setSelectedFileName(file.name);

        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Upload failed');
            const result = await response.json();
            setFormPdfUrl(result.url);
            setSelectedFileName(`✅ ${file.name} (アップロード完了)`);
        } catch (error) {
            console.error('Upload error:', error);
            alert('アップロードに失敗しました');
            setSelectedFileName('');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveAnnouncement = async (e) => {
        e.preventDefault();
        if (!formDate || !formTitle) {
            alert('日付とタイトルを入力してください');
            return;
        }

        const [year, month, day] = formDate.split('-').map(Number);

        try {
            if (editingAnnouncement) {
                // 更新
                await fetch(`/api/announcements/${editingAnnouncement.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ year, month, day, title: formTitle, pdfUrl: formPdfUrl })
                });
            } else {
                // 新規追加
                await fetch('/api/announcements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ year, month, day, title: formTitle, pdfUrl: formPdfUrl })
                });
            }
            closeModal();
            loadAnnouncements();
        } catch (error) {
            console.error('Save announcement error:', error);
            alert('保存に失敗しました');
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        if (!confirm('このお知らせを削除しますか？')) return;
        try {
            await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
            loadAnnouncements();
        } catch (error) {
            console.error('Delete announcement error:', error);
        }
    };

    // ========== ユーザー関連 ==========

    const openAddUserModal = () => {
        setEditingUser(null);
        setUserFormId('');
        setUserFormPassword('');
        setUserFormName('');
        setUserFormIsAdmin(false);
        setShowUserModal(true);
    };

    const openEditUserModal = (user) => {
        setEditingUser(user);
        setUserFormId(user.id);
        setUserFormPassword('');
        setUserFormName(user.name);
        setUserFormIsAdmin(user.isAdmin);
        setShowUserModal(true);
    };

    const closeUserModal = () => {
        setShowUserModal(false);
        setEditingUser(null);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        if (!userFormId || !userFormName || (!editingUser && !userFormPassword)) {
            alert('必須項目を入力してください');
            return;
        }

        try {
            if (editingUser) {
                const response = await fetch(`/api/users/${userFormId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: userFormPassword || undefined, name: userFormName, isAdmin: userFormIsAdmin })
                });
                if (!response.ok) {
                    const result = await response.json();
                    alert(result.error || '更新に失敗しました');
                    return;
                }
            } else {
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: userFormId, password: userFormPassword, name: userFormName, isAdmin: userFormIsAdmin })
                });
                if (!response.ok) {
                    const result = await response.json();
                    alert(result.error || '登録に失敗しました');
                    return;
                }
            }
            closeUserModal();
            loadUsers();
        } catch (error) {
            console.error('Save user error:', error);
            alert('保存に失敗しました');
        }
    };

    const handleDeleteUser = async (id) => {
        if (id === 'admin') { alert('管理者アカウントは削除できません'); return; }
        if (!confirm('このユーザーを削除しますか？')) return;
        try {
            await fetch(`/api/users/${id}`, { method: 'DELETE' });
            loadUsers();
        } catch (error) {
            console.error('Delete user error:', error);
        }
    };

    // ========== ログ関連 ==========

    const clearLogs = async () => {
        if (!confirm('すべてのログを削除しますか？')) return;
        try {
            await fetch('/api/logs', { method: 'DELETE' });
            setLogs([]);
        } catch (error) {
            console.error('Clear logs error:', error);
        }
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

            <div className="admin-tabs">
                <button className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => { setActiveTab('announcements'); loadAnnouncements(); }}>📢 お知らせ管理</button>
                <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); loadUsers(); }}>👥 ユーザー管理</button>
                <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => { setActiveTab('logs'); loadLogs(); }}>📋 ログ監視</button>
            </div>

            {/* お知らせ管理タブ */}
            {activeTab === 'announcements' && (
                <div className="admin-card">
                    <h3>📢 お知らせ一覧（サーバー保存）</h3>
                    <button className="btn btn-primary btn-small" onClick={openAddModal} style={{ marginBottom: '20px' }}>＋ 新しいお知らせを追加</button>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>配信日</th><th>タイトル</th><th>PDF</th><th>操作</th></tr></thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>読み込み中...</td></tr>
                                ) : announcements.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>お知らせがありません</td></tr>
                                ) : (
                                    announcements.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.year}年{item.month}月{item.day}日</td>
                                            <td>{item.title}</td>
                                            <td>{item.pdfUrl ? <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer">📄 表示</a> : <span style={{ color: '#999' }}>未登録</span>}</td>
                                            <td className="actions">
                                                <button className="btn-edit" onClick={() => openEditModal(item)}>編集</button>
                                                <button className="btn-delete" onClick={() => handleDeleteAnnouncement(item.id)}>削除</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ユーザー管理タブ */}
            {activeTab === 'users' && (
                <div className="admin-card">
                    <h3>👥 ユーザー一覧（サーバー保存）</h3>
                    <button className="btn btn-primary btn-small" onClick={openAddUserModal} style={{ marginBottom: '20px' }}>＋ 新しいユーザーを登録</button>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>ユーザーID</th><th>名前</th><th>権限</th><th>操作</th></tr></thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>ユーザーがいません</td></tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>
                                            <td>{user.name}</td>
                                            <td>{user.isAdmin ? '✅ 管理者' : '一般'}</td>
                                            <td className="actions">
                                                <button className="btn-edit" onClick={() => openEditUserModal(user)}>編集</button>
                                                {user.id !== 'admin' && <button className="btn-delete" onClick={() => handleDeleteUser(user.id)}>削除</button>}
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
                    <h3>📋 アクセスログ（サーバー保存）</h3>
                    <button className="btn btn-danger btn-small" onClick={clearLogs} style={{ marginBottom: '20px' }}>ログをクリア</button>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>日時</th><th>ユーザーID</th><th>アクション</th><th>詳細</th></tr></thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>ログがありません</td></tr>
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

            {/* お知らせモーダル */}
            {showModal && (
                <div className="modal-overlay show">
                    <div className="modal-content">
                        <button className="modal-close" onClick={closeModal}>&times;</button>
                        <h3>{editingAnnouncement ? 'お知らせを編集' : '新しいお知らせを追加'}</h3>
                        <form onSubmit={handleSaveAnnouncement}>
                            <div className="form-group"><label>📅 配信日</label><input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required /></div>
                            <div className="form-group"><label>タイトル</label><input type="text" placeholder="例: 年始のご挨拶" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required /></div>
                            <div className="form-group">
                                <label>📄 PDFファイル</label>
                                <div className="file-input-wrapper">
                                    <input type="file" ref={fileInputRef} accept=".pdf" onChange={handleFileSelect} disabled={uploading} />
                                    <div className="file-input-label"><span className="icon">📁</span><span>{uploading ? 'アップロード中...' : 'PDFファイルを選択'}</span></div>
                                </div>
                                {selectedFileName && <div className="selected-file show">{selectedFileName}</div>}
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '15px' }} disabled={uploading}>保存する</button>
                        </form>
                    </div>
                </div>
            )}

            {/* ユーザーモーダル */}
            {showUserModal && (
                <div className="modal-overlay show">
                    <div className="modal-content">
                        <button className="modal-close" onClick={closeUserModal}>&times;</button>
                        <h3>{editingUser ? 'ユーザーを編集' : '新しいユーザーを登録'}</h3>
                        <form onSubmit={handleSaveUser}>
                            <div className="form-group"><label>ユーザーID</label><input type="text" placeholder="例: user003" value={userFormId} onChange={(e) => setUserFormId(e.target.value)} required disabled={!!editingUser} /></div>
                            <div className="form-group"><label>パスワード{editingUser && '（変更する場合のみ）'}</label><input type="text" placeholder={editingUser ? '変更しない場合は空欄' : 'パスワード'} value={userFormPassword} onChange={(e) => setUserFormPassword(e.target.value)} required={!editingUser} /></div>
                            <div className="form-group"><label>名前</label><input type="text" placeholder="例: 山田 太郎" value={userFormName} onChange={(e) => setUserFormName(e.target.value)} required /></div>
                            <div className="form-group"><label><input type="checkbox" checked={userFormIsAdmin} onChange={(e) => setUserFormIsAdmin(e.target.checked)} /> 管理者権限を付与</label></div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '15px' }}>保存する</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
