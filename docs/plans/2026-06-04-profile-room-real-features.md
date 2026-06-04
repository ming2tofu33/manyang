# Profile Room Real Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the first useful set of mock/coming-soon items in the profile room with real, tested product features: plan status, feedback, app version, legal pages, data export, and record deletion.

**Architecture:** Keep `ProfileRoom` as the visible profile hub, but extract concrete feature surfaces into small components and API/client helpers. Reuse existing authenticated APIs and server DB helpers where possible; add narrow profile-specific routes only for bulk export and bulk deletion. Keep unsupported features visibly marked as coming soon instead of pretending they work.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Supabase auth, `pg`, existing `manyang-db` data layer, Vitest, localStorage helpers.

---

## Current State

The current profile room is implemented in:

- `frontend/src/app/profile/page.tsx`
- `frontend/src/components/profile-room.tsx`
- `frontend/src/components/profile-room.test.tsx`

Already real:

- Account status and login/logout through `AccountStatusCard`
- Cat reader selection through `CatReaderPicker`
- Language toggle through `LanguageToggle`
- Server-backed access context through `/api/access-context`

Currently mock/coming soon:

- Notifications and routine
- Privacy/security
- Screen theme
- Record backup
- Record export
- Delete all records
- Feedback/contact
- Terms
- Privacy policy
- App version
- Moon Pass card details

Existing backend/data support:

- Feedback table and route already exist: `frontend/src/app/api/feedback/route.ts`
- Access context already exists: `frontend/src/app/api/access-context/route.ts`
- Dream record list/delete APIs exist: `frontend/src/app/api/dreams/route.ts`, `frontend/src/app/api/dreams/[dreamId]/route.ts`
- Routine APIs exist: `frontend/src/app/api/pawprints/route.ts`, `frontend/src/app/api/morning-checkins/route.ts`, `frontend/src/app/api/night-checkins/route.ts`
- DB helpers exist for dreams, pawprints, morning check-ins, night check-ins, subscriptions, feedback, tarot persistence.

---

## Scope For This Implementation

Implement now:

- Moon Pass/profile plan status display
- Feedback/contact modal using the existing feedback API
- App version modal
- Terms and privacy policy static pages
- Data export for authenticated users and guests
- Delete all product records for authenticated users and guests

Keep deferred:

- Push/browser notifications and weekly report scheduling
- Screen/theme customization
- Stripe checkout and billing portal
- Full account deletion

Rationale: the implemented items are backed by existing DB/API or can be done safely with static pages/localStorage. The deferred items need product policy, external provider setup, or a larger design pass.

---

## Task 1: Replace The Mock Menu Primitive With Action-Aware Menu Items

**Files:**

- Modify: `frontend/src/components/profile-room.tsx`
- Modify: `frontend/src/components/profile-room.test.tsx`

**Step 1: Write the failing test**

Add a test that expects only deferred items to use `data-profile-menu-status="coming-soon"`, while implemented items expose real actions.

Example assertions:

```ts
it("renders implemented profile menus as real actions", () => {
  const markup = renderToStaticMarkup(<ProfileRoom />);

  expect(markup).toContain('data-profile-menu-action="feedback"');
  expect(markup).toContain('data-profile-menu-action="record-export"');
  expect(markup).toContain('data-profile-menu-action="record-delete"');
  expect(markup).toContain('data-profile-menu-action="terms"');
  expect(markup).toContain('data-profile-menu-action="privacy-policy"');
  expect(markup).toContain('data-profile-menu-action="app-version"');

  expect(markup.match(/data-profile-menu-status="coming-soon"/g) ?? []).toHaveLength(4);
});
```

The 4 remaining coming-soon items should be:

- notifications/routine
- privacy/security
- screen theme
- record backup/sync status, if not implemented in this first pass

**Step 2: Run the focused test to verify it fails**

```bash
npm --prefix frontend test -- src/components/profile-room.test.tsx
```

Expected: fail because every menu item still renders through `ComingSoonMenuList`.

**Step 3: Implement minimal action-aware menu types**

In `profile-room.tsx`, change the menu item type to include status/action metadata:

