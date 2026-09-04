import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brand OS — Strategy",
  description: "Strategy's AI-assisted brand hub — find assets, ask about guidelines, build on-brand content.",
};

const THEME_INIT = `
(function () {
  try {
    var t = localStorage.getItem('brandos-content-theme') || 'world';
    document.documentElement.setAttribute('data-content-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-content-theme', 'world');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-content-theme="world" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap"
          rel="stylesheet"
          crossOrigin="anonymous"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
