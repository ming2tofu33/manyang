import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const migrationPath = join(process.cwd(), "..", "supabase", "migrations", "20260530000100_create_manyang_core.sql");
const readingUsageMigrationPath = join(
  process.cwd(),
  "..",
  "supabase",
  "migrations",
  "20260601000200_create_reading_usage.sql",
);
const subscriptionsMigrationPath = join(
  process.cwd(),
  "..",
  "supabase",
  "migrations",
  "20260601000300_create_subscriptions.sql",
);
const auditEventsMigrationPath = join(
  process.cwd(),
  "..",
  "supabase",
  "migrations",
  "20260601000400_create_audit_events.sql",
);
const feedbackEventsMigrationPath = join(
  process.cwd(),
  "..",
  "supabase",
  "migrations",
  "20260601000500_create_feedback_events.sql",
);

describe("manyang Supabase schema migration", () => {
  test("creates an isolated manyang schema with core dream tables and RLS", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("create schema if not exists manyang");
    expect(sql).toContain("create table if not exists manyang.profiles");
    expect(sql).toContain("create table if not exists manyang.dream_entries");
    expect(sql).toContain("create table if not exists manyang.dream_readings");
    expect(sql).toContain("create table if not exists manyang.dream_cards");
    expect(sql).toContain("create table if not exists manyang.user_symbol_history");
    expect(sql).toContain("alter table manyang.dream_entries enable row level security");
    expect(sql).toContain("auth.uid()");
    expect(sql).not.toContain("create table if not exists public.profiles");
  });

  test("creates a unified reading usage table for user and guest limits", () => {
    const sql = readFileSync(readingUsageMigrationPath, "utf8");

    expect(sql).toContain("create table if not exists manyang.reading_usage");
    expect(sql).toContain("reading_usage_identity_check");
    expect(sql).toContain("reading_usage_identity_feature_date_unique");
    expect(sql).toContain("reading_usage_user_date_idx");
    expect(sql).toContain("reading_usage_guest_date_idx");
    expect(sql).toContain("alter table manyang.reading_usage enable row level security");
    expect(sql).not.toContain("create table if not exists public.reading_usage");
  });

  test("creates subscription table for paid plan state", () => {
    const sql = readFileSync(subscriptionsMigrationPath, "utf8");

    expect(sql).toContain("create table if not exists manyang.subscriptions");
    expect(sql).toContain("subscriptions_user_provider_unique");
    expect(sql).toContain("subscriptions_provider_subscription_unique");
    expect(sql).toContain("alter table manyang.subscriptions enable row level security");
    expect(sql).not.toContain("create table if not exists public.subscriptions");
  });

  test("creates service-role audit events table", () => {
    const sql = readFileSync(auditEventsMigrationPath, "utf8");

    expect(sql).toContain("create table if not exists manyang.audit_events");
    expect(sql).toContain("audit_events_actor_created_idx");
    expect(sql).toContain("audit_events_target_created_idx");
    expect(sql).toContain("alter table manyang.audit_events enable row level security");
    expect(sql).not.toContain("to authenticated");
  });

  test("creates feedback events table for user and guest feedback", () => {
    const sql = readFileSync(feedbackEventsMigrationPath, "utf8");

    expect(sql).toContain("create table if not exists manyang.feedback_events");
    expect(sql).toContain("feedback_events_identity_check");
    expect(sql).toContain("feedback_events_user_created_idx");
    expect(sql).toContain("feedback_events_subject_created_idx");
    expect(sql).toContain("alter table manyang.feedback_events enable row level security");
    expect(sql).not.toContain("create table if not exists public.feedback_events");
  });
});
