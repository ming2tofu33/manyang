import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AdminAccessPanel, AdminPersonaSettings, ProfileRoom } from "./profile-room";

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

  it("marks unimplemented room menus as coming soon instead of active mock buttons", () => {
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

    expect(markup.match(/data-profile-menu-status="coming-soon"/g) ?? []).toHaveLength(10);
    expect(markup.match(/data-profile-menu-disabled="true"/g) ?? []).toHaveLength(10);
    expect(markup.match(/준비 중/g) ?? []).toHaveLength(11);
    expect(markup).not.toContain('data-profile-menu-action="mock-button"');
  });

  it("keeps profile menu icons compact", () => {
    const markup = renderToStaticMarkup(<ProfileRoom />);

    expect(markup).toContain("/manyang/ui/profile-icons/profile-notifications.png");
    expect(markup).toContain("/manyang/ui/profile-icons/profile-privacy.png");
    expect(markup).toContain("/manyang/ui/profile-icons/profile-theme.png");
    expect(markup).toContain("/manyang/ui/profile-icons/profile-moon-pass.png");
    expect(markup).toContain("/manyang/ui/profile-icons/profile-service.png");
    expect(markup).toContain("/manyang/ui/profile-icons/profile-account.png");
    expect(markup.match(/h-11 w-11 shrink-0/g) ?? []).toHaveLength(10);
    expect(markup.match(/object-contain p-0/g) ?? []).toHaveLength(10);
    expect(markup).not.toContain("h-[3.25rem] w-[3.25rem] shrink-0");
    expect(markup).not.toContain("rounded-[0.95rem] border border-[#7c4a38]/42 bg-[#241036]/62");
    expect(markup).toContain("마냥 꿈해몽의 해석은 오락과 자기 성찰을 위한 감성 리딩입니다.");
    expect(markup).not.toContain("최근 기록");
    expect(markup).not.toContain("이번 달 기록");
  });

  it("renders the admin testing panel only for admin access state", () => {
    const userMarkup = renderToStaticMarkup(
      <AdminAccessPanel
        accessState={{
          accessPlan: "free_account",
          role: "user",
          bypassDailyLimit: false,
          bypassAccessGate: false,
        }}
      />,
    );
    const adminMarkup = renderToStaticMarkup(
      <AdminAccessPanel
        accessState={{
          accessPlan: "moon_pass",
          role: "admin",
          bypassDailyLimit: true,
          bypassAccessGate: true,
        }}
      />,
    );

    expect(userMarkup).toBe("");
    expect(adminMarkup).toContain('data-profile-section="admin"');
    expect(adminMarkup).toContain('data-admin-access-state="active"');
    expect(adminMarkup).toContain("어드민 테스트 모드");
    expect(adminMarkup).toContain("일일 해몽 제한");
    expect(adminMarkup).toContain("Moon Pass 잠금");
    expect(adminMarkup).toContain('href="/write"');
    expect(adminMarkup).toContain('href="/tarot"');
  });

  it("renders day and night persona settings only for admins", () => {
    const userMarkup = renderToStaticMarkup(<AdminPersonaSettings accessRole="user" />);
    const adminMarkup = renderToStaticMarkup(<AdminPersonaSettings accessRole="admin" />);

    expect(userMarkup).toBe("");
    expect(adminMarkup).toContain('data-profile-section="admin-personas"');
    expect(adminMarkup).toContain('data-admin-persona-option="day"');
    expect(adminMarkup).toContain('data-admin-persona-option="night"');
    expect(adminMarkup).toContain("낮 페르소나");
    expect(adminMarkup).toContain("밤 페르소나");
    expect(adminMarkup).toContain('href="/morning"');
    expect(adminMarkup).toContain('href="/night"');
  });
});
