# AI Generation Supabase Ledger Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a service-role-only Supabase ledger that records AI provider calls with feature, route, subject, token, timing, status, and provider request identifiers, without storing raw prompts or model outputs.

**Architecture:** Add `manyang.ai_generation_events` as the internal attribution ledger, then add TypeScript DB helpers and provider telemetry callbacks. Route handlers create a ledger row before a real AI call, provider code emits token/request/timing telemetry, and routes update the same row best-effort after success, failure, or timeout. External dashboards such as Vercel AI Gateway can be added later, but this table remains the app-owned source for quota, abuse investigation, and feature/user attribution.

**Tech Stack:** Supabase Postgres, Row-Level Security, Next.js 16 route handlers, TypeScript, `pg`, Vitest, OpenAI-compatible Responses API via existing `fetch` providers.

---

## Scope

Implement only the app-owned ledger first.

In scope:
- `manyang.ai_generation_events` migration.
- Service-role-only DB helpers in `frontend/src/lib/server/manyang-db.ts`.
- OpenAI Responses provider telemetry for request IDs, response IDs, tokens, duration, and processing time.
- Dream and tarot route integration for generation calls.
- No raw dream text, prompt text, tarot reading text, or model output stored in the ledger.

Out of scope for this plan:
- Vercel AI Gateway migration.
- Langfuse.
- Exact USD cost calculation from provider pricing tables.
- Admin dashboard UI.
- Embedding/RAG ingestion telemetry, except leaving schema fields ready for it.

## Current Repo Context

- Work from `C:/Users/amy/Desktop/manyang`.
- The current branch already contains dirty work related to tarot cost/observability/rate limiting. Do not revert or overwrite those changes.
- Existing direct OpenAI provider files:
  - `backend/src/services/openai-responses-provider.ts`
  - `backend/src/services/openai-embeddings-provider.ts`
- Existing route files:
  - `frontend/src/app/api/dreams/analyze/route.ts`
  - `frontend/src/app/api/tarot/readings/route.ts`
- Existing DB helper:
  - `frontend/src/lib/server/manyang-db.ts`
- Existing schema test:
  - `frontend/src/lib/manyang-schema.test.ts`

## Design Rules

1. Store attribution, not content.
   - OK: `feature_key`, `route`, `subject_hash`, `model`, token counts, duration, request ID.
   - Not OK: dream text, prompt, tarot cards as full JSON, model output, user-visible reading text.

2. Use best-effort telemetry writes.
   - A failed telemetry insert/update must not block a user from receiving a reading.
   - The DB helper itself can throw; route-level wrappers catch and ignore.

3. Keep `ai_generation_events` service-role-only.
   - Enable RLS.
   - Do not grant table access to `authenticated` or `anon`.
   - Use the existing server-side `pg` pool.

4. Make one row per provider call.
   - Generate a new UUID `trace_id` before each provider call.
   - Insert `status = 'started'`.
   - Update that same row to `succeeded`, `failed`, or `timeout`.

5. Do not estimate cost in this pass.
   - `estimated_cost_usd` stays nullable.
   - Costs can be backfilled later from Vercel AI Gateway generation lookup or OpenAI usage exports.

---

### Task 1: Add Supabase Migration And Schema Test

**Files:**
- Create: `supabase/migrations/20260606000100_create_ai_generation_events.sql`
- Modify: `frontend/src/lib/manyang-schema.test.ts`

**Step 1: Write the failing schema test**

In `frontend/src/lib/manyang-schema.test.ts`, add the migration path near the other migration path constants:

```ts
const aiGenerationEventsMigrationPath = join(
  process.cwd(),
  "..",
  "supabase",
  "migrations",
  "20260606000100_create_ai_generation_events.sql",
);
```

Add this test inside `describe("manyang Supabase schema migration", () => { ... })`:

```ts
  test("creates service-role AI generation event ledger", () => {
    const sql = readFileSync(aiGenerationEventsMigrationPath, "utf8");

    expect(sql).toContain("create table if not exists manyang.ai_generation_events");
    expect(sql).toContain("ai_generation_events_trace_unique");
    expect(sql).toContain("ai_generation_events_feature_date_idx");
    expect(sql).toContain("ai_generation_events_subject_created_idx");
    expect(sql).toContain("ai_generation_events_started_brin_idx");
    expect(sql).toContain("alter table manyang.ai_generation_events enable row level security");
    expect(sql).toContain("grant select, insert, update, delete on manyang.ai_generation_events to service_role");
    expect(sql).not.toContain("to authenticated");
    expect(sql).not.toContain("create table if not exists public.ai_generation_events");
  });
```

**Step 2: Run the test to verify it fails**

Run from `frontend/`:

```bash
npm test -- src/lib/manyang-schema.test.ts
```

Expected: FAIL because `20260606000100_create_ai_generation_events.sql` does not exist.

**Step 3: Create the migration**

Create `supabase/migrations/20260606000100_create_ai_generation_events.sql`:

