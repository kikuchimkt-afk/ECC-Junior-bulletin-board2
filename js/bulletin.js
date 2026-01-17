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

    const announcements = await DB.getAllAnnouncements();

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
            html += `
                <div class="announcement-item">
                    <span class="announcement-date">${group.month}月${item.day}日配信</span>
                    <span class="announcement-title">${item.title}</span>
                    <a href="javascript:void(0)" class="announcement-link" 
                       onclick="openPdf(${item.id}, '${item.pdfPath}', '${item.title}')">${item.title}</a>
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
 * localStorageに保存されたPDFがあればそれを開く
 * なければ通常のパスで開く
 */
async function openPdf(id, pdfPath, title) {
    // ログを記録
    await Auth.logPdfView(id, title);

    // localStorageから保存されたPDFを取得
    try {
        const storedPdfs = JSON.parse(localStorage.getItem('uploaded_pdfs') || '{}');
        const pdfData = storedPdfs[pdfPath];

        if (pdfData) {
            // Base64データをBlobに変換して新しいタブで開く
            const byteCharacters = atob(pdfData.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
        } else {
            // 通常のファイルパスで開く
            window.open(pdfPath, '_blank');
        }
    } catch (error) {
        console.error('Error opening PDF:', error);
        // エラー時は通常のパスで開く
        window.open(pdfPath, '_blank');
    }
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