```ts
type ProfileMenuAction =
  | "feedback"
  | "record-export"
  | "record-delete"
  | "terms"
  | "privacy-policy"
  | "app-version";

type ProfileMenuItem = {
  title: string;
  description: string;
  status?: "ready" | "coming-soon";
  action?: ProfileMenuAction;
  href?: string;
} & (
  | { icon: keyof typeof manyangAssets.profileIcons; menuIcon?: never }
  | { icon?: never; menuIcon: keyof typeof manyangAssets.profileMenuIcons }
);
```

Replace `ComingSoonMenuList` with a more general `ProfileMenuList`:

```tsx
function ProfileMenuList({
  items,
  onAction,
}: {
  items: ProfileMenuItem[];
  onAction: (action: ProfileMenuAction) => void;
}) {
  return (
    <div role="list" className="overflow-hidden rounded-[1.35rem] border border-[#7c4a38]/62 bg-[rgba(7,6,17,0.72)] shadow-[0_0_30px_rgba(0,0,0,0.28)] ring-1 ring-[#d799ff]/12 backdrop-blur-md">
      {items.map((item, index) => {
        const isComingSoon = item.status === "coming-soon" || (!item.action && !item.href);
        const content = (
          <>
            <span className="relative h-11 w-11 shrink-0">
              <Image src={getProfileMenuIconSrc(item)} alt="" fill sizes="44px" unoptimized className="object-contain p-0" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.98rem] font-semibold text-[#ffd98a]">{item.title}</span>
              <span className="mt-0.5 block truncate text-[12px] text-[#fff3d7]/68">{item.description}</span>
            </span>
            <span className="shrink-0 rounded-full border border-[#b98255]/44 bg-[#1b1028]/68 px-2.5 py-1 text-[11px] font-semibold text-[#f0bc7d]">
              {isComingSoon ? "준비 중" : "열기"}
            </span>
          </>
        );

        const className = cn(
          "flex w-full items-center gap-3 px-4 py-3 text-left",
          index > 0 && "border-t border-[#7c4a38]/38",
          isComingSoon ? "cursor-default opacity-78" : "transition hover:bg-[#140d24]/70",
          ui.insetFocus,
        );

        if (item.href && !isComingSoon) {
          return (
            <a key={item.title} role="listitem" href={item.href} data-profile-menu-action={item.action} className={className}>
              {content}
            </a>
          );
        }

        if (item.action && !isComingSoon) {
          return (
            <button key={item.title} type="button" role="listitem" data-profile-menu-action={item.action} onClick={() => onAction(item.action!)} className={className}>
              {content}
            </button>
          );
        }

        return (
          <div key={item.title} role="listitem" data-profile-menu-disabled="true" data-profile-menu-status="coming-soon" className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
```

**Step 4: Run the focused test**

```bash
npm --prefix frontend test -- src/components/profile-room.test.tsx
```

Expected: pass.

**Step 5: Commit**

```bash
git add frontend/src/components/profile-room.tsx frontend/src/components/profile-room.test.tsx
git commit -m "feat(profile): add real menu actions"
```

---

## Task 2: Show Real Plan Status In The Moon Pass Section

**Files:**

- Modify: `frontend/src/components/profile-room.tsx`
- Modify: `frontend/src/components/profile-room.test.tsx`

**Step 1: Write the failing test**

Add assertions that the plan section exposes the effective plan from `useAccessPlan`.

```ts
it("shows the current access plan in the Moon Pass section", () => {
  const markup = renderToStaticMarkup(<ProfileRoom />);

  expect(markup).toContain('data-profile-plan-status="guest"');
  expect(markup).toContain("현재 플랜");
});
```

**Step 2: Run the focused test**

```bash
npm --prefix frontend test -- src/components/profile-room.test.tsx
```

Expected: fail because the Moon Pass section only says ready/coming soon.

**Step 3: Implement minimal plan copy**

Add helper:

