'use client';

import { useState, useEffect } from 'react';

export default function LoginPage() {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // 既にログイン済みならリダイレクト
        const session = sessionStorage.getItem('ecc_session');
        if (session) {
            const parsed = JSON.parse(session);
            window.location.href = parsed.isAdmin ? '/admin' : '/bulletin';
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // サーバーサイド認証
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password })
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || 'ログインに失敗しました');
                setLoading(false);
                return;
            }

            // セッション保存
            const session = {
                userId: result.user.userId,
                name: result.user.name,
                isAdmin: result.user.isAdmin,
                loginTime: new Date().toISOString()
            };
            sessionStorage.setItem('ecc_session', JSON.stringify(session));

            // リダイレクト
            window.location.href = result.user.isAdmin ? '/admin' : '/bulletin';
        } catch (err) {
            console.error('Login error:', err);
            setError('ログイン処理中にエラーが発生しました');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 style={{ textAlign: 'center', lineHeight: '1.1' }}>ECC<br />in<br />Tokushima</h1>
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
                            disabled={loading}
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
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'ログイン中...' : 'ログイン'}
                    </button>
                </form>
            </div>
        </div>
    );
}
