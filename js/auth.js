/**
 * 認証モジュール - ECC Junior Bulletin Board
 */

const SESSION_KEY = 'ecc_bulletin_session';

/**
 * ログイン処理
 */
async function login(userId, password) {
    try {
        const user = await DB.getUser(userId);

        if (!user) {
            return { success: false, message: 'ユーザーIDが見つかりません' };
        }

        if (user.password !== password) {
            // ログイン失敗を記録
            await DB.addLog({
                userId: userId,
                action: 'login_failed',
                details: 'パスワード不一致'
            });
            return { success: false, message: 'パスワードが正しくありません' };
        }

        // セッションに保存
        const session = {
            userId: user.id,
            name: user.name,
            isAdmin: user.isAdmin,
            loginTime: new Date().toISOString()
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

        // ログイン成功を記録
        await DB.addLog({
            userId: user.id,
            action: 'login',
            details: 'ログイン成功'
        });

        return { success: true, user: session };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'ログイン処理中にエラーが発生しました' };
    }
}

/**
 * ログアウト処理
 */
async function logout() {
    const session = getSession();
    if (session) {
        await DB.addLog({
            userId: session.userId,
            action: 'logout',
            details: 'ログアウト'
        });
    }
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
}

/**
 * 現在のセッションを取得
 */
function getSession() {
    const sessionData = sessionStorage.getItem(SESSION_KEY);
    if (!sessionData) {
        return null;
    }
    return JSON.parse(sessionData);
}

/**
 * 認証チェック（ページ読み込み時）
 */
function requireAuth(requireAdmin = false) {
    const session = getSession();

    if (!session) {
        window.location.href = 'index.html';
        return null;
    }

    if (requireAdmin && !session.isAdmin) {
        window.location.href = 'bulletin.html';
        return null;
    }

    return session;
}

/**
 * PDF閲覧ログを記録
 */
async function logPdfView(announcementId, title) {
    const session = getSession();
    if (session) {
        await DB.addLog({
            userId: session.userId,
            action: 'view_pdf',
            details: `PDF閲覧: ${title}`,
            announcementId: announcementId
        });
    }
}

// グローバルに公開
window.Auth = {
    login,
    logout,
    getSession,
    requireAuth,
    logPdfView
};