```sql
create table if not exists manyang.ai_generation_events (
  id uuid primary key default gen_random_uuid(),
  trace_id uuid not null,
  app_date date,
  feature_key text not null check (
    feature_key in (
      'dream_analysis',
      'tarot_reading',
      'dream_embedding',
      'rag_ingestion',
      'quality_eval'
    )
  ),
  route text not null check (char_length(trim(route)) between 1 and 160),
  provider text not null default 'openai' check (char_length(trim(provider)) between 1 and 80),
  endpoint text not null check (char_length(trim(endpoint)) between 1 and 80),
  model text check (model is null or char_length(trim(model)) between 1 and 120),
  subject_type text not null check (subject_type in ('user', 'guest', 'system', 'unknown')),
  user_id uuid references auth.users(id) on delete set null,
  subject_hash text check (subject_hash is null or char_length(subject_hash) between 16 and 128),
  request_hash text check (request_hash is null or char_length(request_hash) between 16 and 128),
  status text not null check (status in ('started', 'succeeded', 'failed', 'timeout')),
  http_status integer check (http_status is null or (http_status >= 100 and http_status <= 599)),
  error_type text check (error_type is null or char_length(trim(error_type)) between 1 and 120),
  openai_request_id text check (openai_request_id is null or char_length(trim(openai_request_id)) between 1 and 160),
  openai_response_id text check (openai_response_id is null or char_length(trim(openai_response_id)) between 1 and 160),
  gateway_generation_id text check (gateway_generation_id is null or char_length(trim(gateway_generation_id)) between 1 and 160),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  cached_input_tokens integer check (cached_input_tokens is null or cached_input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  reasoning_tokens integer check (reasoning_tokens is null or reasoning_tokens >= 0),
  total_tokens integer check (total_tokens is null or total_tokens >= 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  openai_processing_ms integer check (openai_processing_ms is null or openai_processing_ms >= 0),
  estimated_cost_usd numeric(12, 8) check (estimated_cost_usd is null or estimated_cost_usd >= 0),
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_generation_events_trace_unique unique (trace_id),
  constraint ai_generation_events_completed_after_started check (
    completed_at is null or completed_at >= started_at
  ),
  constraint ai_generation_events_subject_user_check check (
    (subject_type = 'user' and user_id is not null) or
    (subject_type <> 'user')
  )
);

create index if not exists ai_generation_events_feature_date_idx
  on manyang.ai_generation_events (app_date, feature_key, started_at desc);

create index if not exists ai_generation_events_user_created_idx
  on manyang.ai_generation_events (user_id, started_at desc)
  where user_id is not null;

create index if not exists ai_generation_events_subject_created_idx
  on manyang.ai_generation_events (subject_type, subject_hash, started_at desc)
  where subject_hash is not null;

create index if not exists ai_generation_events_failure_idx
  on manyang.ai_generation_events (status, started_at desc)
  where status <> 'succeeded';

create index if not exists ai_generation_events_started_brin_idx
  on manyang.ai_generation_events using brin (started_at);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_ai_generation_events_updated_at') then
    create trigger set_ai_generation_events_updated_at
    before update on manyang.ai_generation_events
    for each row execute function manyang.set_updated_at();
  end if;
end;
$$;

alter table manyang.ai_generation_events enable row level security;

grant select, insert, update, delete on manyang.ai_generation_events to service_role;
```

**Step 4: Run the test to verify it passes**

Run from `frontend/`:

```bash
npm test -- src/lib/manyang-schema.test.ts
```

Expected: PASS.

**Step 5: Commit**

If the worktree is clean enough to commit only these files:

```bash
git add supabase/migrations/20260606000100_create_ai_generation_events.sql frontend/src/lib/manyang-schema.test.ts
git commit -m "feat(db): add ai generation event ledger"
```

If unrelated dirty files are present, skip the commit and continue task-by-task without staging unrelated work.

---

### Task 2: Add DB Helper Types And Tests

**Files:**
- Modify: `frontend/src/lib/server/manyang-db.ts`
- Modify: `frontend/src/lib/server/manyang-db.test.ts`

**Step 1: Write failing DB helper tests**

Update the import list in `frontend/src/lib/server/manyang-db.test.ts`:

```ts
  persistAiGenerationEvent,
  updateAiGenerationEvent,
```

Add tests near the existing `persistAuditEvent` test:

```ts
  test("persists an AI generation event start row", async () => {
    const pool = {
      query: vi.fn(async () => ({ rows: [] })),
    };

    await persistAiGenerationEvent(
      {
        traceId: "00000000-0000-4000-8000-000000000abc",
        appDate: "2026-06-06",
        featureKey: "dream_analysis",
        route: "/api/dreams/analyze",
        provider: "openai",
        endpoint: "responses",
        model: "gpt-5-mini",
        subjectType: "guest",
        subjectHash: "subject-hash",
        requestHash: "request-hash",
        metadata: { locale: "ko" },
      },
      pool as never,
    );

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("insert into manyang.ai_generation_events"), [
      "00000000-0000-4000-8000-000000000abc",
      "2026-06-06",
      "dream_analysis",
      "/api/dreams/analyze",
      "openai",
      "responses",
      "gpt-5-mini",
      "guest",
      null,
      "subject-hash",
      "request-hash",
      "started",
      JSON.stringify({ locale: "ko" }),
    ]);
  });

  test("updates an AI generation event with provider telemetry", async () => {
    const pool = {
      query: vi.fn(async () => ({ rows: [], rowCount: 1 })),
    };

    await expect(
      updateAiGenerationEvent(
        {
          traceId: "00000000-0000-4000-8000-000000000abc",
          status: "succeeded",
          httpStatus: 200,
          openaiRequestId: "req_123",
          openaiResponseId: "resp_123",
          inputTokens: 10,
          cachedInputTokens: 2,
          outputTokens: 5,
          reasoningTokens: 1,
          totalTokens: 15,
          durationMs: 1234,
          openaiProcessingMs: 900,
          metadata: { source: "provider" },
        },
        pool as never,
      ),
    ).resolves.toBe(true);

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("update manyang.ai_generation_events"), [
      "00000000-0000-4000-8000-000000000abc",
      "succeeded",
      200,
      null,
      "req_123",
      "resp_123",
      null,
      10,
      2,
      5,
      1,
      15,
      1234,
      900,
      null,
      JSON.stringify({ source: "provider" }),
    ]);
  });
```

**Step 2: Run the tests to verify they fail**

Run from `frontend/`:

```bash
npm test -- src/lib/server/manyang-db.test.ts
```

Expected: FAIL because the helper functions are not exported.

**Step 3: Add types and helpers**

In `frontend/src/lib/server/manyang-db.ts`, add these types near the existing `PersistAuditEventInput` type:

```ts
export type AiGenerationFeatureKey =
  | "dream_analysis"
  | "tarot_reading"
  | "dream_embedding"
  | "rag_ingestion"
  | "quality_eval";

export type AiGenerationSubjectType = "user" | "guest" | "system" | "unknown";
export type AiGenerationStatus = "started" | "succeeded" | "failed" | "timeout";

export type PersistAiGenerationEventInput = {
  traceId: string;
  appDate?: string | null;
  featureKey: AiGenerationFeatureKey;
  route: string;
  provider?: string;
  endpoint: string;
  model?: string | null;
  subjectType: AiGenerationSubjectType;
  userId?: string | null;
  subjectHash?: string | null;
  requestHash?: string | null;
  status?: AiGenerationStatus;
  metadata?: Record<string, unknown>;
};

export type UpdateAiGenerationEventInput = {
  traceId: string;
  status: Exclude<AiGenerationStatus, "started">;
  httpStatus?: number | null;
  errorType?: string | null;
  openaiRequestId?: string | null;
  openaiResponseId?: string | null;
  gatewayGenerationId?: string | null;
  inputTokens?: number | null;
  cachedInputTokens?: number | null;
  outputTokens?: number | null;
  reasoningTokens?: number | null;
  totalTokens?: number | null;
  durationMs?: number | null;
  openaiProcessingMs?: number | null;
  estimatedCostUsd?: number | null;
  metadata?: Record<string, unknown>;
};
```

