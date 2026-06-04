import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ArchiveRecordView } from "@/lib/archive-record-view";

import { ArchiveRecordListCard } from "./archive-records-client";

const baseView: ArchiveRecordView = {
  id: "pawprint-2026-05-25",
  type: "pawprint",
  date: "2026-05-25",
  sortAt: "2026-05-25T08:00:00.000Z",
  title: "꿈의 발자국",
  categoryLabel: "발자국 기록",
  summary: "안개",
  metaParts: ["흐릿함", "안개 보라"],
  tags: ["흐릿함"],
  detailHref: "/archive/records/pawprint-2026-05-25",
  searchText: "꿈의 발자국",
  raw: {},
};

describe("ArchiveRecordListCard", () => {
  it("renders routine records as detail links", () => {
    const markup = renderToStaticMarkup(
      <ArchiveRecordListCard view={baseView} onOpenDream={() => undefined} />,
    );

    expect(markup).toContain("href=\"/archive/records/pawprint-2026-05-25\"");
    expect(markup).toContain("꿈의 발자국");
    expect(markup).toContain("발자국 기록");
  });

  it("renders dream records with an open button", () => {
    const markup = renderToStaticMarkup(
      <ArchiveRecordListCard
        view={{
          ...baseView,
          id: "dream-dream-1",
          type: "dream",
          title: "복도를 달린 꿈",
          categoryLabel: "꿈 영수증",
          dreamRecordId: "dream-1",
        }}
        onOpenDream={() => undefined}
        onDeleteDream={() => undefined}
      />,
    );

    expect(markup).toContain("복도를 달린 꿈");
    expect(markup).toContain("자세히 보기");
    expect(markup).toContain("data-dream-record-delete-action=\"dream-1\"");
    expect(markup).toContain("/manyang/ui/action-icons/action-trash.png");
    expect(markup).not.toContain("href=\"/archive/records/pawprint-2026-05-25\"");
  });
});
