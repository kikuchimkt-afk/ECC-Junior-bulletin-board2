'use client';

import Link from 'next/link';
import { SCHOOLS } from '../lib/schools';

export default function LandingPage() {
    return (
        <div className="lp-container">
            <style jsx>{`
                .lp-container {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #FFF0F5 0%, #F0FFF0 100%);
                    font-family: 'Zen Maru Gothic', sans-serif;
                    color: #5D5D5D;
                    overflow-x: hidden;
                }
                .hero {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 80px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                }
                .hero-content {
                    flex: 1;
                    min-width: 300px;
                    padding-right: 40px;
                }
                .hero-title {
                    font-size: 3rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #FF91A4 0%, #4ECDC4 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 20px;
                }
                .hero-subtitle {
                    font-size: 1.2rem;
                    line-height: 1.8;
                    margin-bottom: 40px;
                    color: #8B8B8B;
                }
                .hero-image {
                    flex: 1;
                    min-width: 300px;
                    text-align: center;
                    position: relative;
                }
                .hero-image img {
                    max-width: 100%;
                    border-radius: 30px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    animation: float 6s ease-in-out infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                .features {
                    background: white;
                    padding: 80px 20px;
                }
                .section-title {
                    text-align: center;
                    font-size: 2.2rem;
                    margin-bottom: 60px;
                    color: #FF91A4;
                }
                .feature-grid {
                    max-width: 1100px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 30px;
                }
                .feature-card {
                    padding: 40px;
                    border-radius: 20px;
                    background: #fdfdfd;
                    border: 1px solid #eee;
                    transition: all 0.3s ease;
                    text-align: center;
                }
                .feature-card:hover {
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    transform: translateY(-5px);
                }
                .feature-icon {
                    font-size: 3rem;
                    margin-bottom: 20px;
                    display: block;
                }
                .feature-card h3 {
                    margin-bottom: 15px;
                    color: #5D5D5D;
                }
                .feature-card p {
                    font-size: 0.95rem;
                    color: #8B8B8B;
                    line-height: 1.6;
                }
                .cta-section {
                    padding: 100px 20px;
                    text-align: center;
                }
                .btn-cta {
                    display: inline-block;
                    padding: 18px 60px;
                    background: linear-gradient(135deg, #FFB6C1 0%, #FF91A4 100%);
                    color: white;
                    font-size: 1.2rem;
                    font-weight: bold;
                    border-radius: 50px;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    box-shadow: 0 10px 20px rgba(255, 145, 164, 0.3);
                }
                .btn-cta:hover {
                    transform: scale(1.05);
                    box-shadow: 0 15px 30px rgba(255, 145, 164, 0.4);
                }
                @media (max-width: 768px) {
                    .hero-title { font-size: 2.2rem; }
                    .hero-content { padding-right: 0; text-align: center; margin-bottom: 40px; }
                }
            `}</style>

            <header className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">ECC Junior<br />お知らせ掲示板</h1>
                    <p className="hero-subtitle">
                        教室からの大切なお知らせを、いつでもどこでもお手元に。<br />
                        デジタル化で、もっと便利に、もっと身近につながる。
                    </p>
                    <Link href="/" className="btn-cta">
                        ログインして始める
                    </Link>
                </div>
                <div className="hero-image">
                    {/* ここに生成したメインビジュアルを配置予定 */}
                    <img src="/api/placeholder/500/800" alt="App Preview" />
                </div>
            </header>

            <section className="features">
                <h2 className="section-title">主な機能</h2>
                <div className="feature-grid">
                    <div className="feature-card">
                        <span className="feature-icon">📢</span>
                        <h3>スマート掲示板</h3>
                        <p>教室別、月別にお知らせを整理。必要な情報をすぐに見つけることができます。</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">📄</span>
                        <h3>PDF閲覧機能</h3>
                        <p>配布資料やお便りをアプリ内で直接閲覧。ダウンロードの手間もありません。</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">✉️</span>
                        <h3>メール通知</h3>
                        <p>新しいお知らせが投稿されると即座にメールでお知らせ。見落としを防ぎます。</p>
                    </div>
                </div>
            </section>

            <section className="cta-section">
                <h2 style={{ marginBottom: '30px' }}>さあ、始めましょう</h2>
                <Link href="/" className="btn-cta">
                    掲示板を開く
                </Link>
            </section>

            <footer style={{ textAlign: 'center', padding: '40px', color: '#8B8B8B', fontSize: '0.9rem' }}>
                <p>&copy; 2026 ECC Junior Bulletin Board. All rights reserved.</p>
            </footer>
        </div>
    );
}