Add these helpers near `persistAuditEvent`:

```ts
export async function persistAiGenerationEvent(
  input: PersistAiGenerationEventInput,
  pool = getManyangDbPool(),
): Promise<void> {
  await pool.query(
    `
      insert into manyang.ai_generation_events (
        trace_id,
        app_date,
        feature_key,
        route,
        provider,
        endpoint,
        model,
        subject_type,
        user_id,
        subject_hash,
        request_hash,
        status,
        metadata
      )
      values ($1::uuid, $2::date, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)
      on conflict on constraint ai_generation_events_trace_unique do nothing
    `,
    [
      input.traceId,
      input.appDate ?? null,
      input.featureKey,
      input.route,
      input.provider ?? "openai",
      input.endpoint,
      input.model ?? null,
      input.subjectType,
      input.userId ?? null,
      input.subjectHash ?? null,
      input.requestHash ?? null,
      input.status ?? "started",
      JSON.stringify(input.metadata ?? {}),
    ],
  );
}

export async function updateAiGenerationEvent(
  input: UpdateAiGenerationEventInput,
  pool = getManyangDbPool(),
): Promise<boolean> {
  const result = await pool.query(
    `
      update manyang.ai_generation_events
      set status = $2,
          http_status = $3,
          error_type = $4,
          openai_request_id = $5,
          openai_response_id = $6,
          gateway_generation_id = $7,
          input_tokens = $8,
          cached_input_tokens = $9,
          output_tokens = $10,
          reasoning_tokens = $11,
          total_tokens = $12,
          duration_ms = $13,
          openai_processing_ms = $14,
          estimated_cost_usd = $15,
          metadata = metadata || $16::jsonb,
          completed_at = now(),
          updated_at = now()
      where trace_id = $1::uuid
    `,
    [
      input.traceId,
      input.status,
      input.httpStatus ?? null,
      input.errorType ?? null,
      input.openaiRequestId ?? null,
      input.openaiResponseId ?? null,
      input.gatewayGenerationId ?? null,
      input.inputTokens ?? null,
      input.cachedInputTokens ?? null,
      input.outputTokens ?? null,
      input.reasoningTokens ?? null,
      input.totalTokens ?? null,
      input.durationMs ?? null,
      input.openaiProcessingMs ?? null,
      input.estimatedCostUsd ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );

  return (result.rowCount ?? 0) > 0;
}
```

**Step 4: Run the tests to verify they pass**

Run from `frontend/`:

```bash
npm test -- src/lib/server/manyang-db.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/server/manyang-db.ts frontend/src/lib/server/manyang-db.test.ts
git commit -m "feat(db): add ai generation event helpers"
```

Skip the commit if unrelated dirty files make a clean commit unsafe.

---

### Task 3: Add Provider Telemetry Types

**Files:**
- Modify: `backend/src/services/llm-provider.ts`
- Modify: `backend/src/index.ts`

**Step 1: Update provider interface**

In `backend/src/services/llm-provider.ts`, add:

```ts
export type LlmProviderCallStatus = "succeeded" | "failed" | "timeout";

export type LlmProviderCallTelemetry = {
  status: LlmProviderCallStatus;
  provider: string;
  endpoint: string;
  model: string;
  httpStatus?: number;
  errorType?: string;
  requestId?: string;
  responseId?: string;
  gatewayGenerationId?: string;
  inputTokens?: number;
  cachedInputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
  durationMs?: number;
  openaiProcessingMs?: number;
};
```

Extend `DreamReadingLlmRequest`:

```ts
export type DreamReadingLlmRequest = {
  model?: string;
  instructions: string;
  input: string;
  schemaName: string;
  jsonSchema: JsonSchemaObject;
  timeoutMs?: number;
  telemetry?: {
    traceId?: string;
  };
  onTelemetry?: (telemetry: LlmProviderCallTelemetry) => void;
};
```

**Step 2: Export the new type**

In `backend/src/index.ts`, update the `llm-provider` type exports:

```ts
export type {
  DreamReadingLlmProvider,
  DreamReadingLlmRequest,
  JsonSchemaObject,
  LlmProviderCallStatus,
  LlmProviderCallTelemetry,
} from "./services/llm-provider";
```

**Step 3: Run typecheck**

Run from `backend/`:

```bash
npm run typecheck
```

Expected: PASS. No runtime behavior changes yet.

**Step 4: Commit**

```bash
git add backend/src/services/llm-provider.ts backend/src/index.ts
git commit -m "feat(llm): define provider call telemetry contract"
```

---

### Task 4: Emit OpenAI Responses Provider Telemetry

**Files:**
- Modify: `backend/src/services/openai-responses-provider.ts`
- Modify: `backend/tests/openai-responses-provider.test.ts`

**Step 1: Write failing tests**

In `backend/tests/openai-responses-provider.test.ts`, update the first test to collect telemetry:

```ts
    const telemetry: unknown[] = [];
```

Pass `onTelemetry` to `provider.generateJson`:

```ts
      onTelemetry: (event) => telemetry.push(event),
```

Update the fake response headers:

```ts
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "x-request-id": "req_123",
            "openai-processing-ms": "456",
          },
        },
```

Add assertions:

```ts
    expect(telemetry).toEqual([
      expect.objectContaining({
        status: "succeeded",
        provider: "openai",
        endpoint: "responses",
        model: "override-model",
        httpStatus: 200,
        requestId: "req_123",
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15,
        openaiProcessingMs: 456,
      }),
    ]);
```

Add a new failure test:

