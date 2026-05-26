import { encyclopediaEntries, type EncyclopediaEntry } from "@manyang/backend";

export const siteName = "마냥 꿈해몽";
export const defaultSiteUrl = "https://manyang-dream.vercel.app";

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function getAndParticle(value: string): "과" | "와" {
  const lastCharacter = value.trim().at(-1);

  if (!lastCharacter) {
    return "와";
  }

  const codePoint = lastCharacter.charCodeAt(0);
  const hangulStart = 0xac00;
  const hangulEnd = 0xd7a3;

  if (codePoint < hangulStart || codePoint > hangulEnd) {
    return "와";
  }

  return (codePoint - hangulStart) % 28 === 0 ? "와" : "과";
}

export function getSiteUrl(): string {
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelSiteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;

  return stripTrailingSlash(publicSiteUrl ?? vercelSiteUrl ?? defaultSiteUrl);
}

export function createSymbolSeoTitle(entry: EncyclopediaEntry): string {
  return `${entry.symbol} 꿈 해몽 | ${siteName}`;
}

export function createSymbolSeoDescription(entry: EncyclopediaEntry): string {
  const coreMeanings = entry.coreMeanings.slice(0, 3).join(", ");
  const andParticle = getAndParticle(coreMeanings);

  return `${entry.symbol} 꿈은 ${coreMeanings}${andParticle} 연결되어 읽을 수 있어요. 고양이 해몽사가 꿈속 상징을 꿈 영수증으로 정리해드립니다.`;
}

export function createSymbolCanonicalPath(entry: EncyclopediaEntry): string {
  return `/encyclopedia/${entry.slug}`;
}

export function getIndexableEncyclopediaEntries(entries: EncyclopediaEntry[] = encyclopediaEntries): EncyclopediaEntry[] {
  return entries.filter((entry) => entry.symbol.trim().length > 0 && entry.slug.trim().length > 0);
}
