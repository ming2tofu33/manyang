import { describe, expect, test, vi } from "vitest";

import {
  deleteAllProductRecordsForUser,
  getActiveSubscriptionPlanForUser,
  hasReadingUsageForGuestOnDate,
  hasReadingUsageForUserOnDate,
  incrementReadingUsageForGuest,
  incrementReadingUsageForUser,
  isAdminUser,
  listMorningCheckInsForUser,
  listTarotReadingsForUser,
  persistMorningCheckInForUser,
  persistAuditEvent,
  persistFeedbackEvent,
} from "./manyang-db";

describe("manyang db helpers", () => {
  test("returns true when a profile is marked as admin", async () => {
    const pool = {
      query: vi.fn(async () => ({ rows: [{ is_admin: true }] })),
    };

    await expect(isAdminUser("user-1", pool as never)).resolves.toBe(true);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("manyang.profiles"), ["user-1"]);
  });

  test("returns false when a profile is not marked as admin", async () => {
    const pool = {
      query: vi.fn(async () => ({ rows: [{ is_admin: false }] })),
    };

    await expect(isAdminUser("user-1", pool as never)).resolves.toBe(false);
  });

  test("lists morning check-ins for a user in server record shape", async () => {
    const pool = {
      query: vi.fn(async () => ({
        rows: [
          {
            id: "morning-1",
            mood_date: "2026-06-01",
            mood: "calm",
            mood_color: "#cab",
            body_feeling: "light",
            thought: "hello",
            created_at: "2026-06-01T00:00:00.000Z",
          },
        ],
      })),
    };

    await expect(listMorningCheckInsForUser("user-1", pool as never)).resolves.toEqual([
      {
        id: "morning-1",
        moodDate: "2026-06-01",
        mood: "calm",
        moodColor: "#cab",
        bodyFeeling: "light",
        thought: "hello",
        savedAt: "2026-06-01T00:00:00.000Z",
      },
    ]);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("from manyang.morning_checkins"), ["user-1"]);
  });

  test("upserts a morning check-in for a user", async () => {
    const pool = {
      query: vi.fn(async () => ({
        rows: [
          {
            id: "morning-1",
            mood_date: "2026-06-01",
            mood: "calm",
            mood_color: "#cab",
            body_feeling: "light",
            thought: "hello",
            created_at: "2026-06-01T00:00:00.000Z",
          },
        ],
      })),
    };

    await expect(
      persistMorningCheckInForUser(
        {
          userId: "user-1",
          id: "local-morning",
          moodDate: "2026-06-01",
          mood: "calm",
          moodColor: "#cab",
          bodyFeeling: "light",
          thought: "hello",
          savedAt: "ignored",
        },
        pool as never,
      ),
    ).resolves.toEqual({
      id: "morning-1",
      moodDate: "2026-06-01",
      mood: "calm",
      moodColor: "#cab",
      bodyFeeling: "light",
      thought: "hello",
      savedAt: "2026-06-01T00:00:00.000Z",
    });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("on conflict on constraint morning_checkins_user_mood_date_unique"),
      ["user-1", "2026-06-01", "calm", "#cab", "light", "hello"],
    );
  });

  test("lists tarot readings for a user", async () => {
    const pool = {
      query: vi.fn(async () => ({
        rows: [{ raw_reading: { id: "tarot-1", appDate: "2026-06-05" } }],
      })),
    };

    await expect(listTarotReadingsForUser("user-1", pool as never)).resolves.toEqual([
      { id: "tarot-1", appDate: "2026-06-05" },
    ]);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("from manyang.tarot_readings"), ["user-1"]);
  });

  test("deletes all product records for a user in a transaction", async () => {
    const queries: string[] = [];
    const client = {
      query: vi.fn(async (sql: string) => {
        queries.push(sql);
        return { rows: [], rowCount: 1 };
      }),
      release: vi.fn(),
    };
    const pool = {
      connect: vi.fn(async () => client),
    };

    await deleteAllProductRecordsForUser("user-1", pool as never);

    const joinedQueries = queries.join("\n");
    expect(joinedQueries).toContain("begin");
    expect(joinedQueries).toContain("delete from manyang.dream_entries");
    expect(joinedQueries).toContain("delete from manyang.user_symbol_history");
    expect(joinedQueries).toContain("delete from manyang.pawprints");
    expect(joinedQueries).toContain("delete from manyang.morning_checkins");
    expect(joinedQueries).toContain("delete from manyang.night_checkins");
    expect(joinedQueries).toContain("delete from manyang.tarot_readings");
    expect(joinedQueries).toContain("delete from manyang.reading_usage");
    expect(joinedQueries).toContain("commit");
    expect(client.release).toHaveBeenCalled();
  });

  test("detects reading usage for users and guests", async () => {
    const pool = {
      query: vi.fn(async () => ({ rows: [{ has_usage: true }] })),
    };

    await expect(hasReadingUsageForUserOnDate("user-1", "2026-06-01", "dream_basic", pool as never)).resolves.toBe(
      true,
    );
    await expect(hasReadingUsageForGuestOnDate("38ddea94-5ad1-4d28-8ed1-792dd0132dee", "2026-06-01", "dream_basic", pool as never)).resolves.toBe(
      true,
    );
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("from manyang.reading_usage"),
      ["user-1", "2026-06-01", "dream_basic"],
    );
  });

  test("increments reading usage for users and guests", async () => {
    const pool = {
      query: vi.fn(async () => ({ rows: [] })),
    };

    await incrementReadingUsageForUser("user-1", "2026-06-01", "dream_basic", pool as never);
    await incrementReadingUsageForGuest("38ddea94-5ad1-4d28-8ed1-792dd0132dee", "2026-06-01", "dream_basic", pool as never);

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("reading_usage_identity_feature_date_unique"), [
      "user-1",
      "2026-06-01",
      "dream_basic",
    ]);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("reading_usage_identity_feature_date_unique"), [
      "38ddea94-5ad1-4d28-8ed1-792dd0132dee",
      "2026-06-01",
      "dream_basic",
    ]);
  });

  test("returns active subscription plan when current period is valid", async () => {
    const pool = {
      query: vi.fn(async () => ({ rows: [{ plan_key: "moon_pass" }] })),
    };

    await expect(getActiveSubscriptionPlanForUser("user-1", pool as never)).resolves.toBe("moon_pass");
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("manyang.subscriptions"), ["user-1"]);
  });

  test("persists audit events through service-role data layer", async () => {
    const pool = {
      query: vi.fn(async () => ({ rows: [] })),
    };

    await persistAuditEvent(
      {
        actorUserId: "actor-1",
        targetUserId: "target-1",
        eventType: "subscription.updated",
        metadata: { provider: "stripe" },
      },
      pool as never,
    );

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("insert into manyang.audit_events"), [
      "actor-1",
      "target-1",
      "subscription.updated",
      JSON.stringify({ provider: "stripe" }),
    ]);
  });

  test("persists feedback events for user or guest identity", async () => {
    const pool = {
      query: vi.fn(async () => ({ rows: [{ id: "feedback-1" }] })),
    };

    await expect(
      persistFeedbackEvent(
        {
          userId: "user-1",
          subjectType: "dream_reading",
          subjectId: "dream-1",
          rating: 5,
          feedbackText: "helpful",
          metadata: { source: "receipt" },
        },
        pool as never,
      ),
    ).resolves.toBe("feedback-1");

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("insert into manyang.feedback_events"), [
      "user-1",
      null,
      "dream_reading",
      "dream-1",
      5,
      "helpful",
      JSON.stringify({ source: "receipt" }),
    ]);
  });
});