```ts
  test("emits telemetry when the Responses API returns an error", async () => {
    const telemetry: unknown[] = [];
    const fetchFn = async (): Promise<Response> =>
      new Response(JSON.stringify({ error: { type: "rate_limit_error" } }), {
        status: 429,
        headers: { "content-type": "application/json", "x-request-id": "req_429" },
      });

    const provider = new OpenAIResponsesProvider({
      apiKey: "sk-test",
      model: "gpt-test",
      fetchFn,
    });

    await expect(
      provider.generateJson({
        instructions: "Return JSON only.",
        input: "{}",
        schemaName: "dream_reading_draft",
        jsonSchema: { type: "object" },
        onTelemetry: (event) => telemetry.push(event),
      }),
    ).rejects.toThrow("OpenAI Responses API request failed with status 429");

    expect(telemetry).toEqual([
      expect.objectContaining({
        status: "failed",
        provider: "openai",
        endpoint: "responses",
        model: "gpt-test",
        httpStatus: 429,
        requestId: "req_429",
        errorType: "http_429",
      }),
    ]);
  });
```

**Step 2: Run the tests to verify they fail**

Run from `backend/`:

```bash
npm test -- tests/openai-responses-provider.test.ts
```

Expected: FAIL because `onTelemetry` is ignored.

**Step 3: Implement telemetry emission**

In `backend/src/services/openai-responses-provider.ts`, import the telemetry type:

```ts
  type LlmProviderCallTelemetry,
```

Add helpers:

```ts
function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function parseIntegerHeader(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : undefined;
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function readNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.round(value) : undefined;
}

function extractUsage(payload: unknown): Partial<LlmProviderCallTelemetry> {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const usage = (payload as Record<string, unknown>).usage;
  if (!usage || typeof usage !== "object") {
    return {};
  }

  const usageRecord = usage as Record<string, unknown>;
  const inputDetails = usageRecord.input_tokens_details;
  const outputDetails = usageRecord.output_tokens_details;

  return {
    inputTokens: readNumber(usageRecord, "input_tokens"),
    cachedInputTokens:
      inputDetails && typeof inputDetails === "object"
        ? readNumber(inputDetails as Record<string, unknown>, "cached_tokens")
        : undefined,
    outputTokens: readNumber(usageRecord, "output_tokens"),
    reasoningTokens:
      outputDetails && typeof outputDetails === "object"
        ? readNumber(outputDetails as Record<string, unknown>, "reasoning_tokens")
        : undefined,
    totalTokens: readNumber(usageRecord, "total_tokens"),
  };
}

function responseIdFromPayload(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  return readString(payload as Record<string, unknown>, "id");
}

function emitTelemetry(onTelemetry: DreamReadingLlmRequest["onTelemetry"], telemetry: LlmProviderCallTelemetry): void {
  try {
    onTelemetry?.(telemetry);
  } catch {
    // Telemetry must not change provider behavior.
  }
}
```

In `generateJson`, create `model`, `startedMs`, and add a client trace header:

```ts
    const model = request.model ?? this.model;
    const startedMs = nowMs();
```

Use `model` in the request body.

Add this header when a trace ID exists:

```ts
          ...(request.telemetry?.traceId ? { "x-client-request-id": request.telemetry.traceId } : {}),
```

After `const response = await this.fetchFn(...)`, compute:

```ts
      const durationMs = Math.max(0, Math.round(nowMs() - startedMs));
      const requestId = response.headers.get("x-request-id") ?? response.headers.get("openai-request-id") ?? undefined;
      const openaiProcessingMs = parseIntegerHeader(response.headers.get("openai-processing-ms"));
```

Before throwing on `!response.ok`, emit:

```ts
        emitTelemetry(request.onTelemetry, {
          status: "failed",
          provider: "openai",
          endpoint: "responses",
          model,
          httpStatus: response.status,
          errorType: `http_${response.status}`,
          requestId,
          durationMs,
          ...(openaiProcessingMs !== undefined ? { openaiProcessingMs } : {}),
        });
```

After parsing `payload`, before returning parsed JSON, emit:

```ts
      emitTelemetry(request.onTelemetry, {
        status: "succeeded",
        provider: "openai",
        endpoint: "responses",
        model,
        httpStatus: response.status,
        requestId,
        responseId: responseIdFromPayload(payload),
        durationMs,
        ...(openaiProcessingMs !== undefined ? { openaiProcessingMs } : {}),
        ...extractUsage(payload),
      });
```

In the timeout catch block, before throwing `new LlmProviderTimeoutError(timeoutMs)`, emit:

```ts
        emitTelemetry(request.onTelemetry, {
          status: "timeout",
          provider: "openai",
          endpoint: "responses",
          model: request.model ?? this.model,
          errorType: "timeout",
          durationMs: Math.max(0, Math.round(nowMs() - startedMs)),
        });
```

**Step 4: Run tests**

Run from `backend/`:

```bash
npm test -- tests/openai-responses-provider.test.ts
npm run typecheck
```

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/services/openai-responses-provider.ts backend/tests/openai-responses-provider.test.ts
git commit -m "feat(openai): emit responses provider telemetry"
```

---

### Task 5: Pass Telemetry Through Dream And Tarot LLM Services

**Files:**
- Modify: `backend/src/services/llm-dream-analysis.ts`
- Modify: `backend/src/services/llm-tarot-reading.ts`
- Modify: `backend/tests/llm-dream-analysis.test.ts`
- Modify: `backend/src/services/llm-tarot-reading.test.ts`

**Step 1: Extend service option types**

In `backend/src/services/llm-dream-analysis.ts`, import:

```ts
import { LlmProviderTimeoutError, type DreamReadingLlmProvider, type DreamReadingLlmRequest, type LlmProviderCallTelemetry } from "./llm-provider";
```

Add to `AnalyzeDreamWithLlmOptions`:

```ts
  telemetry?: DreamReadingLlmRequest["telemetry"];
  onProviderTelemetry?: (telemetry: LlmProviderCallTelemetry) => void;
```

In `generateLlmDreamResponse`, add these properties to `llmRequest`:

```ts
    ...(options.telemetry ? { telemetry: options.telemetry } : {}),
    ...(options.onProviderTelemetry ? { onTelemetry: options.onProviderTelemetry } : {}),
```

In `backend/src/services/llm-tarot-reading.ts`, make the same import update and add to `GenerateTarotReadingOptions`:

```ts
  telemetry?: DreamReadingLlmRequest["telemetry"];
  onProviderTelemetry?: (telemetry: LlmProviderCallTelemetry) => void;
```

Add these fields to the `provider.generateJson` request:

```ts
        ...(options.telemetry ? { telemetry: options.telemetry } : {}),
        ...(options.onProviderTelemetry ? { onTelemetry: options.onProviderTelemetry } : {}),
