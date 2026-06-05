import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProfileRoom } from "./profile-room";

describe("ProfileRoom", () => {
  it("orders the room around account, reader theme, plan, settings, records, and support", () => {
    const markup = renderToStaticMarkup(<ProfileRoom />);

    const accountIndex = markup.indexOf('data-profile-section="account"');
    const readerIndex = markup.indexOf('data-profile-section="reader"');
    const planIndex = markup.indexOf('data-profile-section="plan"');
    const settingsIndex = markup.indexOf('data-profile-section="app-settings"');
    const recordsIndex = markup.indexOf('data-profile-section="records"');
    const supportIndex = markup.indexOf('data-profile-section="support"');

    expect(accountIndex).toBeGreaterThan(-1);
    expect(readerIndex).toBeGreaterThan(accountIndex);
    expect(planIndex).toBeGreaterThan(readerIndex);
    expect(settingsIndex).toBeGreaterThan(planIndex);
    expect(recordsIndex).toBeGreaterThan(settingsIndex);
    expect(supportIndex).toBeGreaterThan(recordsIndex);

    expect(markup).toContain('data-account-status-card="guest"');
    expect(markup).toContain("아직 임시 손님 모드예요");
    expect(markup).toContain("대표 고양이 설정");
    expect(markup).toContain("Moon Pass");
    expect(markup).toContain("앱 설정");
    expect(markup).toContain("기록 관리");
    expect(markup).toContain("도움말");
  });

  it("renders implemented profile menus as real actions", () => {
    const markup = renderToStaticMarkup(<ProfileRoom />);

    [
      "알림과 루틴",
      "개인정보와 보안",
      "화면 테마",
      "기록 백업",
      "기록 내보내기",
      "전체 기록 삭제",
      "문의와 피드백",
      "이용약관",
      "개인정보처리방침",
      "앱 버전",
    ].forEach((label) => {
      expect(markup).toContain(label);
    });

    expect(markup).not.toContain("계정 관리");
    expect(markup).not.toContain("Moon Guest");
    expect(markup).not.toContain("도민님");

    expect(markup).toContain('data-profile-menu-action="feedback"');
    expect(markup).toContain('data-profile-menu-action="record-export"');
    expect(markup).toContain('data-profile-menu-action="record-delete"');
    expect(markup).toContain('data-profile-menu-action="terms"');
    expect(markup).toContain('data-profile-menu-action="privacy-policy"');
    expect(markup).toContain('data-profile-menu-action="app-version"');
    expect(markup).toContain('href="/terms"');
    expect(markup).toContain('href="/privacy"');

    expect(markup.match(/data-profile-menu-status="coming-soon"/g) ?? []).toHaveLength(4);
    expect(markup.match(/data-profile-menu-disabled="true"/g) ?? []).toHaveLength(4);
    expect(markup.match(/준비 중/g) ?? []).toHaveLength(4);
    expect(markup).not.toContain('data-profile-menu-action="mock-button"');
  });

  it("shows the current access plan in the Moon Pass section", () => {
    const markup = renderToStaticMarkup(<ProfileRoom />);

    expect(markup).toContain('data-profile-plan-status="guest"');
    expect(markup).toContain("현재 플랜");
    expect(markup).toContain("게스트 모드");
  });

  it("keeps unsupported profile menus visibly deferred", () => {
    const markup = renderToStaticMarkup(<ProfileRoom />);

    expect(markup).toContain("알림과 루틴");
    expect(markup).toContain("개인정보와 보안");
    expect(markup).toContain("화면 테마");
    expect(markup).toContain("기록 백업");
    expect(markup.match(/data-profile-menu-status="coming-soon"/g) ?? []).toHaveLength(4);
  });

  it("keeps profile menu icons compact", () => {
    const markup = renderToStaticMarkup(<ProfileRoom />);

    expect(markup).toContain("/manyang/ui/profile-icons/profile-notifications.png");
    expect(markup).toContain("/manyang/ui/profile-icons/profile-theme.png");
    expect(markup).toContain("/manyang/ui/profile-icons/profile-moon-pass.png");
    expect(markup).toContain("/manyang/ui/profile-menu-icons/profile-menu-privacy-security.png");
    expect(markup).toContain("/manyang/ui/profile-menu-icons/profile-menu-record-backup.png");
    expect(markup).toContain("/manyang/ui/profile-menu-icons/profile-menu-record-export.png");
    expect(markup).toContain("/manyang/ui/profile-menu-icons/profile-menu-record-delete.png");
    expect(markup).toContain("/manyang/ui/profile-menu-icons/profile-menu-feedback.png");
    expect(markup).toContain("/manyang/ui/profile-menu-icons/profile-menu-terms.png");
    expect(markup).toContain("/manyang/ui/profile-menu-icons/profile-menu-privacy-policy.png");
    expect(markup).toContain("/manyang/ui/profile-menu-icons/profile-menu-app-version.png");
    expect(markup.match(/h-11 w-11 shrink-0/g) ?? []).toHaveLength(10);
    expect(markup.match(/object-contain p-0/g) ?? []).toHaveLength(10);
    expect(markup).not.toContain("h-[3.25rem] w-[3.25rem] shrink-0");
    expect(markup).not.toContain("rounded-[0.95rem] border border-[#7c4a38]/42 bg-[#241036]/62");
    expect(markup).toContain("마냥 꿈해몽의 해석은 오락과 자기 성찰을 위한 감성 리딩입니다.");
    expect(markup).not.toContain("최근 기록");
    expect(markup).not.toContain("이번 달 기록");
  });

  it("does not add separate admin-only profile sections", () => {
    const markup = renderToStaticMarkup(<ProfileRoom />);

    expect(markup).not.toContain('data-profile-section="admin"');
    expect(markup).not.toContain('data-profile-section="admin-lab"');
    expect(markup).not.toContain('data-admin-access-state="active"');
    expect(markup).not.toContain('data-admin-lab-entry="active"');
  });
});
