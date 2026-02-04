/**
 * お知らせ表示モジュール - ECC Junior Bulletin Board
 */

/**
 * 月の絵文字を取得
 */
function getMonthEmoji(month) {
    const emojis = {
        1: '🎍', 2: '💝', 3: '🌸', 4: '🌷',
        5: '🎏', 6: '☔', 7: '🎋', 8: '🌻',
        9: '🎑', 10: '🎃', 11: '🍂', 12: '🎄'
    };
    return emojis[month] || '📅';
}

/**
 * お知らせを月ごとにグループ化
 */
function groupAnnouncementsByMonth(announcements) {
    const groups = {};

    announcements.forEach(item => {
        const key = `${item.year}-${String(item.month).padStart(2, '0')}`;
        if (!groups[key]) {
            groups[key] = {
                year: item.year,
                month: item.month,
                items: []
            };
        }
        groups[key].items.push(item);
    });

    // 月ごとにソート（新しい順）
    const sorted = Object.values(groups).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
    });

    // 各月の中でも日付順にソート
    sorted.forEach(group => {
        group.items.sort((a, b) => b.day - a.day);
    });

    return sorted;
}

/**
 * お知らせ一覧を描画
 */
async function renderAnnouncements() {
    const container = document.getElementById('announcements-container');
    if (!container) return;

    let announcements = await DB.getAllAnnouncements();

    // 認証情報を取得してフィルタリング
    const session = Auth.getSession();
    if (!session || !session.isAdmin) {
        // 管理者でない場合は「講師限定」を除外
        announcements = announcements.filter(item => !item.teacherOnly);
    }

    if (announcements.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📭</div>
                <p>現在お知らせはありません</p>
            </div>
        `;
        return;
    }

    const grouped = groupAnnouncementsByMonth(announcements);

    let html = '';

    grouped.forEach(group => {
        html += `
            <div class="month-section">
                <div class="month-header">
                    <span class="icon">${getMonthEmoji(group.month)}</span>
                    <h2>${group.year}年${group.month}月のお知らせ</h2>
                </div>
                <div class="announcement-list">
        `;

        group.items.forEach(item => {
            const pdfUrl = item.pdfUrl || item.pdfPath;
            html += `
                <div class="announcement-item">
                    <div class="announcement-header">
                        <span class="announcement-date">${group.month}月${item.day}日配信</span>
                        <span class="announcement-title">${item.title}</span>
                    </div>
                    ${item.content ? `<div class="announcement-content">${item.content.replace(/\n/g, '<br>')}</div>` : ''}
                    <div class="announcement-footer">
                        <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-small pdf-button" 
                           onclick="Auth.logPdfView(${item.id}, '${item.title}'); return true;">
                            📄 PDFの内容を確認する
                        </a>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * PDF を開く
 */
async function openPdf(id, pdfUrl, title) {
    if (!pdfUrl) {
        alert('PDFファイルが見つかりません');
        return;
    }

    // iPad/iOSのポップアップブロック対策: 直接ブラウザで開く
    window.open(pdfUrl, '_blank');

    // ログはバックグラウンドで記録（完了を待たない）
    Auth.logPdfView(id, title).catch(err => console.error('Logging error:', err));
}

/**
 * ユーザー情報を表示
 */
function displayUserInfo(session) {
    const userInfoEl = document.getElementById('user-info');
    if (userInfoEl && session) {
        userInfoEl.innerHTML = `
            <span>👤 ${session.name} さん</span>
            ${session.isAdmin ? '<a href="admin.html" class="btn btn-small btn-secondary">管理画面</a>' : ''}
            <button onclick="Auth.logout()" class="btn btn-small btn-danger">ログアウト</button>
        `;
    }
}

// グローバルに公開
window.Bulletin = {
    render: renderAnnouncements,
    displayUserInfo
};

window.openPdf = openPdf;