```ts
function getPlanStatusCopy(accessPlan: AccessPlan, role: AccessRole) {
  if (role === "admin") {
    return {
      label: "Admin",
      title: "관리자 권한",
      body: "관리자 모드에서는 Moon Pass 기능과 테스트 옵션을 확인할 수 있어요.",
    };
  }

  if (accessPlan === "moon_pass") {
    return {
      label: "Moon Pass",
      title: "Moon Pass 사용 중",
      body: "세 장 타로와 확장 기능을 사용할 수 있어요.",
    };
  }

  if (accessPlan === "free_account") {
    return {
      label: "무료 계정",
      title: "무료 계정",
      body: "꿈 기록 저장과 기본 기능을 사용할 수 있어요.",
    };
  }

  return {
    label: "게스트",
    title: "게스트 모드",
    body: "로그인하면 꿈 기록과 루틴 기록을 계정에 저장할 수 있어요.",
  };
}
```

Use it in the existing `data-profile-section="plan"` section:

```tsx
const planCopy = getPlanStatusCopy(accessState.accessPlan, accessState.role);

<section data-profile-section="plan" data-profile-plan-status={accessState.role === "admin" ? "admin" : accessState.accessPlan}>
  ...
  <span>현재 플랜</span>
  <h2>{planCopy.title}</h2>
  <p>{planCopy.body}</p>
</section>
```

**Step 4: Run the focused test**

```bash
npm --prefix frontend test -- src/components/profile-room.test.tsx
```

Expected: pass.

**Step 5: Commit**

```bash
git add frontend/src/components/profile-room.tsx frontend/src/components/profile-room.test.tsx
git commit -m "feat(profile): show current plan status"
```

---

## Task 3: Add App Version Dialog

**Files:**

- Create: `frontend/src/lib/app-version.ts`
- Create: `frontend/src/lib/app-version.test.ts`
- Create: `frontend/src/components/profile-app-version-dialog.tsx`
- Create: `frontend/src/components/profile-app-version-dialog.test.tsx`
- Modify: `frontend/src/components/profile-room.tsx`
- Modify: `frontend/src/components/profile-room.test.tsx`

**Step 1: Write the app version test**

```ts
import { describe, expect, it } from "vitest";
import { getAppVersionLabel } from "./app-version";

describe("app version", () => {
  it("reads the frontend package version", () => {
    expect(getAppVersionLabel()).toMatch(/^v\d+\.\d+\.\d+$/);
  });
});
```

**Step 2: Verify it fails**

```bash
npm --prefix frontend test -- src/lib/app-version.test.ts
```

Expected: fail because the module does not exist.

**Step 3: Implement app version helper**

```ts
import packageJson from "../../package.json";

export function getAppVersionLabel(): string {
  return `v${packageJson.version}`;
}
```

**Step 4: Add dialog test**

```ts
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProfileAppVersionDialog } from "./profile-app-version-dialog";

describe("ProfileAppVersionDialog", () => {
  it("renders app version details", () => {
    const markup = renderToStaticMarkup(<ProfileAppVersionDialog onClose={() => undefined} />);

    expect(markup).toContain('data-profile-dialog="app-version"');
    expect(markup).toContain("앱 버전");
    expect(markup).toContain("v0.1.0");
  });
});
```

**Step 5: Implement dialog**

```tsx
"use client";

import { getAppVersionLabel } from "@/lib/app-version";
import { cn, ui } from "@/lib/styles";

export function ProfileAppVersionDialog({ onClose }: { onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" data-profile-dialog="app-version" className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
      <div className="w-full max-w-[22rem] rounded-[1rem] border border-[#7c4a38]/62 bg-[#070611] p-4 text-[#fff3d7]">
        <h2 className="text-base font-semibold text-[#ffd98a]">앱 버전</h2>
        <p className="mt-2 text-sm">현재 버전: {getAppVersionLabel()}</p>
        <button type="button" onClick={onClose} className={cn("mt-4 rounded-full border border-[#b98255]/55 px-4 py-2 text-sm font-semibold text-[#f2c27d]", ui.insetFocus)}>
          닫기
        </button>
      </div>
    </div>
  );
}
```

**Step 6: Wire the menu action**

In `ProfileRoom`, add local state:

```ts
const [activeDialog, setActiveDialog] = useState<ProfileMenuAction | null>(null);
```

Handle app version:

```tsx
<ProfileMenuList items={supportItems} onAction={setActiveDialog} />
{activeDialog === "app-version" ? <ProfileAppVersionDialog onClose={() => setActiveDialog(null)} /> : null}
```

