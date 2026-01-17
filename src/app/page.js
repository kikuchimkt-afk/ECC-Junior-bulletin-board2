'use client';

import { useState, useEffect } from 'react';

// ユーザーデータ（シンプル化：実際はDBに保存）
const USERS = {
    'user001': { password: 'pass001', name: '田中 花子', isAdmin: false },
    'user002': { password: 'pass002', name: '鈴木 太郎', isAdmin: false },
    'admin': { password: 'adminpass', name: '管理者', isAdmin: true }
};

export default function LoginPage() {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // 既にログイン済みならリダイレクト
        const session = sessionStorage.getItem('ecc_session');
        if (session) {
            const parsed = JSON.parse(session);
            window.location.href = parsed.isAdmin ? '/admin' : '/bulletin';
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        const user = USERS[userId];
        if (!user) {
            setError('ユーザーIDが見つかりません');
            return;
        }

        if (user.password !== password) {
            setError('パスワードが正しくありません');
            return;
        }

        // セッション保存
        const session = {
            userId,
            name: user.name,
            isAdmin: user.isAdmin,
            loginTime: new Date().toISOString()
        };
        sessionStorage.setItem('ecc_session', JSON.stringify(session));

        // ログを記録（localStorage）
        const logs = JSON.parse(localStorage.getItem('ecc_logs') || '[]');
        logs.unshift({
            userId,
            action: 'login',
            details: 'ログイン成功',
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('ecc_logs', JSON.stringify(logs));

        // リダイレクト
        window.location.href = user.isAdmin ? '/admin' : '/bulletin';
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>ECC Junior<br />お知らせ掲示板</h1>
                <p className="subtitle">ログインして最新のお知らせをチェック！</p>

                {error && <div className="error-message show">{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="userId">ユーザーID</label>
                        <input
                            type="text"
                            id="userId"
                            placeholder="例: user001"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">パスワード</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="パスワードを入力"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary">ログイン</button>
                </form>
            </div>
        </div>
    );
}