```

**Step 2: Add focused tests**

In `backend/tests/llm-dream-analysis.test.ts`, add or update a fake provider test so the provider captures `request.telemetry` and `request.onTelemetry`.

Use this assertion:

```ts
expect(provider.requests[0]?.telemetry).toEqual({ traceId: "00000000-0000-4000-8000-000000000abc" });
expect(typeof provider.requests[0]?.onTelemetry).toBe("function");
```

In `backend/src/services/llm-tarot-reading.test.ts`, add the same assertion for `generateTarotReadingForUser`.

**Step 3: Run tests**

Run from `backend/`:

```bash
npm test -- tests/llm-dream-analysis.test.ts src/services/llm-tarot-reading.test.ts
npm run typecheck
```

Expected: PASS.

**Step 4: Commit**

```bash
git add backend/src/services/llm-dream-analysis.ts backend/src/services/llm-tarot-reading.ts backend/tests/llm-dream-analysis.test.ts backend/src/services/llm-tarot-reading.test.ts
git commit -m "feat(llm): pass provider telemetry through reading services"
```

---

### Task 6: Add Frontend Telemetry Helper

**Files:**
- Create: `frontend/src/lib/server/ai-generation-telemetry.ts`
- Create: `frontend/src/lib/server/ai-generation-telemetry.test.ts`

**Step 1: Write failing tests**

Create `frontend/src/lib/server/ai-generation-telemetry.test.ts`:

```ts
import { describe, expect, test, vi } from "vitest";

import {
  createAiGenerationSubject,
  createRequestHash,
  mapProviderTelemetryToAiGenerationUpdate,
  persistAiGenerationEventBestEffort,
  updateAiGenerationEventBestEffort,
} from "./ai-generation-telemetry";

describe("ai-generation-telemetry", () => {
  test("creates a user subject without hashing the user id", () => {
    expect(createAiGenerationSubject({ userId: "user-1" })).toEqual({
      subjectType: "user",
      userId: "user-1",
      subjectHash: null,
    });
  });

  test("creates a guest subject hash without exposing the guest id", () => {
    const subject = createAiGenerationSubject({
      guestId: "00000000-0000-4000-8000-000000000abc",
      hashSecret: "secret",
    });

    expect(subject.subjectType).toBe("guest");
    expect(subject.userId).toBeNull();
    expect(subject.subjectHash).toMatch(/^[a-f0-9]{64}$/);
    expect(subject.subjectHash).not.toContain("abc");
  });

  test("creates a stable request hash from safe request parts", () => {
    expect(createRequestHash({ feature: "dream", appDate: "2026-06-06" }, "secret")).toBe(
      createRequestHash({ appDate: "2026-06-06", feature: "dream" }, "secret"),
    );
  });

  test("maps provider telemetry to DB update input", () => {
    expect(
      mapProviderTelemetryToAiGenerationUpdate("00000000-0000-4000-8000-000000000abc", {
        status: "succeeded",
        provider: "openai",
        endpoint: "responses",
        model: "gpt-5-mini",
        httpStatus: 200,
        requestId: "req_123",
        responseId: "resp_123",
        inputTokens: 10,
        cachedInputTokens: 1,
        outputTokens: 5,
        reasoningTokens: 2,
        totalTokens: 17,
        durationMs: 900,
        openaiProcessingMs: 700,
      }),
    ).toMatchObject({
      traceId: "00000000-0000-4000-8000-000000000abc",
      status: "succeeded",
      httpStatus: 200,
      openaiRequestId: "req_123",
      openaiResponseId: "resp_123",
      inputTokens: 10,
      durationMs: 900,
    });
  });

  test("best-effort wrappers swallow telemetry DB failures", async () => {
    const persist = vi.fn(async () => {
      throw new Error("db down");
    });
    const update = vi.fn(async () => {
      throw new Error("db down");
    });

    await expect(persistAiGenerationEventBestEffort({} as never, persist)).resolves.toBe(false);
    await expect(updateAiGenerationEventBestEffort({} as never, update)).resolves.toBe(false);
  });
});
```

**Step 2: Run the tests to verify they fail**

Run from `frontend/`:

```bash
npm test -- src/lib/server/ai-generation-telemetry.test.ts
```

Expected: FAIL because the module does not exist.

**Step 3: Implement helper**

Create `frontend/src/lib/server/ai-generation-telemetry.ts`:

```ts
import { createHash, createHmac } from "node:crypto";
import type { LlmProviderCallTelemetry } from "@manyang/backend";

import type {
  PersistAiGenerationEventInput,
  UpdateAiGenerationEventInput,
  AiGenerationSubjectType,
} from "@/lib/server/manyang-db";

type PersistAiGenerationEvent = (input: PersistAiGenerationEventInput) => Promise<unknown>;
type UpdateAiGenerationEvent = (input: UpdateAiGenerationEventInput) => Promise<unknown>;

export type AiGenerationSubject = {
  subjectType: AiGenerationSubjectType;
  userId: string | null;
  subjectHash: string | null;
};

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function digest(value: string, secret?: string): string {
  if (secret) {
    return createHmac("sha256", secret).update(value).digest("hex");
  }

  return createHash("sha256").update(value).digest("hex");
}

export function createAiGenerationSubject(input: {
  userId?: string | null;
  guestId?: string | null;
  hashSecret?: string;
}): AiGenerationSubject {
  if (input.userId) {
    return {
      subjectType: "user",
      userId: input.userId,
      subjectHash: null,
    };
  }

  if (input.guestId) {
    return {
      subjectType: "guest",
      userId: null,
      subjectHash: digest(`guest:${input.guestId}`, input.hashSecret),
    };
  }

  return {
    subjectType: "unknown",
    userId: null,
    subjectHash: null,
  };
}

export function createRequestHash(parts: Record<string, unknown>, hashSecret?: string): string {
  return digest(stableStringify(parts), hashSecret);
}

