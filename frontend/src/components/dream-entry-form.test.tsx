import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { dreamAtmosphereOptions, dreamSensationOptions } from "@/lib/dream-entry-options";

import { DreamEntryForm } from "./dream-entry-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("DreamEntryForm", () => {
  it("renders larger icons for dream atmosphere and sensation options", () => {
    const markup = renderToStaticMarkup(<DreamEntryForm />);
    const largeOptionIconClass = "h-[1.25rem] w-[1.25rem]";

    const largeIconMatches =
      markup.match(new RegExp(largeOptionIconClass.replaceAll("[", "\\[").replaceAll("]", "\\]"), "g")) ?? [];

    expect(largeIconMatches).toHaveLength(dreamAtmosphereOptions.length + dreamSensationOptions.length);
    expect(markup).not.toContain("h-[0.95rem] w-[0.95rem]");
  });

  it("renders the submit button without extra vertical frame padding", () => {
    const markup = renderToStaticMarkup(<DreamEntryForm />);

    expect(markup).toContain("relative mx-auto -my-2 mt-0 block w-full px-3 py-0");
    expect(markup).not.toContain("relative mx-auto -my-2 mt-0 block w-full px-3 py-2");
  });
});
