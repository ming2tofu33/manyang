import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

import ProfilePage from "./page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/profile",
}));

describe("ProfilePage", () => {
  test("does not render a dead settings action in the header", () => {
    const markup = renderToStaticMarkup(<ProfilePage />);

    expect(markup).toContain("내 꿈방");
    expect(markup).toContain("/manyang/ui/action-icons/action-profile.png");
    expect(markup).not.toContain("/manyang/cutouts/icons/07-circle-profile.png");
    expect(markup).not.toContain("/manyang/ui/action-icons/action-bell.png");
    expect(markup).not.toContain("/manyang/ui/action-icons/action-settings.png");
  });
});