**Step 7: Run focused tests**

```bash
npm --prefix frontend test -- src/lib/app-version.test.ts src/components/profile-app-version-dialog.test.tsx src/components/profile-room.test.tsx
```

Expected: pass.

**Step 8: Commit**

```bash
git add frontend/src/lib/app-version.ts frontend/src/lib/app-version.test.ts frontend/src/components/profile-app-version-dialog.tsx frontend/src/components/profile-app-version-dialog.test.tsx frontend/src/components/profile-room.tsx frontend/src/components/profile-room.test.tsx
git commit -m "feat(profile): show app version"
```

---

## Task 4: Add Feedback Dialog Using Existing Feedback API

**Files:**

- Create: `frontend/src/lib/profile-guest-id.ts`
- Create: `frontend/src/lib/profile-guest-id.test.ts`
- Create: `frontend/src/lib/feedback-api.ts`
- Create: `frontend/src/lib/feedback-api.test.ts`
- Create: `frontend/src/components/profile-feedback-dialog.tsx`
- Create: `frontend/src/components/profile-feedback-dialog.test.tsx`
- Modify: `frontend/src/components/profile-room.tsx`
- Modify: `frontend/src/components/profile-room.test.tsx`

**Step 1: Write guest id test**

```ts
import { describe, expect, it } from "vitest";
import { getOrCreateProfileGuestId, profileGuestIdStorageKey, type StorageLike } from "./profile-guest-id";

function createStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
  };
}

describe("profile guest id", () => {
  it("creates and reuses a UUID for guest feedback", () => {
    const storage = createStorage();
    const first = getOrCreateProfileGuestId(storage);
    const second = getOrCreateProfileGuestId(storage);

    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f-]{36}$/i);
    expect(storage.getItem(profileGuestIdStorageKey)).toBe(first);
  });
});
```

**Step 2: Implement guest id helper**

```ts
export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export const profileGuestIdStorageKey = "manyang:profile-guest-id";

function createGuestId(): string {
  return crypto.randomUUID();
}

export function getOrCreateProfileGuestId(storage: StorageLike): string {
  const existing = storage.getItem(profileGuestIdStorageKey);
  if (existing) return existing;

  const id = createGuestId();
  storage.setItem(profileGuestIdStorageKey, id);
  return id;
}

export function getOrCreateProfileGuestIdFromBrowser(): string | null {
  if (typeof window === "undefined") return null;
  return getOrCreateProfileGuestId(window.localStorage);
}
```

**Step 3: Write feedback API tests**

```ts
import { describe, expect, it } from "vitest";
import { submitProfileFeedback } from "./feedback-api";

describe("feedback api", () => {
  it("submits app flow feedback", async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    const result = await submitProfileFeedback(
      { rating: 5, feedbackText: "좋아요", guestId: "00000000-0000-4000-8000-000000000001" },
      async (url, init) => {
        calls.push({ url: String(url), body: JSON.parse(String(init?.body)) });
        return Response.json({ id: "feedback-1" }, { status: 201 });
      },
    );

    expect(result).toEqual({ status: "ok", id: "feedback-1" });
    expect(calls[0]).toMatchObject({
      url: "/api/feedback",
      body: { subjectType: "app_flow", rating: 5, feedbackText: "좋아요" },
    });
  });
});
```

**Step 4: Implement feedback API helper**

```ts
export type ProfileFeedbackInput = {
  rating: number;
  feedbackText: string;
  guestId?: string | null;
};

export type ProfileFeedbackResult =
  | { status: "ok"; id: string }
  | { status: "error"; message: string };

export async function submitProfileFeedback(
  input: ProfileFeedbackInput,
  fetcher: typeof fetch = fetch,
): Promise<ProfileFeedbackResult> {
  const response = await fetcher("/api/feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      subjectType: "app_flow",
      rating: input.rating,
      feedbackText: input.feedbackText,
      ...(input.guestId ? { guestId: input.guestId } : {}),
      metadata: { source: "profile_room" },
    }),
  });

  if (!response.ok) {
    return { status: "error", message: "피드백을 저장하지 못했어요." };
  }

  const body = (await response.json()) as { id?: string };
  return { status: "ok", id: body.id ?? "" };
}
```

