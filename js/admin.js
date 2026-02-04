/**
 * 管理者機能モジュール - ECC Junior Bulletin Board
 */

let currentTab = 'announcements';
let editingAnnouncementId = null;
let editingUserId = null;

/**
 * タブ切り替え
 */
function switchTab(tabName) {
    currentTab = tabName;

    // タブボタンの状態更新
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // タブコンテンツの表示切り替え
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabName}`);
    });

    // データ再読み込み
    if (tabName === 'announcements') {
        loadAnnouncementsList();
    } else if (tabName === 'users') {
        loadUsersList();
    } else if (tabName === 'logs') {
        loadLogsList();
    }
}

// ========== お知らせ管理 ==========

async function loadAnnouncementsList() {
    const tbody = document.getElementById('announcements-tbody');
    if (!tbody) return;

    const announcements = await DB.getAllAnnouncements();

    if (announcements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">お知らせがありません</td></tr>';
        return;
    }

    // 日付順にソート（新しい順）
    announcements.sort((a, b) => {
        const dateA = new Date(a.year, a.month - 1, a.day);
        const dateB = new Date(b.year, b.month - 1, b.day);
        return dateB - dateA;
    });

    tbody.innerHTML = announcements.map(item => `
        <tr>
            <td>${item.year}年${item.month}月${item.day}日</td>
            <td>${item.title}</td>
            <td><a href="${item.pdfUrl || item.pdfPath}" target="_blank">📄 表示</a></td>
            <td class="actions">
                <button class="btn-edit" onclick="editAnnouncement(${item.id})">編集</button>
                <button class="btn-delete" onclick="deleteAnnouncementConfirm(${item.id})">削除</button>
            </td>
        </tr>
    `).join('');
}

function showAnnouncementModal(announcement = null) {
    editingAnnouncementId = announcement ? announcement.id : null;

    const modal = document.getElementById('announcement-modal');
    const title = document.getElementById('modal-announcement-title');
    const form = document.getElementById('announcement-form');
    const dateInput = document.getElementById('announcementDate');
    const pdfPathInput = document.getElementById('pdfPathInput');
    const selectedPdfInfo = document.getElementById('selected-pdf-info');
    const pdfFileInput = document.getElementById('pdfFileInput');

    title.textContent = announcement ? 'お知らせを編集' : '新しいお知らせを追加';

    // PDFファイル情報をリセット
    if (pdfFileInput) pdfFileInput.value = '';
    selectedPdfInfo.classList.remove('show');
    selectedPdfInfo.textContent = '';

    if (announcement) {
        // 編集モード: 既存データをセット
        const dateStr = `${announcement.year}-${String(announcement.month).padStart(2, '0')}-${String(announcement.day).padStart(2, '0')}`;
        dateInput.value = dateStr;
        form.title.value = announcement.title;
        form.content.value = announcement.content || '';
        pdfPathInput.value = announcement.pdfPath || announcement.pdfUrl;

        // 講師限定フラグをセット
        const teacherOnlyCheckbox = document.getElementById('teacherOnlyCheckbox');
        if (teacherOnlyCheckbox) teacherOnlyCheckbox.checked = !!announcement.teacherOnly;

        // 既存PDFパスを表示
        const currentPath = announcement.pdfUrl || announcement.pdfPath;
        selectedPdfInfo.textContent = `📎 現在のファイル: ${currentPath}`;
        selectedPdfInfo.classList.add('show');
    } else {
        // 新規モード: 今日の日付をデフォルト
        form.reset();
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        dateInput.value = todayStr;
        pdfPathInput.value = '';
    }

    modal.classList.add('show');
}

function hideAnnouncementModal() {
    const modal = document.getElementById('announcement-modal');
    modal.classList.remove('show');
    editingAnnouncementId = null;
}

async function saveAnnouncement(event) {
    event.preventDefault();

    const form = event.target;
    const dateValue = document.getElementById('announcementDate').value;
    const pdfPath = document.getElementById('pdfPathInput').value;

    if (!dateValue) {
        alert('日付を選択してください');
        return;
    }

    if (!pdfPath) {
        alert('PDFファイルを選択してください');
        return;
    }

    // YYYY-MM-DD形式から年月日を抽出
    const [year, month, day] = dateValue.split('-').map(num => parseInt(num));

    const data = {
        year: year,
        month: month,
        day: day,
        title: form.title.value.trim(),
        content: form.content.value.trim(),
        pdfUrl: pdfPath
    };

    try {
        if (editingAnnouncementId) {
            data.id = editingAnnouncementId;
            await DB.updateAnnouncement(data);
        } else {
            await DB.addAnnouncement(data);
        }

        hideAnnouncementModal();
        loadAnnouncementsList();
    } catch (error) {
        console.error('Save error:', error);
        alert('保存中にエラーが発生しました');
    }
}

async function editAnnouncement(id) {
    const announcement = await DB.getAnnouncement(id);
    if (announcement) {
        showAnnouncementModal(announcement);
    }
}

async function deleteAnnouncementConfirm(id) {
    if (confirm('このお知らせを削除しますか？')) {
        await DB.deleteAnnouncement(id);
        loadAnnouncementsList();
    }
}

// ========== ユーザー管理 ==========

async function loadUsersList() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    const users = await DB.getAllUsers();

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.isAdmin ? '✅ 管理者' : '一般'}</td>
            <td class="actions">
                <button class="btn-edit" onclick="editUser('${user.id}')">編集</button>
                ${user.id !== 'admin' ? `<button class="btn-delete" onclick="deleteUserConfirm('${user.id}')">削除</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function showUserModal(user = null) {
    editingUserId = user ? user.id : null;

    const modal = document.getElementById('user-modal');
    const title = document.getElementById('modal-user-title');
    const form = document.getElementById('user-form');
    const idInput = form.userId;

    title.textContent = user ? 'ユーザーを編集' : '新しいユーザーを追加';
    idInput.disabled = !!user;

    if (user) {
        form.userId.value = user.id;
        form.password.value = user.password;
        form.userName.value = user.name;
        form.isAdmin.checked = user.isAdmin;
    } else {
        form.reset();
    }

    modal.classList.add('show');
}

