/**
 * API Helper - ECC Junior Bulletin Board
 * Vercel KV / API 連携ユーティリティ
 */

/**
 * データベースを初期化（API版では何もしない）
 */
async function initDatabase() {
    console.log('API abstraction initialized');
    return Promise.resolve();
}

/**
 * 初期データを挿入（API版では何もしない、またはサーバー側で初回に自動的に行われる）
 */
async function seedInitialData() {
    console.log('Seeding is handled by the server-side API if necessary');
    return Promise.resolve();
}

// ========== ユーザー関連 ==========

async function addUser(user) {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to add user');
    return result.user;
}

async function getUser(id) {
    // ログイン用の個別取得APIがないため、全取得からフィルター
    // 本来はAuth APIを使用すべき
    const users = await getAllUsers();
    return users.find(u => u.id === id);
}

async function getAllUsers() {
    const response = await fetch('/api/users');
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to fetch users');
    return result.users;
}

async function updateUser(user) {
    const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to update user');
    return result.user;
}

async function deleteUser(id) {
    const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete user');
    }
}

// ========== お知らせ関連 ==========

async function addAnnouncement(announcement) {
    const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcement)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to add announcement');
    return result.announcement;
}

async function getAnnouncement(id) {
    const announcements = await getAllAnnouncements();
    return announcements.find(a => a.id === parseInt(id));
}

async function getAllAnnouncements() {
    const response = await fetch('/api/announcements');
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to fetch announcements');
    return result.announcements;
}

async function updateAnnouncement(announcement) {
    const response = await fetch(`/api/announcements/${announcement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcement)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to update announcement');
    return result.announcement;
}

async function deleteAnnouncement(id) {
    const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete announcement');
    }
}

// ========== ログ関連 ==========

async function addLog(logEntry) {
    const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
    });
    if (!response.ok) {
        console.warn('Failed to add log entry');
    }
}

async function getAllLogs() {
    const response = await fetch('/api/logs');
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to fetch logs');
    return result.logs;
}

async function getLogsByUser(userId) {
    const response = await fetch(`/api/logs?userId=${userId}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to fetch user logs');
    return result.logs;
}

async function clearLogs() {
    const response = await fetch('/api/logs', {
        method: 'DELETE'
    });
    if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to clear logs');
    }
}

// ========== エクスポート ==========

window.DB = {
    init: initDatabase,
    seed: seedInitialData,
    // Users
    addUser,
    getUser,
    getAllUsers,
    updateUser,
    deleteUser,
    // Announcements
    addAnnouncement,
    getAnnouncement,
    getAllAnnouncements,
    updateAnnouncement,
    deleteAnnouncement,
    // Logs
    addLog,
    getAllLogs,
    getLogsByUser,
    clearLogs
};
