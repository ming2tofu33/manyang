import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const migrationPath = join(
  process.cwd(),
  "..",
  "supabase",
  "migrations",
  "20260530000200_create_manyang_routine_records.sql",
);
const nightCheckInsMigrationPath = join(
  process.cwd(),
  "..",
  "supabase",
  "migrations",
  "20260531000100_create_night_checkins.sql",
);
const morningCheckInsMigrationPath = join(
  process.cwd(),
  "..",
  "supabase",
  "migrations",
  "20260601000100_create_morning_checkins.sql",
);

describe("manyang routine records migration", () => {
  test("creates authenticated-only pawprint and dream seed tables", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("create table if not exists manyang.pawprints");
    expect(sql).toContain("create table if not exists manyang.dream_seeds");
    expect(sql).toContain("alter table manyang.pawprints enable row level security");
    expect(sql).toContain("alter table manyang.dream_seeds enable row level security");
    expect(sql).toContain("(select auth.uid())");
    expect(sql).toContain("create index if not exists pawprints_user_date_idx");
    expect(sql).toContain("create index if not exists dream_seeds_user_date_idx");
    expect(sql).not.toContain("create table if not exists public.pawprints");
  });

  test("creates authenticated-only night check-in table", () => {
    const sql = readFileSync(nightCheckInsMigrationPath, "utf8");

    expect(sql).toContain("create table if not exists manyang.night_checkins");
    expect(sql).toContain("night_checkins_user_check_in_date_unique");
    expect(sql).toContain("alter table manyang.night_checkins enable row level security");
    expect(sql).toContain("(select auth.uid())");
    expect(sql).toContain("create index if not exists night_checkins_user_date_idx");
    expect(sql).not.toContain("create table if not exists public.night_checkins");
  });

  test("creates authenticated-only morning check-in table", () => {
    const sql = readFileSync(morningCheckInsMigrationPath, "utf8");

    expect(sql).toContain("create table if not exists manyang.morning_checkins");
    expect(sql).toContain("morning_checkins_user_mood_date_unique");
    expect(sql).toContain("alter table manyang.morning_checkins enable row level security");
    expect(sql).toContain("(select auth.uid())");
    expect(sql).toContain("create index if not exists morning_checkins_user_date_idx");
    expect(sql).not.toContain("create table if not exists public.morning_checkins");
  });
});