function hideUserModal() {
    const modal = document.getElementById('user-modal');
    modal.classList.remove('show');
    editingUserId = null;
}

async function saveUser(event) {
    event.preventDefault();

    const form = event.target;
    const data = {
        id: form.userId.value.trim(),
        password: form.password.value,
        name: form.userName.value.trim(),
        isAdmin: form.isAdmin.checked
    };

    try {
        if (editingUserId) {
            await DB.updateUser(data);
        } else {
            // 既存チェック
            const existing = await DB.getUser(data.id);
            if (existing) {
                alert('このユーザーIDは既に存在します');
                return;
            }
            await DB.addUser(data);
        }

        hideUserModal();
        loadUsersList();
    } catch (error) {
        console.error('Save error:', error);
        alert('保存中にエラーが発生しました');
    }
}

async function editUser(id) {
    const user = await DB.getUser(id);
    if (user) {
        showUserModal(user);
    }
}

async function deleteUserConfirm(id) {
    if (confirm('このユーザーを削除しますか？')) {
        await DB.deleteUser(id);
        loadUsersList();
    }
}

/**
 * ユーザー一覧をCSVでダウンロード
 */
async function downloadUsersCSV() {
    try {
        const users = await DB.getAllUsers();
        if (!users || users.length === 0) {
            alert('ユーザーデータがありません');
            return;
        }

        // CSVヘッダー
        let csvContent = "ユーザーID,名前,パスワード,管理者権限\n";

        // データ行
        users.forEach(user => {
            const isAdmin = user.isAdmin ? "管理者" : "一般";
            csvContent += `"${user.id}","${user.name}","${user.password}","${isAdmin}"\n`;
        });

        // BOM（Excelでの文字化け防止）を追加してBlob作成
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });

        // ダウンロードリンクを作成して実行
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

        link.setAttribute("href", url);
        link.setAttribute("download", `ecc_users_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('Export error:', error);
        alert('ダウンロード中にエラーが発生しました');
    }
}

// ========== ログ管理 ==========

async function loadLogsList() {
    const tbody = document.getElementById('logs-tbody');
    if (!tbody) return;

    let logs = await DB.getAllLogs();

    // フィルタリング
    const userFilter = document.getElementById('log-user-filter')?.value;
    const actionFilter = document.getElementById('log-action-filter')?.value;

    if (userFilter) {
        logs = logs.filter(log => log.userId === userFilter);
    }

    if (actionFilter) {
        logs = logs.filter(log => log.action === actionFilter);
    }

    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">ログがありません</td></tr>';
        return;
    }

    tbody.innerHTML = logs.map(log => {
        const date = new Date(log.timestamp);
        const dateStr = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

        let actionLabel = log.action;
        switch (log.action) {
            case 'login': actionLabel = '🔓 ログイン'; break;
            case 'logout': actionLabel = '🔒 ログアウト'; break;
            case 'view_pdf': actionLabel = '📄 PDF閲覧'; break;
            case 'login_failed': actionLabel = '❌ ログイン失敗'; break;
        }

        return `
            <tr>
                <td>${dateStr}</td>
                <td>${log.userId}</td>
                <td>${actionLabel}</td>
                <td>${log.details || '-'}</td>
            </tr>
        `;
    }).join('');
}

async function populateLogFilters() {
    const userFilter = document.getElementById('log-user-filter');
    if (!userFilter) return;

    const users = await DB.getAllUsers();
    userFilter.innerHTML = '<option value="">すべてのユーザー</option>' +
        users.map(u => `<option value="${u.id}">${u.id} (${u.name})</option>`).join('');
}

async function clearAllLogs() {
    if (confirm('すべてのログを削除しますか？この操作は取り消せません。')) {
        await DB.clearLogs();
        loadLogsList();
    }
}

// グローバルに公開
window.Admin = {
    switchTab,
    loadAnnouncementsList,
    showAnnouncementModal,
    hideAnnouncementModal,
    saveAnnouncement,
    editAnnouncement,
    deleteAnnouncementConfirm,
    loadUsersList,
    showUserModal,
    hideUserModal,
    saveUser,
    editUser,
    deleteUserConfirm,
    downloadUsersCSV,
    loadLogsList,
    populateLogFilters,
    clearAllLogs
};

// 関数をグローバルに
window.switchTab = switchTab;
window.showAnnouncementModal = showAnnouncementModal;
window.hideAnnouncementModal = hideAnnouncementModal;
window.saveAnnouncement = saveAnnouncement;
window.editAnnouncement = editAnnouncement;
window.deleteAnnouncementConfirm = deleteAnnouncementConfirm;
window.downloadUsersCSV = downloadUsersCSV;
window.showUserModal = showUserModal;
window.hideUserModal = hideUserModal;
window.saveUser = saveUser;
window.editUser = editUser;
window.deleteUserConfirm = deleteUserConfirm;
window.loadLogsList = loadLogsList;
window.clearAllLogs = clearAllLogs;

// ========== PDFアップロード ==========

// アップロードされたPDFを保存するストレージ
let uploadedPdfData = null;

/**
 * PDFファイルアップロードハンドラ - Vercel Blob API版
 */
async function handlePdfUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // PDFファイルかチェック
    if (file.type !== 'application/pdf') {
        alert('PDFファイルを選択してください');
        event.target.value = '';
        return;
    }

    // 選択したファイル情報を表示（アップロード中）
    const selectedPdfInfo = document.getElementById('selected-pdf-info');
    selectedPdfInfo.textContent = `⏳ アップロード中: ${file.name}...`;
    selectedPdfInfo.classList.add('show');

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Upload failed');
        }

        // パスを入力欄に設定
        const pdfPathInput = document.getElementById('pdfPathInput');
        pdfPathInput.value = result.url; // Blob URLをセット

        // 完了表示
        selectedPdfInfo.textContent = `✅ アップロード完了: ${file.name}`;
        console.log('PDF uploaded to Vercel Blob:', result.url);
    } catch (error) {
        console.error('Error uploading PDF:', error);
        selectedPdfInfo.textContent = `❌ アップロード失敗: ${error.message}`;
        alert('アップロード中にエラーが発生しました');
    }
}

window.handlePdfUpload = handlePdfUpload;
