/**
 * IndexedDB Helper - ECC Junior Bulletin Board
 * データベース管理ユーティリティ
 */

const DB_NAME = 'ECCBulletinDB';
const DB_VERSION = 1;

let db = null;

/**
 * データベースを初期化
 */
async function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Database error:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('Database opened successfully');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // ユーザーストア
            if (!database.objectStoreNames.contains('users')) {
                const usersStore = database.createObjectStore('users', { keyPath: 'id' });
                usersStore.createIndex('isAdmin', 'isAdmin', { unique: false });
            }

            // お知らせストア
            if (!database.objectStoreNames.contains('announcements')) {
                const announcementsStore = database.createObjectStore('announcements', { keyPath: 'id', autoIncrement: true });
                announcementsStore.createIndex('yearMonth', ['year', 'month'], { unique: false });
                announcementsStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // ログストア
            if (!database.objectStoreNames.contains('logs')) {
                const logsStore = database.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
                logsStore.createIndex('userId', 'userId', { unique: false });
                logsStore.createIndex('action', 'action', { unique: false });
                logsStore.createIndex('timestamp', 'timestamp', { unique: false });
            }

            console.log('Database schema created/upgraded');
        };
    });
}

/**
 * 初期データを挿入
 */
async function seedInitialData() {
    // 既存データがあるかチェック
    const existingUsers = await getAllUsers();
    if (existingUsers.length > 0) {
        console.log('Initial data already exists');
        return;
    }

    // サンプルユーザー
    const users = [
        { id: 'user001', password: 'pass001', name: '田中 花子', isAdmin: false },
        { id: 'user002', password: 'pass002', name: '鈴木 太郎', isAdmin: false },
        { id: 'admin', password: 'adminpass', name: '管理者', isAdmin: true }
    ];

    for (const user of users) {
        await addUser(user);
    }

    // サンプルお知らせ
    const announcements = [
        {
            year: 2026,
            month: 1,
            day: 10,
            title: '年始のご挨拶',
            pdfPath: 'pdfs/sample_newyear.pdf',
            createdAt: new Date('2026-01-10').toISOString()
        },
        {
            year: 2026,
            month: 1,
            day: 12,
            title: 'レッスンの変更のお知らせ',
            pdfPath: 'pdfs/sample_lesson_change.pdf',
            createdAt: new Date('2026-01-12').toISOString()
        },
        {
            year: 2026,
            month: 2,
            day: 1,
            title: '講師の変更のご案内',
            pdfPath: 'pdfs/sample_instructor.pdf',
            createdAt: new Date('2026-02-01').toISOString()
        }
    ];

    for (const announcement of announcements) {
        await addAnnouncement(announcement);
    }

    console.log('Initial data seeded successfully');
}

// ========== ユーザー関連 ==========

async function addUser(user) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        const request = store.add(user);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getUser(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllUsers() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function updateUser(user) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        const request = store.put(user);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteUser(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ========== お知らせ関連 ==========

async function addAnnouncement(announcement) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['announcements'], 'readwrite');
        const store = transaction.objectStore('announcements');
        
        if (!announcement.createdAt) {
            announcement.createdAt = new Date().toISOString();
        }
        
        const request = store.add(announcement);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAnnouncement(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['announcements'], 'readonly');
        const store = transaction.objectStore('announcements');
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllAnnouncements() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['announcements'], 'readonly');
        const store = transaction.objectStore('announcements');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function updateAnnouncement(announcement) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['announcements'], 'readwrite');
        const store = transaction.objectStore('announcements');
        const request = store.put(announcement);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteAnnouncement(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['announcements'], 'readwrite');
        const store = transaction.objectStore('announcements');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ========== ログ関連 ==========

async function addLog(logEntry) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['logs'], 'readwrite');
        const store = transaction.objectStore('logs');
        
        logEntry.timestamp = new Date().toISOString();
        
        const request = store.add(logEntry);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllLogs() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['logs'], 'readonly');
        const store = transaction.objectStore('logs');
        const request = store.getAll();

        request.onsuccess = () => {
            // 新しい順にソート
            const logs = request.result.sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            );
            resolve(logs);
        };
        request.onerror = () => reject(request.error);
    });
}

async function getLogsByUser(userId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['logs'], 'readonly');
        const store = transaction.objectStore('logs');
        const index = store.index('userId');
        const request = index.getAll(userId);

        request.onsuccess = () => {
            const logs = request.result.sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            );
            resolve(logs);
        };
        request.onerror = () => reject(request.error);
    });
}

async function clearLogs() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['logs'], 'readwrite');
        const store = transaction.objectStore('logs');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
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
