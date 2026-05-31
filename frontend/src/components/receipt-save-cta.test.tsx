import { describe, expect, test } from "vitest";

import { createSaveReceiptLoginHref, getReceiptSaveCtaCopy } from "./receipt-save-cta";

describe("receipt save CTA", () => {
  test("links guests to auth with saveLatest handoff", () => {
    expect(createSaveReceiptLoginHref()).toBe("/auth?next=%2Fresult&saveLatest=1");
  });

  test("uses archive value copy", () => {
    expect(getReceiptSaveCtaCopy()).toContain("달력");
    expect(getReceiptSaveCtaCopy()).toContain("꿈 기록");
  });
});
