import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProfileRoom } from "./profile-room";

describe("ProfileRoom", () => {
  it("renders personal settings without duplicating the archive dashboard", () => {
    const markup = renderToStaticMarkup(<ProfileRoom />);

    expect(markup).toContain("도민님");
    expect(markup).toContain("Moon Guest");
    expect(markup).toContain("대표 해몽사 설정");
    expect(markup).toContain("알림 설정");
    expect(markup).toContain("잠금과 프라이버시");
    expect(markup).toContain("계정 관리");
    expect(markup).toContain("마냥 꿈해몽의 해석은 오락과 자기 성찰을 위한 감성 리딩입니다.");
    expect(markup).not.toContain("최근 기록");
    expect(markup).not.toContain("이번 달 기록");
  });
});
