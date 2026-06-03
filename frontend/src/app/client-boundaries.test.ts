import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), "src", relativePath), "utf8");
}

describe("client component boundaries", () => {
  test("keeps encyclopedia routes server-rendered with only reader guide islands as client components", () => {
    const encyclopediaPage = readSource("app/encyclopedia/page.tsx");
    const encyclopediaDetailPage = readSource("app/encyclopedia/[slug]/page.tsx");
    const guideClientPath = path.join(process.cwd(), "src", "components", "encyclopedia-reader-guide-client.tsx");

    expect(encyclopediaPage).toContain('import { AppShell } from "@/components/app-shell";');
    expect(encyclopediaPage).toContain('import { EncyclopediaContent } from "@/components/encyclopedia-content";');
    expect(encyclopediaPage).toContain("getIndexableEncyclopediaEntries()");
    expect(encyclopediaPage).not.toContain("getIndexableEncyclopediaEntries().slice");
    expect(encyclopediaPage).not.toContain("EncyclopediaPageClient");

    expect(encyclopediaDetailPage).toContain('import { AppShell } from "@/components/app-shell";');
    expect(encyclopediaDetailPage).toContain(
      'import { EncyclopediaDetailContent } from "@/components/encyclopedia-detail-content";',
    );
    expect(encyclopediaDetailPage).not.toContain("EncyclopediaDetailPageClient");
    expect(encyclopediaDetailPage).not.toContain("searchParams");

    expect(existsSync(guideClientPath)).toBe(true);
    const readerGuideClient = readFileSync(guideClientPath, "utf8");
    expect(readerGuideClient).toContain('"use client";');
    expect(readerGuideClient).toContain("useSyncExternalStore");
    expect(readerGuideClient).toContain("new URLSearchParams(window.location.search)");
  });
});