**Step 5: Build dialog with controlled submit**

Use a compact dialog with:

- 1-5 rating buttons
- textarea max 1000
- submit button
- status text after success/error

The dialog should get a guest id only when needed:

```ts
const guestId = getOrCreateProfileGuestIdFromBrowser();
```

Do not block authenticated users if `guestId` is null; the server route will use the auth user.

**Step 6: Wire the menu action**

In `ProfileRoom`, render:

```tsx
{activeDialog === "feedback" ? <ProfileFeedbackDialog onClose={() => setActiveDialog(null)} /> : null}
```

**Step 7: Run focused tests**

```bash
npm --prefix frontend test -- src/lib/profile-guest-id.test.ts src/lib/feedback-api.test.ts src/components/profile-feedback-dialog.test.tsx src/components/profile-room.test.tsx src/app/api/feedback/route.test.ts
```

Expected: pass.

**Step 8: Commit**

```bash
git add frontend/src/lib/profile-guest-id.ts frontend/src/lib/profile-guest-id.test.ts frontend/src/lib/feedback-api.ts frontend/src/lib/feedback-api.test.ts frontend/src/components/profile-feedback-dialog.tsx frontend/src/components/profile-feedback-dialog.test.tsx frontend/src/components/profile-room.tsx frontend/src/components/profile-room.test.tsx
git commit -m "feat(profile): collect feedback from profile room"
```

---

## Task 5: Add Terms And Privacy Policy Pages

**Files:**

- Create: `frontend/src/app/terms/page.tsx`
- Create: `frontend/src/app/terms/page.test.tsx`
- Create: `frontend/src/app/privacy/page.tsx`
- Create: `frontend/src/app/privacy/page.test.tsx`
- Modify: `frontend/src/components/profile-room.tsx`
- Modify: `frontend/src/components/profile-room.test.tsx`

**Step 1: Write page tests**

```ts
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TermsPage from "./page";

describe("TermsPage", () => {
  it("renders service terms with AI reading disclaimer", () => {
    const markup = renderToStaticMarkup(<TermsPage />);
    expect(markup).toContain("이용약관");
    expect(markup).toContain("오락과 자기 성찰");
  });
});
```

For privacy:

```ts
expect(markup).toContain("개인정보처리방침");
expect(markup).toContain("꿈 기록");
expect(markup).toContain("Supabase");
```

**Step 2: Run tests to verify failure**

```bash
npm --prefix frontend test -- src/app/terms/page.test.tsx src/app/privacy/page.test.tsx
```

Expected: fail because pages do not exist.

**Step 3: Implement minimal static pages**

Use `AppShell` and `DREAM_READING_DISCLAIMER`. Keep copy concise and explicitly non-medical/non-legal.

Terms must include:

- Service purpose
- AI interpretation disclaimer
- User responsibility for submitted content
- Moon Pass/billing placeholder stating paid billing is not implemented until checkout exists
- Contact path through profile feedback

Privacy must include:

- Stored data categories: auth profile, dream records, routine records, tarot records, usage records, feedback
- Guest localStorage behavior
- Supabase storage/processing
- Deletion/export availability

**Step 4: Wire links**

Set support menu items:

```ts
{ title: "이용약관", ..., href: "/terms", action: "terms", status: "ready" }
{ title: "개인정보처리방침", ..., href: "/privacy", action: "privacy-policy", status: "ready" }
```

**Step 5: Run focused tests**

```bash
npm --prefix frontend test -- src/app/terms/page.test.tsx src/app/privacy/page.test.tsx src/components/profile-room.test.tsx
```

Expected: pass.

**Step 6: Commit**

```bash
git add frontend/src/app/terms/page.tsx frontend/src/app/terms/page.test.tsx frontend/src/app/privacy/page.tsx frontend/src/app/privacy/page.test.tsx frontend/src/components/profile-room.tsx frontend/src/components/profile-room.test.tsx
git commit -m "feat(profile): add terms and privacy pages"
```

---

## Task 6: Add Data Export For Authenticated And Guest Users

**Files:**

