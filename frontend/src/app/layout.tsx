import type { Metadata } from "next";
import { Geist_Mono, Gowun_Batang } from "next/font/google";
import { getSiteUrl, siteName } from "@/lib/seo-encyclopedia";
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
  metadataBase: new URL(getSiteUrl()),
  title: siteName,
  description: "사라지는 꿈을 고양이가 읽고 꿈 영수증으로 남겨주는 감성 꿈해몽 서비스",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteName,
    description: "고양이 해몽사가 꿈속 상징과 감정을 꿈 영수증으로 정리해드립니다.",
    url: "/",
    siteName,
    locale: "ko_KR",
    type: "website",
  },
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
