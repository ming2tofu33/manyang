import { describe, expect, it } from "vitest";

import { legacyDreamSeedRoute, nightCheckInRoute } from "./night-checkin-options";
import { bottomNavItems, getActiveNavItem } from "./navigation";

describe("bottom navigation", () => {
  it("keeps the five main menu items in reference order", () => {
    expect(bottomNavItems.map((item) => item.label)).toEqual([
      "오늘",
      "꿈쓰기",
      "기록",
      "백과",
      "내방",
    ]);
  });

  it("marks nested encyclopedia pages as encyclopedia", () => {
    expect(getActiveNavItem("/encyclopedia/corridor")?.label).toBe("백과");
  });

  it("maps morning mood flow back to today", () => {
    expect(getActiveNavItem("/morning")?.label).toBe("오늘");
  });
  it("maps night check-in flow back to today", () => {
    expect(getActiveNavItem(nightCheckInRoute)?.key).toBe("today");
    expect(getActiveNavItem(legacyDreamSeedRoute)?.key).toBe("today");
  });

  it("marks profile pages as my room", () => {
    expect(getActiveNavItem("/profile")?.label).toBe("내방");
  });
});