export function mapProviderTelemetryToAiGenerationUpdate(
  traceId: string,
  telemetry: LlmProviderCallTelemetry,
): UpdateAiGenerationEventInput {
  return {
    traceId,
    status: telemetry.status,
    httpStatus: telemetry.httpStatus ?? null,
    errorType: telemetry.errorType ?? null,
    openaiRequestId: telemetry.requestId ?? null,
    openaiResponseId: telemetry.responseId ?? null,
    gatewayGenerationId: telemetry.gatewayGenerationId ?? null,
    inputTokens: telemetry.inputTokens ?? null,
    cachedInputTokens: telemetry.cachedInputTokens ?? null,
    outputTokens: telemetry.outputTokens ?? null,
    reasoningTokens: telemetry.reasoningTokens ?? null,
    totalTokens: telemetry.totalTokens ?? null,
    durationMs: telemetry.durationMs ?? null,
    openaiProcessingMs: telemetry.openaiProcessingMs ?? null,
    metadata: {
      provider: telemetry.provider,
      endpoint: telemetry.endpoint,
      model: telemetry.model,
    },
  };
}

export async function persistAiGenerationEventBestEffort(
  input: PersistAiGenerationEventInput,
  persist: PersistAiGenerationEvent,
): Promise<boolean> {
  try {
    await persist(input);
    return true;
  } catch {
    return false;
  }
}

export async function updateAiGenerationEventBestEffort(
  input: UpdateAiGenerationEventInput,
  update: UpdateAiGenerationEvent,
): Promise<boolean> {
  try {
    await update(input);
    return true;
  } catch {
    return false;
  }
}
```

**Step 4: Run tests**

Run from `frontend/`:

```bash
npm test -- src/lib/server/ai-generation-telemetry.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/server/ai-generation-telemetry.ts frontend/src/lib/server/ai-generation-telemetry.test.ts
git commit -m "feat(server): add ai generation telemetry helpers"
```

---

### Task 7: Wire Dream Analyze Route To The Ledger

**Files:**
- Modify: `frontend/src/app/api/dreams/analyze/route.ts`
- Modify: `frontend/src/app/api/dreams/analyze/route.test.ts`

**Step 1: Add route dependency tests**

In `frontend/src/app/api/dreams/analyze/route.test.ts`, add a focused test for LLM mode with a fake provider that emits telemetry. Use existing route test helpers where possible.

The assertion shape should be:

```ts
expect(persistAiGenerationEvent).toHaveBeenCalledWith(
  expect.objectContaining({
    featureKey: "dream_analysis",
    route: "/api/dreams/analyze",
    endpoint: "responses",
    status: "started",
    appDate: "2026-06-06",
  }),
);
expect(updateAiGenerationEvent).toHaveBeenCalledWith(
  expect.objectContaining({
    status: "succeeded",
    inputTokens: 10,
    outputTokens: 5,
    durationMs: 1234,
  }),
);
```

Also assert no raw dream text is stored:

```ts
expect(JSON.stringify(persistAiGenerationEvent.mock.calls)).not.toContain("my private dream text");
```

**Step 2: Run the focused test to verify it fails**

Run from `frontend/`:

```bash
npm test -- src/app/api/dreams/analyze/route.test.ts
```

Expected: FAIL because the route has no AI generation event dependencies.

**Step 3: Update imports**

In `frontend/src/app/api/dreams/analyze/route.ts`, add DB helpers:

```ts
  persistAiGenerationEvent,
  updateAiGenerationEvent,
  type PersistAiGenerationEventInput,
  type UpdateAiGenerationEventInput,
```

Add telemetry helpers:

```ts
import {
  createAiGenerationSubject,
  createRequestHash,
  mapProviderTelemetryToAiGenerationUpdate,
  persistAiGenerationEventBestEffort,
  updateAiGenerationEventBestEffort,
} from "@/lib/server/ai-generation-telemetry";
```

**Step 4: Extend route dependencies**

Add to `DreamAnalyzeRouteDependencies`:

```ts
  persistAiGenerationEvent?: (input: PersistAiGenerationEventInput) => Promise<unknown>;
  updateAiGenerationEvent?: (input: UpdateAiGenerationEventInput) => Promise<unknown>;
```

Add defaults to `resolvedDependencies`:

```ts
    persistAiGenerationEvent,
    updateAiGenerationEvent,
```

**Step 5: Create trace before the provider call**

Inside `handleDreamAnalyzeRequest`, after `guestSession` and access gate success, before `generateDreamReadingForUser`, create:

```ts
      const aiTraceId = resolvedDependencies.createGuestId();
      const subject = createAiGenerationSubject({
        userId,
        guestId: guestSession?.guestId ?? null,
        hashSecret: process.env.MANYANG_USAGE_HASH_SECRET,
      });
      const requestHash = createRequestHash(
        {
          featureKey: "dream_analysis",
          appDate: dreamDate,
          locale: validatedBody.value.locale ?? "ko",
          catReaderType: validatedBody.value.catReaderType ?? "black_cat",
          readingKind,
          dreamTextLength: validatedBody.value.dreamText.length,
        },
        process.env.MANYANG_USAGE_HASH_SECRET,
      );

      await persistAiGenerationEventBestEffort(
        {
          traceId: aiTraceId,
          appDate: dreamDate,
          featureKey: "dream_analysis",
          route: "/api/dreams/analyze",
          provider: "openai",
          endpoint: "responses",
          model: process.env.MANYANG_OPENAI_MODEL ?? process.env.OPENAI_MODEL ?? null,
          subjectType: subject.subjectType,
          userId: subject.userId,
          subjectHash: subject.subjectHash,
          requestHash,
          metadata: {
            locale: validatedBody.value.locale ?? "ko",
            readingKind,
            catReaderType: validatedBody.value.catReaderType ?? "black_cat",
            dreamTextLength: validatedBody.value.dreamText.length,
          },
        },
        resolvedDependencies.persistAiGenerationEvent,
      );
```

**Step 6: Pass provider telemetry callback**

In the `generateDreamReadingForUser` options, add:

```ts
        telemetry: { traceId: aiTraceId },
        onProviderTelemetry: (telemetry) => {
          void updateAiGenerationEventBestEffort(
            mapProviderTelemetryToAiGenerationUpdate(aiTraceId, telemetry),
            resolvedDependencies.updateAiGenerationEvent,
          );
        },
        onProviderError: (error) => {
          void updateAiGenerationEventBestEffort(
            {
              traceId: aiTraceId,
              status: "failed",
              errorType: error instanceof Error ? error.name : "provider_error",
              metadata: { errorMessage: error instanceof Error ? error.message.slice(0, 240) : "provider_error" },
            },
            resolvedDependencies.updateAiGenerationEvent,
          );
        },
