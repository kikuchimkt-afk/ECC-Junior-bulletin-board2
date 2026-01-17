'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { SCHOOLS, getSchoolName, getSchoolColor } from '../lib/schools';

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
    const [formSchools, setFormSchools] = useState([]);

    // ユーザーフォーム状態
    const [userFormId, setUserFormId] = useState('');
    const [userFormPassword, setUserFormPassword] = useState('');
    const [userFormName, setUserFormName] = useState('');
    const [userFormIsAdmin, setUserFormIsAdmin] = useState(false);
    const [userFormIsTeacher, setUserFormIsTeacher] = useState(false); // 講師フラグ
    const [userFormSchools, setUserFormSchools] = useState([]);

    useEffect(() => {
        const sessionData = sessionStorage.getItem('ecc_session');
        if (!sessionData) { window.location.href = '/'; return; }
        const parsed = JSON.parse(sessionData);
        if (!parsed.isAdmin) { window.location.href = '/bulletin'; return; }
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
            if (result.announcements) setAnnouncements(result.announcements);
        } catch (error) { console.error('Load announcements error:', error); }
        finally { setLoading(false); }
    };

    const loadUsers = async () => {
        try {
            const response = await fetch('/api/users');
            const result = await response.json();
            if (result.users) setUsers(result.users);
        } catch (error) { console.error('Load users error:', error); }
    };

    const loadLogs = async () => {
        try {
            const response = await fetch('/api/logs?limit=200');
            const result = await response.json();
            if (result.logs) setLogs(result.logs);
        } catch (error) { console.error('Load logs error:', error); }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/logs', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: session?.userId, action: 'logout', details: 'ログアウト' })
            });
        } catch (err) { }
        sessionStorage.removeItem('ecc_session');
        window.location.href = '/';
    };

    // ========== お知らせ関連 ==========
    const openAddModal = () => {
        setEditingAnnouncement(null);
        setFormDate(new Date().toISOString().split('T')[0]);
        setFormTitle('');
        setFormPdfUrl('');
        setSelectedFileName('');
        setFormSchools([]);
        setShowModal(true);
    };

    const openEditModal = (announcement) => {
        setEditingAnnouncement(announcement);
        setFormDate(`${announcement.year}-${String(announcement.month).padStart(2, '0')}-${String(announcement.day).padStart(2, '0')}`);
        setFormTitle(announcement.title);
        setFormPdfUrl(announcement.pdfUrl || '');
        setSelectedFileName(announcement.pdfUrl ? 'アップロード済み' : '');
        setFormSchools(announcement.schools || []);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAnnouncement(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const toggleFormSchool = (schoolId) => {
        setFormSchools(prev => prev.includes(schoolId) ? prev.filter(id => id !== schoolId) : [...prev, schoolId]);
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') { alert('PDFファイルを選択してください'); return; }
        setUploading(true);
        setSelectedFileName(file.name);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Upload failed');
            const result = await response.json();
            setFormPdfUrl(result.url);
            setSelectedFileName(`✅ ${file.name}`);
        } catch (error) { console.error('Upload error:', error); alert('アップロードに失敗しました'); setSelectedFileName(''); }
        finally { setUploading(false); }
    };

    const handleSaveAnnouncement = async (e) => {
        e.preventDefault();
        if (!formDate || !formTitle) { alert('日付とタイトルを入力してください'); return; }
        const [year, month, day] = formDate.split('-').map(Number);
        try {
            if (editingAnnouncement) {
                await fetch(`/api/announcements/${editingAnnouncement.id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ year, month, day, title: formTitle, pdfUrl: formPdfUrl, schools: formSchools })
                });
            } else {
                await fetch('/api/announcements', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ year, month, day, title: formTitle, pdfUrl: formPdfUrl, schools: formSchools })
                });
            }
            closeModal();
            loadAnnouncements();
        } catch (error) { console.error('Save announcement error:', error); alert('保存に失敗しました'); }
    };

    const handleDeleteAnnouncement = async (id) => {
        if (!confirm('このお知らせを削除しますか？')) return;
        try { await fetch(`/api/announcements/${id}`, { method: 'DELETE' }); loadAnnouncements(); }
        catch (error) { console.error('Delete announcement error:', error); }
    };

    // ========== ユーザー関連 ==========
    const openAddUserModal = () => {
        setEditingUser(null);
        setUserFormId('');
        setUserFormPassword('');
        setUserFormName('');
        setUserFormIsAdmin(false);
        setUserFormIsTeacher(false);
        setUserFormSchools([]);
        setShowUserModal(true);
    };

    const openEditUserModal = (user) => {
        setEditingUser(user);
        setUserFormId(user.id);
        setUserFormPassword('');
        setUserFormName(user.name);
        setUserFormIsAdmin(user.isAdmin);
        setUserFormIsTeacher(user.isTeacher || false);
        setUserFormSchools(user.schools || []);
        setShowUserModal(true);
    };

    const closeUserModal = () => {
        setShowUserModal(false);
        setEditingUser(null);
    };

    const toggleUserSchool = (schoolId) => {
        setUserFormSchools(prev => prev.includes(schoolId) ? prev.filter(id => id !== schoolId) : [...prev, schoolId]);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        if (!userFormId || !userFormName || (!editingUser && !userFormPassword)) { alert('必須項目を入力してください'); return; }
        try {
            if (editingUser) {
                const response = await fetch(`/api/users/${userFormId}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: userFormPassword || undefined, name: userFormName, isAdmin: userFormIsAdmin, isTeacher: userFormIsTeacher, schools: userFormSchools })
                });
                if (!response.ok) { const result = await response.json(); alert(result.error || '更新に失敗しました'); return; }
            } else {
                const response = await fetch('/api/users', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: userFormId, password: userFormPassword, name: userFormName, isAdmin: userFormIsAdmin, isTeacher: userFormIsTeacher, schools: userFormSchools })
                });
                if (!response.ok) { const result = await response.json(); alert(result.error || '登録に失敗しました'); return; }
            }
            closeUserModal();
            loadUsers();
        } catch (error) { console.error('Save user error:', error); alert('保存に失敗しました'); }
    };

    const handleDeleteUser = async (id) => {
        if (id === 'admin') { alert('管理者アカウントは削除できません'); return; }
        if (!confirm('このユーザーを削除しますか？')) return;
        try { await fetch(`/api/users/${id}`, { method: 'DELETE' }); loadUsers(); }
        catch (error) { console.error('Delete user error:', error); }
    };

    // CSVテンプレート
    const downloadUserTemplate = () => {
        const bom = '\uFEFF';
        const headers = ['ユーザーID', 'パスワード', '名前', '講師(1=はい)', '所属教室'];
        const example = ['user003', 'pass003', '山田 花子', '0', 'aizumi-jr,aizumi-bo'];
        const csvContent = bom + [headers, example].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = 'user_template.csv'; link.click();
        URL.revokeObjectURL(url);
    };

    // CSVインポート
    const handleUserCSVImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const lines = text.split(/\r?\n/).filter(line => line.trim());
                if (lines.length < 2) { alert('データがありません'); return; }
                const dataLines = lines.slice(1);
                let successCount = 0, errorCount = 0;
                const errors = [];
                for (const line of dataLines) {
                    const parts = line.match(/("?[^"]*"?|[^,]+)/g)?.map(p => p.replace(/^"|"$/g, '').trim()) || [];
                    if (parts.length < 3) { errorCount++; errors.push(`無効な行: ${line}`); continue; }
                    const [id, password, name, isTeacherStr, schoolsStr] = parts;
                    if (!id || !password || !name) { errorCount++; errors.push(`必須項目が空: ${line}`); continue; }
                    const isTeacher = isTeacherStr === '1';
                    const schools = schoolsStr ? schoolsStr.split(',').map(s => s.trim()).filter(s => s) : [];
                    try {
                        const response = await fetch('/api/users', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id, password, name, isAdmin: false, isTeacher, schools })
                        });
                        if (response.ok) { successCount++; } else { const result = await response.json(); errorCount++; errors.push(`${id}: ${result.error}`); }
                    } catch (err) { errorCount++; errors.push(`${id}: エラー`); }
                }
                let message = `インポート完了\n成功: ${successCount}件`;
                if (errorCount > 0) { message += `\n失敗: ${errorCount}件\n\n${errors.slice(0, 5).join('\n')}`; if (errors.length > 5) message += `\n...他${errors.length - 5}件`; }
                alert(message);
                loadUsers();
            } catch (error) { console.error('CSV import error:', error); alert('CSVの読み込みに失敗しました'); }
        };
        reader.readAsText(file, 'UTF-8');
        e.target.value = '';
    };

    // ========== ログ関連 ==========
    const clearLogs = async () => {
        if (!confirm('すべてのログを削除しますか？')) return;
        try { await fetch('/api/logs', { method: 'DELETE' }); setLogs([]); }
        catch (error) { console.error('Clear logs error:', error); }
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    const getActionLabel = (action) => {
        switch (action) {
            case 'login': return '🔓';
            case 'logout': return '🔒';
            case 'view_pdf': return '📄';
            case 'login_failed': return '❌';
            default: return action;
        }
    };

    const getUserName = (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? user.name : userId;
    };

    const downloadLogsCSV = () => {
        if (logs.length === 0) { alert('ダウンロードするログがありません'); return; }
        const bom = '\uFEFF';
        const headers = ['日時', 'ユーザーID', '名前', 'アクション', '詳細'];
        const rows = logs.map(log => [new Date(log.timestamp).toLocaleString('ja-JP'), log.userId, getUserName(log.userId), log.action, log.details || '']);
        const csvContent = bom + [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = `access_log_${new Date().toISOString().split('T')[0]}.csv`; link.click();
        URL.revokeObjectURL(url);
    };

    // ユーザーの役割表示
    const getUserRole = (user) => {
        if (user.isAdmin) return '👑 管理者';
        if (user.isTeacher) return '👩‍🏫 講師';
        return '👤 生徒';
    };

    return (
        <div className="container">
            <header className="header">
                <h1>⚙️ ECC 管理</h1>
                <p>お知らせ・ユーザー・ログ</p>
            </header>

            <nav className="nav-bar">
                <div className="user-info">
                    <span>👤 {session?.name}</span>
                    <Link href="/bulletin" className="btn btn-small btn-secondary">掲示板</Link>
                    <button onClick={handleLogout} className="btn btn-small btn-danger">ログアウト</button>
                </div>
            </nav>

            <div className="admin-tabs">
                <button className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => { setActiveTab('announcements'); loadAnnouncements(); }}>📢</button>
                <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); loadUsers(); }}>👥</button>
                <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => { setActiveTab('logs'); loadLogs(); }}>📋</button>
            </div>

            {/* お知らせ管理タブ */}
            {activeTab === 'announcements' && (
                <div className="admin-card">
                    <h3>📢 お知らせ</h3>
                    <button className="btn btn-primary btn-small" onClick={openAddModal} style={{ marginBottom: '15px', width: '100%' }}>＋ 新規追加</button>
                    <div className="card-list">
                        {loading ? <p style={{ textAlign: 'center' }}>読み込み中...</p> : announcements.length === 0 ? <p style={{ textAlign: 'center' }}>お知らせがありません</p> : (
                            announcements.map((item) => (
                                <div key={item.id} className="card-item">
                                    <div className="card-item-header">
                                        <span className="card-date">{item.month}/{item.day}</span>
                                        <span className="card-title">{item.title}</span>
                                    </div>
                                    <div className="card-item-body">
                                        <div className="school-tags">
                                            {item.schools?.length > 0 ? item.schools.map(s => <span key={s} className="school-tag" style={{ backgroundColor: getSchoolColor(s) }}>{getSchoolName(s)}</span>) : <span className="school-tag" style={{ backgroundColor: '#999' }}>全教室</span>}
                                        </div>
                                        <div className="card-actions">
                                            {item.pdfUrl && <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-icon">📄</a>}
                                            <button className="btn-icon" onClick={() => openEditModal(item)}>✏️</button>
                                            <button className="btn-icon" onClick={() => handleDeleteAnnouncement(item.id)}>🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ユーザー管理タブ */}
            {activeTab === 'users' && (
                <div className="admin-card">
                    <h3>👥 ユーザー</h3>
                    <div className="btn-group">
                        <button className="btn btn-primary btn-small" onClick={openAddUserModal}>＋ 新規</button>
                        <button className="btn btn-secondary btn-small" onClick={downloadUserTemplate}>📄 CSV</button>
                        <label className="btn btn-secondary btn-small" style={{ cursor: 'pointer' }}>
                            📥 一括
                            <input type="file" accept=".csv" onChange={handleUserCSVImport} style={{ display: 'none' }} />
                        </label>
                    </div>
                    <div className="card-list">
                        {users.length === 0 ? <p style={{ textAlign: 'center' }}>ユーザーがいません</p> : (
                            users.map((user) => (
                                <div key={user.id} className="card-item">
                                    <div className="card-item-header">
                                        <span className="card-role">{getUserRole(user)}</span>
                                        <span className="card-title">{user.name}</span>
                                    </div>
                                    <div className="card-item-body">
                                        <div className="school-tags">
                                            {user.isTeacher ? <span className="school-tag" style={{ backgroundColor: '#FF6B9D' }}>全教室</span> : user.schools?.length > 0 ? user.schools.map(s => <span key={s} className="school-tag" style={{ backgroundColor: getSchoolColor(s) }}>{getSchoolName(s)}</span>) : <span style={{ color: '#999', fontSize: '0.8rem' }}>未設定</span>}
                                        </div>
                                        <div className="card-actions">
                                            <button className="btn-icon" onClick={() => openEditUserModal(user)}>✏️</button>
                                            {user.id !== 'admin' && <button className="btn-icon" onClick={() => handleDeleteUser(user.id)}>🗑️</button>}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ログ監視タブ */}
            {activeTab === 'logs' && (
                <div className="admin-card">
                    <h3>📋 ログ</h3>
                    <div className="btn-group">
                        <button className="btn btn-secondary btn-small" onClick={downloadLogsCSV}>📥 CSV</button>
                        <button className="btn btn-danger btn-small" onClick={clearLogs}>クリア</button>
                    </div>
                    <div className="log-list">
                        {logs.length === 0 ? <p style={{ textAlign: 'center' }}>ログがありません</p> : (
                            logs.map((log, index) => (
                                <div key={index} className="log-item">
                                    <span className="log-action">{getActionLabel(log.action)}</span>
                                    <span className="log-user">{getUserName(log.userId)}</span>
                                    <span className="log-time">{formatDate(log.timestamp)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* お知らせモーダル */}
            {showModal && (
                <div className="modal-overlay show">
                    <div className="modal-content">
                        <button className="modal-close" onClick={closeModal}>&times;</button>
                        <h3>{editingAnnouncement ? '編集' : '新規追加'}</h3>
                        <form onSubmit={handleSaveAnnouncement}>
                            <div className="form-group"><label>📅 配信日</label><input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required /></div>
                            <div className="form-group"><label>タイトル</label><input type="text" placeholder="例: 年始のご挨拶" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required /></div>

                            <div className="form-group">
                                <label>🏫 対象教室</label>
                                <div className="school-checkbox-group">
                                    {SCHOOLS.map(school => (
                                        <label key={school.id} className={`school-checkbox ${formSchools.includes(school.id) ? 'selected' : ''}`}>
                                            <input type="checkbox" checked={formSchools.includes(school.id)} onChange={() => toggleFormSchool(school.id)} />
                                            <span>{school.name}</span>
                                        </label>
                                    ))}
                                </div>
                                <small style={{ color: '#888' }}>※未選択 = 全教室</small>
                            </div>

                            <div className="form-group">
                                <label>📄 PDF</label>
                                <div className="file-input-wrapper">
                                    <input type="file" ref={fileInputRef} accept=".pdf" onChange={handleFileSelect} disabled={uploading} />
                                    <div className="file-input-label"><span>{uploading ? 'アップロード中...' : '📁 ファイル選択'}</span></div>
                                </div>
                                {selectedFileName && <div className="selected-file show">{selectedFileName}</div>}
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '15px' }} disabled={uploading}>保存</button>
                        </form>
                    </div>
                </div>
            )}

            {/* ユーザーモーダル */}
            {showUserModal && (
                <div className="modal-overlay show">
                    <div className="modal-content">
                        <button className="modal-close" onClick={closeUserModal}>&times;</button>
                        <h3>{editingUser ? '編集' : '新規登録'}</h3>
                        <form onSubmit={handleSaveUser}>
                            <div className="form-group"><label>ID</label><input type="text" placeholder="user003" value={userFormId} onChange={(e) => setUserFormId(e.target.value)} required disabled={!!editingUser} /></div>
                            <div className="form-group"><label>パスワード{editingUser && '（変更時のみ）'}</label><input type="text" placeholder={editingUser ? '空欄=変更なし' : 'パスワード'} value={userFormPassword} onChange={(e) => setUserFormPassword(e.target.value)} required={!editingUser} /></div>
                            <div className="form-group"><label>名前</label><input type="text" placeholder="山田 太郎" value={userFormName} onChange={(e) => setUserFormName(e.target.value)} required /></div>

                            <div className="form-group">
                                <label>役割</label>
                                <div className="role-buttons">
                                    <button type="button" className={`role-btn ${!userFormIsAdmin && !userFormIsTeacher ? 'active' : ''}`} onClick={() => { setUserFormIsAdmin(false); setUserFormIsTeacher(false); }}>👤 生徒</button>
                                    <button type="button" className={`role-btn ${userFormIsTeacher && !userFormIsAdmin ? 'active' : ''}`} onClick={() => { setUserFormIsAdmin(false); setUserFormIsTeacher(true); }}>👩‍🏫 講師</button>
                                    <button type="button" className={`role-btn ${userFormIsAdmin ? 'active' : ''}`} onClick={() => { setUserFormIsAdmin(true); setUserFormIsTeacher(false); }}>👑 管理者</button>
                                </div>
                            </div>

                            {!userFormIsTeacher && !userFormIsAdmin && (
                                <div className="form-group">
                                    <label>🏫 所属教室</label>
                                    <div className="school-checkbox-group">
                                        {SCHOOLS.map(school => (
                                            <label key={school.id} className={`school-checkbox ${userFormSchools.includes(school.id) ? 'selected' : ''}`}>
                                                <input type="checkbox" checked={userFormSchools.includes(school.id)} onChange={() => toggleUserSchool(school.id)} />
                                                <span>{school.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {userFormIsTeacher && <p style={{ color: '#FF6B9D', fontSize: '0.9rem', marginBottom: '15px' }}>👩‍🏫 講師は全教室のお知らせを閲覧できます</p>}

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>保存</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