- Create: `frontend/src/lib/profile-export.ts`
- Create: `frontend/src/lib/profile-export.test.ts`
- Create: `frontend/src/lib/server/profile-export.ts`
- Create: `frontend/src/lib/server/profile-export.test.ts`
- Create: `frontend/src/app/api/profile/export/route.ts`
- Create: `frontend/src/app/api/profile/export/route.test.ts`
- Modify: `frontend/src/lib/server/manyang-db.ts`
- Modify: `frontend/src/lib/server/manyang-db.test.ts`
- Modify: `frontend/src/components/profile-room.tsx`
- Modify: `frontend/src/components/profile-room.test.tsx`

**Step 1: Write server export tests**

Test that the server export shape includes:

```ts
{
  exportedAt: expect.any(String),
  identity: { type: "authenticated", userId: "user-1" },
  dreams: [],
  pawprints: [],
  morningCheckIns: [],
  nightCheckIns: [],
  tarotReadings: [],
}
```

**Step 2: Add missing tarot listing helper**

In `manyang-db.ts`, add:

```ts
export async function listTarotReadingsForUser(userId: string, pool = getManyangDbPool()): Promise<DailyTarotReading[]> {
  const result = await pool.query<{ raw_reading: DailyTarotReading }>(
    `
      select raw_reading
      from manyang.tarot_readings
      where user_id = $1
      order by app_date desc, created_at desc
      limit 120
    `,
    [userId],
  );

  return result.rows.map((row) => row.raw_reading);
}
```

**Step 3: Create server export helper**

```ts
export async function createProfileExportForUser(userId: string): Promise<ProfileExportPayload> {
  const [dreams, pawprints, morningCheckIns, nightCheckIns, tarotReadings] = await Promise.all([
    listDreamRecordsForUser(userId),
    listPawprintsForUser(userId),
    listMorningCheckInsForUser(userId),
    listNightCheckInsForUser(userId),
    listTarotReadingsForUser(userId),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    identity: { type: "authenticated", userId },
    dreams,
    pawprints,
    morningCheckIns,
    nightCheckIns,
    tarotReadings,
  };
}
```

**Step 4: Add export API route**

`GET /api/profile/export`

- 401 if unauthenticated
- returns JSON export payload if authenticated

**Step 5: Add client export helper**

In `profile-export.ts`, implement:

- `createProfileExportFileName(date = new Date())`
- `downloadJsonFile(payload, filename)`
- `exportAuthenticatedProfile(fetcher = fetch)`
- `createGuestProfileExportFromBrowser()`

Guest export should read local records from existing localStorage helpers:

- dream records from `dream-storage`
- pawprints/morning/night from existing routine helpers
- tarot from `daily-tarot`

If some helper is not exported yet, add the smallest exported function needed and test it.

**Step 6: Wire profile menu action**

For `record-export`, call:

- authenticated: `GET /api/profile/export`, then download JSON
- guest: build local export and download JSON

The UI can show a small transient status:

- `내보내기 완료`
- `내보내기에 실패했어요`

**Step 7: Run focused tests**

```bash
npm --prefix frontend test -- src/lib/profile-export.test.ts src/lib/server/profile-export.test.ts src/app/api/profile/export/route.test.ts src/lib/server/manyang-db.test.ts src/components/profile-room.test.tsx
```

Expected: pass.

**Step 8: Commit**

```bash
git add frontend/src/lib/profile-export.ts frontend/src/lib/profile-export.test.ts frontend/src/lib/server/profile-export.ts frontend/src/lib/server/profile-export.test.ts frontend/src/app/api/profile/export/route.ts frontend/src/app/api/profile/export/route.test.ts frontend/src/lib/server/manyang-db.ts frontend/src/lib/server/manyang-db.test.ts frontend/src/components/profile-room.tsx frontend/src/components/profile-room.test.tsx
git commit -m "feat(profile): export user records"
```

---

## Task 7: Add Delete All Product Records

**Files:**

- Create: `frontend/src/lib/profile-record-actions.ts`
- Create: `frontend/src/lib/profile-record-actions.test.ts`
- Create: `frontend/src/app/api/profile/records/route.ts`
- Create: `frontend/src/app/api/profile/records/route.test.ts`
- Modify: `frontend/src/lib/server/manyang-db.ts`
- Modify: `frontend/src/lib/server/manyang-db.test.ts`
- Create: `frontend/src/components/profile-delete-records-dialog.tsx`
- Create: `frontend/src/components/profile-delete-records-dialog.test.tsx`
- Modify: `frontend/src/components/profile-room.tsx`
- Modify: `frontend/src/components/profile-room.test.tsx`

