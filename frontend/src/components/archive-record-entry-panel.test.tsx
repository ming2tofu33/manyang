import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { ArchiveRecordEntryPanel } from "./archive-record-entry-panel";

describe("ArchiveRecordEntryPanel", () => {
  test("shows three record entry points with morning active during daytime", () => {
    const markup = renderToStaticMarkup(<ArchiveRecordEntryPanel currentDate={new Date("2026-05-31T23:00:00.000Z")} />);

    expect(markup).toContain("기록하기");
    expect(markup).toContain("꿈 들려주기");
    expect(markup).toContain("꿈의 발자국 남기기");
    expect(markup).toContain("밤의 기록 남기기");
    expect(markup).toContain('href="/write"');
    expect(markup).toContain('href="/morning"');
    expect(markup).toContain('data-record-entry="night"');
    expect(markup).toContain('data-record-entry-available="false"');
    expect(markup).toContain("저녁 6시부터");
  });

  test("enables night records and disables morning records during night time", () => {
    const markup = renderToStaticMarkup(<ArchiveRecordEntryPanel currentDate={new Date("2026-06-01T12:00:00.000Z")} />);

    expect(markup).toContain('href="/night"');
    expect(markup).toContain('data-record-entry="morning"');
    expect(markup).toContain('data-record-entry-available="false"');
    expect(markup).toContain("아침 5시부터");
  });
});
