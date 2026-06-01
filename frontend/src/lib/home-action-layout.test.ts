import { describe, expect, test } from "vitest";

import {
  homeActionButtonClassName,
  homeActionButtonContentClassName,
  homeActionGroupClassName,
  homeActionQuestionClassName,
  homeActionRootClassName,
  homeStageLayout,
  nightHomeActionGroupClassName,
} from "./home-action-layout";

describe("home action layout", () => {
  test("defines the 390x844 home stage and keeps the action band above the footer", () => {
    expect(homeStageLayout.design).toEqual({ width: 390, height: 844 });
    expect(homeStageLayout.viewports).toEqual([
      { width: 375, height: 667 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
    ]);
    expect(homeStageLayout.bands.actions.bottom).toBeLessThanOrEqual(
      homeStageLayout.bands.bottomNav.top - homeStageLayout.minimumGap.actionToNav,
    );
  });

  test("uses named stage classes so future design edits stay centralized", () => {
    expect(homeActionRootClassName).toContain("home-action-stage");
    expect(homeActionRootClassName).toContain("shrink-0");
    expect(homeActionGroupClassName).toContain("home-action-group");
    expect(homeActionQuestionClassName).toContain("home-action-question");
    expect(homeActionButtonClassName).toContain("home-action-button");
    expect(homeActionButtonContentClassName).toContain("home-action-button-copy");
  });

  test("moves night home actions down without transform-based scroll overflow", () => {
    expect(nightHomeActionGroupClassName).toContain("home-action-group");
    expect(nightHomeActionGroupClassName).toContain("mt-4");
    expect(nightHomeActionGroupClassName).not.toContain("-mb");
    expect(nightHomeActionGroupClassName).not.toContain("translate");
  });
});