**Step 1: Define exact deletion scope**

Delete product records:

- `manyang.dream_entries` and cascaded readings/cards
- `manyang.pawprints`
- `manyang.morning_checkins`
- `manyang.night_checkins`
- `manyang.tarot_readings`
- `manyang.reading_usage` rows for the user

Do not delete:

- `manyang.profiles`
- `manyang.subscriptions`
- `manyang.feedback_events`
- `manyang.audit_events`
- Supabase auth user

Reason: this is "delete my records", not "delete my account".

**Step 2: Write DB helper test**

```ts
it("deletes all product records for a user in a transaction", async () => {
  const queries: string[] = [];
  const client = {
    query: vi.fn(async (sql: string) => {
      queries.push(sql);
      return { rowCount: 1, rows: [] };
    }),
    release: vi.fn(),
  };
  const pool = {
    connect: vi.fn(async () => client),
  } as never;

  await deleteAllProductRecordsForUser("user-1", pool);

  expect(queries.join("\n")).toContain("delete from manyang.dream_entries");
  expect(queries.join("\n")).toContain("delete from manyang.pawprints");
  expect(queries.join("\n")).toContain("delete from manyang.morning_checkins");
  expect(queries.join("\n")).toContain("delete from manyang.night_checkins");
  expect(queries.join("\n")).toContain("delete from manyang.tarot_readings");
  expect(queries.join("\n")).toContain("delete from manyang.reading_usage");
});
```

**Step 3: Implement DB helper**

Use `withTransaction`.

```ts
export async function deleteAllProductRecordsForUser(userId: string, pool = getManyangDbPool()): Promise<void> {
  await withTransaction(pool, async (client) => {
    await client.query("delete from manyang.dream_entries where user_id = $1", [userId]);
    await client.query("delete from manyang.pawprints where user_id = $1", [userId]);
    await client.query("delete from manyang.morning_checkins where user_id = $1", [userId]);
    await client.query("delete from manyang.night_checkins where user_id = $1", [userId]);
    await client.query("delete from manyang.tarot_readings where user_id = $1", [userId]);
    await client.query("delete from manyang.reading_usage where user_id = $1", [userId]);
  });
}
```

**Step 4: Add API route**

`DELETE /api/profile/records`

- 401 if unauthenticated
- calls `deleteAllProductRecordsForUser(userId)`
- returns `{ deleted: true }`

**Step 5: Add client helper**

```ts
export async function deleteAuthenticatedProfileRecords(fetcher: typeof fetch = fetch) {
  const response = await fetcher("/api/profile/records", { method: "DELETE" });
  return response.ok ? { status: "ok" as const } : { status: "error" as const };
}
```

Also add `deleteGuestProfileRecordsFromBrowser()` that clears only app record keys, not all localStorage:

- dream archive keys
- latest dream result key
- pawprints
- morning check-ins
- night check-ins
- daily tarot readings

**Step 6: Build confirmation dialog**

The dialog must require a confirmation phrase to prevent accidental deletion.

Use phrase:

```ts
const deleteConfirmationPhrase = "기록 삭제";
```

Dialog behavior:

- disabled delete button until phrase matches
- calls authenticated delete or guest local delete
- closes on success
- dispatches relevant local storage change events if guest deletion clears local records

**Step 7: Run focused tests**

```bash
npm --prefix frontend test -- src/lib/profile-record-actions.test.ts src/app/api/profile/records/route.test.ts src/lib/server/manyang-db.test.ts src/components/profile-delete-records-dialog.test.tsx src/components/profile-room.test.tsx
```

Expected: pass.

**Step 8: Commit**

```bash
git add frontend/src/lib/profile-record-actions.ts frontend/src/lib/profile-record-actions.test.ts frontend/src/app/api/profile/records/route.ts frontend/src/app/api/profile/records/route.test.ts frontend/src/lib/server/manyang-db.ts frontend/src/lib/server/manyang-db.test.ts frontend/src/components/profile-delete-records-dialog.tsx frontend/src/components/profile-delete-records-dialog.test.tsx frontend/src/components/profile-room.tsx frontend/src/components/profile-room.test.tsx
git commit -m "feat(profile): delete all product records"
```

