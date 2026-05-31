import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const migrationPath = join(process.cwd(), "..", "supabase", "migrations", "20260530000100_create_manyang_core.sql");

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
});
