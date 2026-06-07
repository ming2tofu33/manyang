import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const proxyFilePath = path.join(dirname, "proxy.ts");
const supabaseProxyFilePath = path.join(dirname, "lib", "supabase", "proxy.ts");

describe("Next proxy", () => {
  it("exports a Supabase auth proxy next to the app source", () => {
    expect(existsSync(proxyFilePath)).toBe(true);

    const source = readFileSync(proxyFilePath, "utf8");

    expect(source).toContain("export async function proxy");
    expect(source).toContain("updateSession(request)");
    expect(source).toContain(
      'matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]',
    );
  });

  it("refreshes Supabase auth through request and response cookies", () => {
    expect(existsSync(supabaseProxyFilePath)).toBe(true);

    const source = readFileSync(supabaseProxyFilePath, "utf8");

    expect(source).toContain('import { createServerClient } from "@supabase/ssr"');
    expect(source).toContain("request.cookies.getAll()");
    expect(source).toContain("request.cookies.set(name, value)");
    expect(source).toContain("response.cookies.set(name, value, options)");
    expect(source).toContain("supabase.auth.getClaims()");
  });
});
