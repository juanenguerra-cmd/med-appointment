import assert from "node:assert/strict";
import { normalizeDate, normalizeRawCensusText, titleCase } from "../src/census/parser/normalizeRawCensusText.ts";
import { safeLower } from "../src/utils/stringHelpers.ts";
import { apiFetch } from "../src/api/apiClient.ts";

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

await test("normalizeRawCensusText normalizes whitespace", () => {
  const input = "A\t\tB\r\n\r\n\r\nC";
  const result = normalizeRawCensusText(input);
  assert.equal(result, "A B\n\nC");
});

await test("normalizeDate returns ISO date for valid dates", () => {
  assert.equal(normalizeDate("05/11/2026"), "2026-05-11");
  assert.equal(normalizeDate("not-a-date"), undefined);
});

await test("titleCase and safeLower handle casing", () => {
  assert.equal(titleCase("jUAN eNGUERRA"), "Juan Enguerra");
  assert.equal(safeLower("ADMIN"), "admin");
});

await test("apiFetch returns body on success", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  try {
    const body = await apiFetch("/api/test");
    assert.deepEqual(body, { ok: true });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await test("apiFetch throws normalized API errors", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: "No access" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });

  try {
    await assert.rejects(() => apiFetch("/api/test"), /No access/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

