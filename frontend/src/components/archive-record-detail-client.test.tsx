import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ArchiveRecordView } from "@/lib/archive-record-view";
import type { DreamRecord } from "@/lib/dream-storage";

import { RoutineRecordDetailContent } from "./archive-record-detail-client";

const pawprintView: ArchiveRecordView = {
  id: "pawprint-2026-05-25",
  type: "pawprint",
  date: "2026-05-25",
  sortAt: "2026-05-25T08:00:00.000Z",
  title: "꿈의 발자국",
  categoryLabel: "발자국 기록",
  summary: "안개",
  metaParts: ["흐릿함", "안개 보라", "졸림"],
  tags: ["흐릿함"],
  detailHref: "/archive/records/pawprint-2026-05-25",
  searchText: "꿈의 발자국",
  raw: {
    morningMoodRecord: {
      id: "morning-2026-05-25",
      moodDate: "2026-05-25",
      mood: "흐릿함",
      moodColor: "안개 보라",
      bodyFeeling: "졸림",
      thought: "기다림",
      savedAt: "2026-05-25T08:00:00.000Z",
    },
  },
};

const dreamRecord: DreamRecord = {
  id: "dream-1",
  savedAt: "2026-05-25T08:00:00.000Z",
  dreamText: "I was walking through a hallway.",
  dreamDate: "2026-05-25",
  analysis: {
    dreamId: "runtime-dream-1",
    analysisId: "analysis-1",
    cardId: "card-1",
    reader: {
      id: "black_cat",
      name: "Black Cat",
      access: "free",
    },
    summary: "Hallway dream",
    symbols: ["hallway"],
    emotions: ["curious"],
    themes: ["transition"],
    interpretation: "The hallway points to a transition.",
    symbolReadings: [],
    smallPrescription: "Write down one next step.",
    readingBasis: {
      usedSymbols: ["hallway"],
      mainThemes: ["transition"],
      confidence: 0.82,
    },
    card: {
      name: "Hallway dream",
      type: "half_moon",
      keywords: ["hallway"],
      summary: "Hallway dream",
      message: "Write down one next step.",
      theme: "transition",
    },
  },
};

const dreamView: ArchiveRecordView = {
  id: "dream-dream-1",
  type: "dream",
  date: "2026-05-25",
  sortAt: "2026-05-25T08:00:00.000Z",
  title: "Hallway dream",
  categoryLabel: "Dream receipt",
  summary: "The hallway points to a transition.",
  metaParts: ["curious", "transition"],
  tags: ["hallway"],
  dreamRecordId: "dream-1",
  searchText: "hallway dream transition",
  raw: {
    dreamRecord,
  },
};

describe("RoutineRecordDetailContent", () => {
  it("renders the original dream text for saved dream receipts", () => {
    const markup = renderToStaticMarkup(
      <RoutineRecordDetailContent view={dreamView} onOpenDream={() => undefined} />,
    );

    expect(markup).toContain("data-dream-original-text-detail=\"true\"");
    expect(markup).toContain("내가 적은 꿈");
    expect(markup).toContain("I was walking through a hallway.");
  });

  it("renders a delete action for saved dream receipts", () => {
    const markup = renderToStaticMarkup(
      <RoutineRecordDetailContent
        view={dreamView}
        onOpenDream={() => undefined}
        onDeleteDream={() => undefined}
      />,
    );

    expect(markup).toContain("data-dream-record-delete-detail-action=\"dream-1\"");
    expect(markup).toContain("/manyang/ui/action-icons/action-trash.png");
  });

  it("renders morning footprint detail when local morning data is available", () => {
    const markup = renderToStaticMarkup(
      <RoutineRecordDetailContent view={pawprintView} onOpenDream={() => undefined} />,
    );

    expect(markup).toContain("꿈의 발자국");
    expect(markup).toContain("아침 기분");
    expect(markup).toContain("안개 보라");
    expect(markup).toContain("기다림");
  });

  it("renders night record detail", () => {
    const markup = renderToStaticMarkup(
      <RoutineRecordDetailContent
        view={{
          ...pawprintView,
          id: "night-2026-05-25",
          type: "night_checkin",
          title: "밤의 기록",
          categoryLabel: "밤의 기록",
          summary: "조용히 잠들고 싶다",
          raw: {
            nightCheckInRecord: {
              checkInDate: "2026-05-25",
              moodId: "calm",
              moodLabel: "차분함",
              conditionId: "okay",
              conditionLabel: "편안함",
              note: "조용히 잠들고 싶다",
              savedAt: "2026-05-25T22:00:00.000Z",
            },
          },
        }}
        onOpenDream={() => undefined}
      />,
    );

    expect(markup).toContain("밤의 기록");
    expect(markup).toContain("밤의 기분");
    expect(markup).toContain("조용히 잠들고 싶다");
  });
});
