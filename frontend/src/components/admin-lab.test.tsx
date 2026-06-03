import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/use-access-plan", () => ({
  useAccessPlan: () => ({
    accessPlan: "moon_pass",
    role: "admin",
    bypassDailyLimit: true,
    bypassAccessGate: true,
  }),
}));

vi.mock("@/lib/use-admin-lab-time-override", () => ({
  useAdminLabTimeOverride: () => ({
    forcedDate: new Date("2026-06-01T20:00:00.000+09:00"),
    isForced: true,
    override: "night",
    setOverride: () => undefined,
  }),
}));

import { AdminLab } from "./admin-lab";

describe("AdminLab", () => {
  it("shows the shared admin tool navigation near the top", () => {
    const markup = renderToStaticMarkup(<AdminLab />);

    expect(markup).toContain('data-admin-lab-state="active"');
    expect(markup).toContain('data-admin-tool-nav="true"');
    expect(markup).toContain('data-admin-tool-link="admin-lab"');
    expect(markup).toContain('data-admin-tool-link-active="true"');
    expect(markup).toContain('href="/admin/lab/loading"');
    expect(markup).toContain('href="/tarot?adminTest=1"');
    expect(markup).toContain('href="/profile"');
    expect(markup).toContain("Loading Lab");
  });
});
