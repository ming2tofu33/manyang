import type { Metadata } from "next";
import { Geist_Mono, Gowun_Batang } from "next/font/google";
import "./globals.css";

const gowunBatang = Gowun_Batang({
  variable: "--font-gowun-batang",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "마냥 꿈해몽",
  description: "사라지는 꿈을 고양이가 읽고 카드로 남겨주는 감성 꿈 리딩 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${gowunBatang.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