---

## Task 8: Keep Deferred Items Honest

**Files:**

- Modify: `frontend/src/components/profile-room.tsx`
- Modify: `frontend/src/components/profile-room.test.tsx`

**Step 1: Write test for deferred labels**

```ts
it("keeps unsupported profile menus visibly deferred", () => {
  const markup = renderToStaticMarkup(<ProfileRoom />);

  expect(markup).toContain("알림과 루틴");
  expect(markup).toContain("개인정보와 보안");
  expect(markup).toContain("화면 테마");
  expect(markup).toContain("기록 백업");
  expect(markup.match(/data-profile-menu-status="coming-soon"/g) ?? []).toHaveLength(4);
});
```

**Step 2: Update copy**

Make the deferred descriptions concrete:

- notifications/routine: "푸시 알림과 주간 리포트는 별도 설정 후 열릴 예정이에요."
- privacy/security: "계정 삭제와 세부 보안 설정은 별도 정책 정리 후 열릴 예정이에요."
- theme: "화면 색상과 배경 테마는 디자인 시스템 정리 후 열릴 예정이에요."
- backup: "자동 백업 상태 표시는 서버 동기화 상태 추적이 준비되면 열릴 예정이에요."

**Step 3: Run focused test**

```bash
npm --prefix frontend test -- src/components/profile-room.test.tsx
```

Expected: pass.

**Step 4: Commit**

```bash
git add frontend/src/components/profile-room.tsx frontend/src/components/profile-room.test.tsx
git commit -m "chore(profile): clarify deferred profile features"
```

---

## Task 9: Full Verification

**Step 1: Run focused profile tests**

```bash
npm --prefix frontend test -- src/components/profile-room.test.tsx src/components/profile-feedback-dialog.test.tsx src/components/profile-app-version-dialog.test.tsx src/components/profile-delete-records-dialog.test.tsx src/lib/profile-export.test.ts src/lib/profile-record-actions.test.ts
```

Expected: all pass.

**Step 2: Run API tests**

```bash
npm --prefix frontend test -- src/app/api/feedback/route.test.ts src/app/api/profile/export/route.test.ts src/app/api/profile/records/route.test.ts
```

Expected: all pass.

**Step 3: Run full test suite**

```bash
npm --prefix frontend test
```

Expected: all tests pass.

**Step 4: Run lint**

```bash
npm --prefix frontend run lint
```

Expected: no ESLint errors.

**Step 5: Run production build**

```bash
npm --prefix frontend run build
```

Expected: build succeeds.

**Step 6: Manual checks**

Manual profile page checks:

- Guest can open `/profile`.
- Guest can open feedback dialog and submit feedback.
- Guest can export local records.
- Guest can delete local records after entering the confirmation phrase.
- Logged-in user sees correct plan status.
- Logged-in user can export server records.
- Logged-in user can delete server product records after entering the confirmation phrase.
- Terms and privacy links open pages.
- App version dialog displays `v0.1.0` or the current frontend package version.
- Deferred items still show "준비 중" and are not clickable.

**Step 7: Commit any verification-only test updates**

```bash
git status --short
git log --oneline -10
```

If no additional edits were needed, do not create a commit.

---

## Suggested Commit Grouping

Use separate commits:

1. `feat(profile): add real menu actions`
2. `feat(profile): show current plan status`
3. `feat(profile): show app version`
4. `feat(profile): collect feedback from profile room`
5. `feat(profile): add terms and privacy pages`
6. `feat(profile): export user records`
7. `feat(profile): delete all product records`
8. `chore(profile): clarify deferred profile features`

---

## Out Of Scope For This Plan

Do not implement these in this pass:

- Stripe checkout, billing portal, subscription webhooks
- Browser push notifications
- Weekly report generation/scheduling
- Full Supabase auth account deletion
- User-configurable visual themes
- Admin UI for feedback/audit browsing

These need separate product decisions and a dedicated implementation plan.
