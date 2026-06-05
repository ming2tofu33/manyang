import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ClientAccessState } from "@/lib/use-access-plan";

import { tarotCardRevealMs } from "./daily-tarot-client";

const mockedAccessState = vi.hoisted(
  (): { value: ClientAccessState } => ({
    value: {
      accessPlan: "moon_pass" as const,
      role: "admin" as const,
      bypassDailyLimit: true,
      bypassAccessGate: true,
    },
  }),
);

vi.mock("@/lib/use-access-plan", () => ({
  useAccessPlan: () => mockedAccessState.value,
}));

import { AdminLoadingLab } from "./admin-loading-lab";

describe("AdminLoadingLab", () => {
  beforeEach(() => {
    mockedAccessState.value = {
      accessPlan: "moon_pass",
      role: "admin",
      bypassDailyLimit: true,
      bypassAccessGate: true,
    };
  });

  it("keeps the collapsed control sheet reduced to the pull handle", () => {
    const markup = renderToStaticMarkup(<AdminLoadingLab initialMode="dream" initialDreamElapsedMs={13000} />);

    expect(markup).toContain('data-admin-loading-lab-state="active"');
    expect(markup).toContain('data-admin-loading-lab-mode="dream"');
    expect(markup).toContain('data-admin-loading-controls-expanded="false"');
    expect(markup).toContain('data-admin-loading-controls-handle="true"');
    expect(markup).toContain("메뉴 올리기");
    expect(markup).toContain('data-loading-scene="orb"');
    expect(markup).not.toContain('data-admin-tool-quick-nav="true"');
    expect(markup).not.toContain('data-admin-tool-nav="true"');
    expect(markup).not.toContain('data-admin-tool-quick-link="admin-lab"');
    expect(markup).not.toContain('href="/profile"');
    expect(markup).not.toContain("꿈해몽 타임라인");
    expect(markup).not.toContain("고양이 등장");
    expect(markup).not.toContain("0.0s - 3.0s");
    expect(markup).not.toContain("25.0s+");
  });

  it("can render the control sheet expanded for detailed timeline checks", () => {
    const markup = renderToStaticMarkup(<AdminLoadingLab initialControlPanelExpanded />);

    expect(markup).toContain('data-admin-loading-controls-expanded="true"');
    expect(markup).toContain("메뉴 내리기");
    expect(markup).not.toContain('data-admin-tool-quick-nav="true"');
    expect(markup).not.toContain('data-admin-tool-nav="true"');
    expect(markup).toContain("꿈해몽 타임라인");
    expect(markup).toContain("고양이 등장");
    expect(markup).toContain("0.0s - 3.0s");
    expect(markup).toContain("3.0s - 13.0s");
    expect(markup).toContain("13.0s - 25.0s+");
    expect(markup).toContain("25.0s+");
    expect(markup).toContain("30.0s / 55.0s");
    expect(markup).toContain("Midnight");
    expect(markup).toContain("Luna");
  });

  it("reuses the real tarot reveal and loading panels with timing controls", () => {
    const revealMarkup = renderToStaticMarkup(
      <AdminLoadingLab initialControlPanelExpanded initialMode="tarot" initialTarotElapsedMs={0} />,
    );
    const loadingMarkup = renderToStaticMarkup(
      <AdminLoadingLab initialControlPanelExpanded initialMode="tarot" initialTarotElapsedMs={tarotCardRevealMs} />,
    );

    expect(revealMarkup).toContain('data-admin-loading-lab-mode="tarot"');
    expect(revealMarkup).toContain('data-daily-tarot-reveal="true"');
    expect(revealMarkup).toContain("카드 공개");
    expect(revealMarkup).toContain("1.8s");

    expect(loadingMarkup).toContain('data-daily-tarot-state="generating-result"');
    expect(loadingMarkup).not.toContain('data-daily-tarot-card-story="true"');
    expect(loadingMarkup).toContain('data-daily-tarot-reading-loading="true"');
    expect(loadingMarkup).toContain("해석 대기");
    expect(loadingMarkup).toContain("API 8.0s");
    expect(loadingMarkup).toContain("결과 표시");
    expect(loadingMarkup).not.toContain("결과 전환");
    expect(loadingMarkup).not.toContain("1.2s");
  });

  it("restricts the loading lab for non-admin users", () => {
    mockedAccessState.value = {
      accessPlan: "free_account",
      role: "user",
      bypassDailyLimit: false,
      bypassAccessGate: false,
    };

    const markup = renderToStaticMarkup(<AdminLoadingLab />);

    expect(markup).toContain('data-admin-loading-lab-state="restricted"');
    expect(markup).toContain("Admin only");
    expect(markup).not.toContain('data-loading-scene="reader"');
    expect(markup).not.toContain('data-daily-tarot-loading="true"');
  });
});
