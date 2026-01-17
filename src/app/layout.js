import './globals.css';

export const metadata = {
    title: 'ECC in Tokushima',
    description: '英会話スクールのお知らせをチェック',
};

export default function RootLayout({ children }) {
    return (
        <html lang="ja">
            <body>{children}</body>
        </html>
    );
}
