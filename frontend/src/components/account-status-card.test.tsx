import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import {
  AccountStatusCard,
  createProfileLoginHref,
  getAccountStatusCopy,
} from "./account-status-card";

describe("account status card", () => {
  test("describes guest status", () => {
    expect(getAccountStatusCopy("guest")).toMatchObject({
      title: "아직 임시 손님 모드예요",
      primaryActionLabel: "Google로 로그인하기",
    });
  });

  test("describes authenticated status", () => {
    expect(getAccountStatusCopy("authenticated")).toMatchObject({
      title: "계정이 꿈을 보관하고 있어요",
      primaryActionLabel: "로그아웃",
    });
  });

  test("links guest login back to profile", () => {
    expect(createProfileLoginHref()).toBe("/auth?next=%2Fprofile");
  });

  test("renders a guest login card by default", () => {
    const markup = renderToStaticMarkup(<AccountStatusCard />);

    expect(markup).toContain('data-account-status-card="guest"');
    expect(markup).toContain(getAccountStatusCopy("guest").title);
    expect(markup).toContain(createProfileLoginHref().replace("&", "&amp;"));
  });
});
