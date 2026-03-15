import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "テニスダブルス対戦スケジューラー",
  description: "テニスダブルスの全対戦組み合わせを管理するアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
