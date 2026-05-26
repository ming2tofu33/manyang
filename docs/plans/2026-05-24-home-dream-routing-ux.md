# Home Dream Routing UX Implementation Plan

**Goal:** Simplify the home decision point and make the "forgotten dream" path save a clear morning mood record.

**Architecture:** Keep the home screen as the entry hub, with two morning actions and one visually separated bedtime action. Add a small browser storage helper for morning mood records and move the morning page behavior into a client form component.

**Tech Stack:** Next.js App Router, React client components, localStorage helpers, Vitest, Playwright.

---

## Tasks

1. Add failing tests for morning mood record creation, note normalization, localStorage save/read, corrupted JSON fallback, and stable snapshot references.
2. Implement `frontend/src/lib/morning-mood.ts` with the minimal storage API needed by the morning page.
3. Replace the static morning screen body with a client component that saves the selected mood/thought and shows a completed state.
4. Rework the home CTA stack so `꿈 비춰보기` and `기억나지 않아요` are the main morning choices, and `꿈 씨앗 심기` sits under a separate bedtime-prep section.
5. Strengthen the dream seed saved state with a clear next step back to home.
6. Run targeted tests, lint, and Playwright screenshots for `/`, `/morning`, and `/seed`.
