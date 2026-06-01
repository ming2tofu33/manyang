import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { dreamAtmosphereOptions, dreamSensationOptions } from "@/lib/dream-entry-options";

import { DreamEntryForm, DreamSubmitButton } from "./dream-entry-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("DreamEntryForm", () => {
  it("renders larger icons for dream atmosphere and sensation options", () => {
    const markup = renderToStaticMarkup(<DreamEntryForm />);
    const largeOptionIconClass = "h-[1.5rem] w-[1.5rem]";

    const largeIconMatches =
      markup.match(new RegExp(largeOptionIconClass.replaceAll("[", "\\[").replaceAll("]", "\\]"), "g")) ?? [];

    expect(largeIconMatches).toHaveLength(dreamAtmosphereOptions.length + dreamSensationOptions.length);
    expect(markup).not.toContain("h-[0.95rem] w-[0.95rem]");
  });

  it("renders dream sensations as a compact 3 column grid after the atmosphere grid", () => {
    const markup = renderToStaticMarkup(<DreamEntryForm />);
    const atmosphereGridIndex = markup.indexOf('data-dream-atmosphere-grid="true"');
    const sensationGridIndex = markup.indexOf('data-dream-sensation-grid="true"');
    const sensationOtherIndex = markup.indexOf('id="dream-sensation-other"');
    const sensationMarkup = markup.slice(sensationGridIndex, sensationOtherIndex);

    expect(atmosphereGridIndex).toBeGreaterThan(-1);
    expect(sensationGridIndex).toBeGreaterThan(atmosphereGridIndex);
    expect(sensationMarkup).toContain("grid-cols-3");
    expect(sensationMarkup).not.toContain("grid-cols-4");
    expect(sensationMarkup).toContain("떨어짐");
    expect(sensationMarkup).toContain("떠다님");
    expect(sensationMarkup).toContain("쫓김");
    expect(sensationMarkup).toContain("갇힘");
    expect(markup).not.toContain("떨어지는 느낌");
    expect(markup).not.toContain("떠다니는 느낌");
    expect(markup).not.toContain("쫓기는 느낌");
    expect(markup).not.toContain("갇힌 느낌");
  });

  it("renders the submit button without extra vertical frame padding", () => {
    const markup = renderToStaticMarkup(<DreamEntryForm />);

    expect(markup).toContain("relative mx-auto -my-2 mt-0 block w-[92%] max-w-[21rem] px-2 py-0");
    expect(markup).toContain('width="857"');
    expect(markup).toContain('height="200"');
    expect(markup).toContain("text-[1.72rem]");
    expect(markup).not.toContain('height="262"');
    expect(markup).not.toContain("block w-full px-3 py-0");
    expect(markup).not.toContain("text-[2rem]");
    expect(markup).not.toContain("relative mx-auto -my-2 mt-0 block w-full px-3 py-2");
  });

  it("keeps the dream reading submit CTA after optional feeling controls", () => {
    const markup = renderToStaticMarkup(<DreamEntryForm />);

    expect(markup.indexOf("해몽 받기")).toBeGreaterThan(markup.indexOf("평온함"));
  });

  it("keeps the write-page CTA as a dream-reading submit even when reading is gated", () => {
    const markup = renderToStaticMarkup(
      <DreamSubmitButton
        isSubmitting={false}
        isReadingAvailable={false}
        canSubmit
        submitButtonLabel="해몽 받기"
        unavailableLabel="오늘은 꿈 영수증을 이미 받았어요"
      />,
    );

    expect(markup).toContain('type="submit"');
    expect(markup).toContain("해몽 받기");
    expect(markup).toContain("<button");
    expect(markup).not.toContain('href="/auth?next=%2Fwrite"');
    expect(markup).not.toContain('<button type="submit" disabled');
    expect(markup).not.toContain('disabled=""');
  });
});
