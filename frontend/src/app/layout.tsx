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
  description: "사라지는 꿈을 꿈 영수증으로 정리하고 고양이 테마로 남겨주는 감성 꿈해몽 서비스",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteName,
    description: "꿈속 상징과 감정을 꿈 영수증으로 정리하고 원하는 고양이 테마로 남겨보세요.",
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
