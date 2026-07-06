import type { Metadata } from "next";

import { manyangAssets } from "./manyang-assets";
import { getSiteUrl, siteName } from "./seo-encyclopedia";

const rootDescription = "사라지는 꿈을 꿈 영수증으로 정리하고 고양이 테마로 남겨주는 감성 꿈해몽 서비스";

export const socialShareImage = {
  url: manyangAssets.social.sharePreview,
  width: 1200,
  height: 1200,
  alt: "마법 모자를 쓴 검은 고양이가 오브를 읽는 마냥 꿈해몽 대표 이미지",
} as const;

export const rootMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: siteName,
  description: rootDescription,
  other: {
    "aim-verification": "aim_verify_DyhIum5PLQGrXmHFh4GLKoKHgUQEIQcL",
  },
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
    images: [socialShareImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: rootDescription,
    images: [socialShareImage],
  },
};
