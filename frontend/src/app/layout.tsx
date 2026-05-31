import type { Metadata } from "next";
import { Geist_Mono, Gowun_Batang } from "next/font/google";
import { rootMetadata } from "@/lib/site-metadata";
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

export const metadata: Metadata = rootMetadata;

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
