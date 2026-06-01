import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ArchiveRecordView } from "@/lib/archive-record-view";

import { ArchiveCatGuide, DreamRecordActions, RecentArchiveRecords } from "./dream-archive-list";

const dreamView: ArchiveRecordView = {
  id: "dream-dream-1",
  type: "dream",
  date: "2026-05-24",
  sortAt: "2026-05-24T10:00:00.000Z",
  title: "맨발로 복도를 달린 꿈",
  categoryLabel: "꿈 영수증",
  summary: "복도와 신발이 남은 꿈이에요.",
  metaParts: ["불안함", "조급함"],
  tags: ["복도", "신발"],
  searchText: "맨발로 복도를 달린 꿈 복도 신발",
  raw: {},
};

describe("ArchiveCatGuide", () => {
  it("renders the archive guide with the currently selected cat profile", () => {
    const markup = renderToStaticMarkup(<ArchiveCatGuide selectedCatReaderId="white_cat" />);

    expect(markup).toContain("/manyang/references/cat-white-profile.webp");
    expect(markup).toContain("꿈은 지나가도");
    expect(markup).not.toContain("blackcat-profile-transparent");
  });
});

describe("DreamRecordActions", () => {
  it("renders a receipt restore action next to delete", () => {
    const markup = renderToStaticMarkup(
      <DreamRecordActions title="A saved dream receipt" onOpen={() => undefined} onDelete={() => undefined} />,
    );

    expect(markup).toContain("A saved dream receipt 꿈 영수증 다시 보기");
    expect(markup).toContain("A saved dream receipt 기록 삭제");
    expect(markup).toContain("/manyang/ui/action-icons/action-book.png");
    expect(markup).toContain("/manyang/ui/action-icons/action-trash.png");
  });
});

describe("RecentArchiveRecords", () => {
  it("keeps one slot for each record routine and turns missing routines into CTAs", () => {
    const markup = renderToStaticMarkup(
      <RecentArchiveRecords views={[dreamView]} onOpenDream={() => undefined} selectedCatReaderId="black_cat" />,
    );

    expect(markup).toContain("맨발로 복도를 달린 꿈");
    expect(markup).toContain("data-empty-recent-archive-slot=\"pawprint\"");
    expect(markup).toContain("data-empty-recent-archive-slot=\"night_checkin\"");
    expect(markup).toContain("오늘의 발자국이 비어 있어요");
    expect(markup).toContain("아직 밤의 기록이 없어요");
    expect(markup).toContain("href=\"/morning\"");
    expect(markup).toContain("href=\"/night\"");
  });

  it("shows all three routine CTAs when there are no recent records yet", () => {
    const markup = renderToStaticMarkup(
      <RecentArchiveRecords views={[]} onOpenDream={() => undefined} selectedCatReaderId="black_cat" />,
    );

    expect(markup).toContain("data-empty-recent-archive-slot=\"dream\"");
    expect(markup).toContain("data-empty-recent-archive-slot=\"pawprint\"");
    expect(markup).toContain("data-empty-recent-archive-slot=\"night_checkin\"");
    expect(markup).toContain("href=\"/write\"");
    expect(markup).toContain("href=\"/morning\"");
    expect(markup).toContain("href=\"/night\"");
  });
});