```

If the existing route does not currently pass `onProviderError`, add it without removing existing behavior.

**Step 7: Run tests**

Run from `frontend/`:

```bash
npm test -- src/app/api/dreams/analyze/route.test.ts
```

Expected: PASS.

**Step 8: Commit**

```bash
git add frontend/src/app/api/dreams/analyze/route.ts frontend/src/app/api/dreams/analyze/route.test.ts
git commit -m "feat(dreams): record ai generation telemetry"
```

---

### Task 8: Wire Tarot Reading Route To The Ledger

**Files:**
- Modify: `frontend/src/app/api/tarot/readings/route.ts`
- Modify: `frontend/src/app/api/tarot/readings/route.test.ts`

**Step 1: Add route dependency tests**

In `frontend/src/app/api/tarot/readings/route.test.ts`, add a test where:
- `getAuthenticatedUserId` returns a user ID.
- `findCompletedTarotReadingForUser` returns `null`.
- `createProvider` returns a fake provider.
- `generateTarotReadingForUser` calls `options?.onProviderTelemetry?.(...)` before returning `ok`.

Assert:

```ts
expect(persistAiGenerationEvent).toHaveBeenCalledWith(
  expect.objectContaining({
    featureKey: "tarot_reading",
    route: "/api/tarot/readings",
    endpoint: "responses",
    status: "started",
    appDate: "2026-05-31",
    metadata: expect.objectContaining({ spread: "daily_one_card" }),
  }),
);
expect(updateAiGenerationEvent).toHaveBeenCalledWith(
  expect.objectContaining({
    status: "succeeded",
    inputTokens: 10,
    outputTokens: 5,
  }),
);
```

Also assert no generated reading text is stored in ledger calls.

**Step 2: Run the focused test to verify it fails**

Run from `frontend/`:

```bash
npm test -- src/app/api/tarot/readings/route.test.ts
```

Expected: FAIL because the tarot route has no ledger dependencies.

**Step 3: Update route imports and dependencies**

In `frontend/src/app/api/tarot/readings/route.ts`, import:

```ts
  persistAiGenerationEvent,
  updateAiGenerationEvent,
  type PersistAiGenerationEventInput,
  type UpdateAiGenerationEventInput,
```

Import telemetry helpers:

```ts
import {
  createAiGenerationSubject,
  createRequestHash,
  mapProviderTelemetryToAiGenerationUpdate,
  persistAiGenerationEventBestEffort,
  updateAiGenerationEventBestEffort,
} from "@/lib/server/ai-generation-telemetry";
```

Add to `TarotReadingsRouteDependencies`:

```ts
  persistAiGenerationEvent?: (input: PersistAiGenerationEventInput) => Promise<unknown>;
  updateAiGenerationEvent?: (input: UpdateAiGenerationEventInput) => Promise<unknown>;
```

Add defaults:

```ts
    persistAiGenerationEvent,
    updateAiGenerationEvent,
```

**Step 4: Create trace before tarot provider call**

After guest limit checks and before `generateTarotReadingForUser`, add:

```ts
  const aiTraceId = resolvedDependencies.createGuestId();
  const subject = createAiGenerationSubject({
    userId,
    guestId: guestSession?.guestId ?? null,
    hashSecret: process.env.MANYANG_USAGE_HASH_SECRET,
  });
  const requestHash = createRequestHash(
    {
      featureKey: "tarot_reading",
      appDate: validatedBody.value.appDate,
      spread: validatedBody.value.spread,
      cardIds: validatedBody.value.selections.map((selection) => selection.cardId),
      orientations: validatedBody.value.selections.map((selection) => selection.orientation),
    },
    process.env.MANYANG_USAGE_HASH_SECRET,
  );

  await persistAiGenerationEventBestEffort(
    {
      traceId: aiTraceId,
      appDate: validatedBody.value.appDate,
      featureKey: "tarot_reading",
      route: "/api/tarot/readings",
      provider: "openai",
      endpoint: "responses",
      model: process.env.MANYANG_OPENAI_MODEL ?? process.env.OPENAI_MODEL ?? null,
      subjectType: subject.subjectType,
      userId: subject.userId,
      subjectHash: subject.subjectHash,
      requestHash,
      metadata: {
        spread: validatedBody.value.spread,
        cardCount: validatedBody.value.selections.length,
      },
    },
    resolvedDependencies.persistAiGenerationEvent,
  );
```

**Step 5: Pass telemetry callback**

In the `generateTarotReadingForUser` options, add:

```ts
      telemetry: { traceId: aiTraceId },
      onProviderTelemetry: (telemetry) => {
        void updateAiGenerationEventBestEffort(
          mapProviderTelemetryToAiGenerationUpdate(aiTraceId, telemetry),
          resolvedDependencies.updateAiGenerationEvent,
        );
      },
```

Update the existing `onProviderError` callback to also update the ledger:

```ts
      onProviderError: (error) => {
        resolvedDependencies.logTarotEvent({
          type: "provider_error",
          spread: validatedBody.value.spread,
          appDate: validatedBody.value.appDate,
          authenticated: Boolean(userId),
          error,
        });
        void updateAiGenerationEventBestEffort(
          {
            traceId: aiTraceId,
            status: "failed",
            errorType: error instanceof Error ? error.name : "provider_error",
            metadata: { errorMessage: error instanceof Error ? error.message.slice(0, 240) : "provider_error" },
          },
          resolvedDependencies.updateAiGenerationEvent,
        );
      },
```

If `result.status === "unavailable"` and no provider telemetry has updated the row, the above `onProviderError` should still record failure for provider errors. For `provider_missing`, do not insert a ledger row because no external AI call happened.

**Step 6: Run tests**

Run from `frontend/`:

```bash
npm test -- src/app/api/tarot/readings/route.test.ts
```

Expected: PASS.

**Step 7: Commit**

```bash
git add frontend/src/app/api/tarot/readings/route.ts frontend/src/app/api/tarot/readings/route.test.ts
git commit -m "feat(tarot): record ai generation telemetry"
```

---

### Task 9: Add Environment Documentation

**Files:**
- Modify: `frontend/.env.example`
- Optional Modify: `docs/plans/2026-06-06-ai-generation-supabase-ledger.md` if implementation notes diverged.

**Step 1: Update env example**

In `frontend/.env.example`, near the server-only OpenAI/Supabase variables, add:

```env
# Optional server-only HMAC salt for AI usage subject/request hashes.
# Set this in production before enabling AI telemetry so guest/session hashes are not plain SHA-256.
# MANYANG_USAGE_HASH_SECRET=replace-with-random-secret
```

Do not add any client-visible `NEXT_PUBLIC_` telemetry secret.

**Step 2: Run a focused check**

Run from `frontend/`:

```bash
npm test -- src/lib/server/ai-generation-telemetry.test.ts
```

Expected: PASS.

**Step 3: Commit**

```bash
git add frontend/.env.example
git commit -m "docs(env): document ai usage hash secret"
```

---

### Task 10: Full Verification

**Files:**
- No new files unless fixes are required.

**Step 1: Backend focused tests**

Run from `backend/`:

```bash
npm test -- tests/openai-responses-provider.test.ts tests/llm-dream-analysis.test.ts src/services/llm-tarot-reading.test.ts
npm run typecheck
```

Expected: PASS.

**Step 2: Frontend focused tests**

Run from `frontend/`:

```bash
npm test -- src/lib/manyang-schema.test.ts src/lib/server/manyang-db.test.ts src/lib/server/ai-generation-telemetry.test.ts src/app/api/dreams/analyze/route.test.ts src/app/api/tarot/readings/route.test.ts
```

Expected: PASS.

**Step 3: Wider checks**

Run from `frontend/`:

```bash
npm test
npm run lint
```

Run from `backend/`:

```bash
npm test
npm run typecheck
```

Expected: PASS. If unrelated pre-existing failures appear, document them with exact command output and keep the telemetry changes focused.

**Step 4: Manual Supabase smoke query**

After applying migrations to a non-production Supabase database, run a real dream or tarot generation and inspect:

```sql
select
  trace_id,
  app_date,
  feature_key,
  route,
  provider,
  endpoint,
  model,
  subject_type,
  status,
  http_status,
  openai_request_id,
  openai_response_id,
  input_tokens,
  cached_input_tokens,
  output_tokens,
  reasoning_tokens,
  total_tokens,
  duration_ms,
  openai_processing_ms,
  estimated_cost_usd,
  metadata,
  started_at,
  completed_at
from manyang.ai_generation_events
order by started_at desc
limit 20;
```

Expected:
- One row per actual provider call.
- `status = 'succeeded'` for a successful reading.
- Token counts populated when the provider returns usage.
- `duration_ms` populated.
- No raw dream text, prompt text, tarot reading text, or model output in `metadata`.

**Step 5: Useful daily investigation queries**

Feature-level usage for a date:

```sql
select
  feature_key,
  model,
  status,
  count(*) as request_count,
  sum(coalesce(input_tokens, 0)) as input_tokens,
  sum(coalesce(output_tokens, 0)) as output_tokens,
  sum(coalesce(total_tokens, 0)) as total_tokens,
  percentile_cont(0.5) within group (order by duration_ms) as p50_duration_ms,
  percentile_cont(0.95) within group (order by duration_ms) as p95_duration_ms
from manyang.ai_generation_events
where app_date = '2026-06-06'
group by feature_key, model, status
order by request_count desc;
```

Top guest/user hashes by request count:

```sql
select
  subject_type,
  coalesce(user_id::text, subject_hash) as subject,
  feature_key,
  count(*) as request_count,
  sum(coalesce(total_tokens, 0)) as total_tokens,
  max(started_at) as last_seen_at
from manyang.ai_generation_events
where started_at >= now() - interval '24 hours'
group by subject_type, coalesce(user_id::text, subject_hash), feature_key
order by request_count desc
limit 50;
```

Failed/timeout calls:

```sql
select
  started_at,
  feature_key,
  route,
  model,
  status,
  http_status,
  error_type,
  openai_request_id,
  duration_ms,
  metadata
from manyang.ai_generation_events
where status <> 'succeeded'
order by started_at desc
limit 50;
```

**Step 6: Final commit if needed**

If all changes are not already committed and the staged set is clean:

```bash
git status --short
git add supabase/migrations/20260606000100_create_ai_generation_events.sql \
  frontend/src/lib/manyang-schema.test.ts \
  frontend/src/lib/server/manyang-db.ts \
  frontend/src/lib/server/manyang-db.test.ts \
  frontend/src/lib/server/ai-generation-telemetry.ts \
  frontend/src/lib/server/ai-generation-telemetry.test.ts \
  frontend/src/app/api/dreams/analyze/route.ts \
  frontend/src/app/api/dreams/analyze/route.test.ts \
  frontend/src/app/api/tarot/readings/route.ts \
  frontend/src/app/api/tarot/readings/route.test.ts \
  frontend/.env.example \
  backend/src/services/llm-provider.ts \
  backend/src/services/openai-responses-provider.ts \
  backend/src/services/llm-dream-analysis.ts \
  backend/src/services/llm-tarot-reading.ts \
  backend/src/index.ts \
  backend/tests/openai-responses-provider.test.ts \
  backend/tests/llm-dream-analysis.test.ts \
  backend/src/services/llm-tarot-reading.test.ts
git commit -m "feat: record ai generation telemetry"
```

Do not stage unrelated dirty files.

---

## Acceptance Checklist

- [ ] `manyang.ai_generation_events` exists in `manyang` schema.
- [ ] RLS is enabled on `manyang.ai_generation_events`.
- [ ] Only `service_role` has explicit table grants.
- [ ] Dream generation inserts `started` before an actual provider call and updates after provider telemetry.
- [ ] Tarot generation inserts `started` before an actual provider call and updates after provider telemetry.
- [ ] `duration_ms`, `openai_processing_ms`, token fields, request IDs, and response IDs are recorded when available.
- [ ] No raw dream text, prompt text, tarot reading text, or model output is stored.
- [ ] Focused frontend/backend tests pass.
- [ ] Full frontend/backend tests and lint/typecheck pass or any unrelated failures are documented.

## Follow-Up Plan After This

1. Add Vercel AI Gateway by supporting `AI_GATEWAY_API_KEY` and `OPENAI_BASE_URL=https://ai-gateway.vercel.sh/v1`.
2. Add `gateway_generation_id` capture if Gateway response metadata exposes it through the OpenAI-compatible Responses API.
3. Add a scheduled reconciliation script that joins app ledger rows with Vercel/OpenAI cost exports.
4. Add an admin-only SQL view or dashboard for daily cost and latency by `feature_key`, `route`, and subject.
