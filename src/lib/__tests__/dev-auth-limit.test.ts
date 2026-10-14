import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const db = new PGlite();
const account = "a".repeat(64);
async function attempt(key = account) {
  const result = await db.query<{ retry_after: number }>(
    "select public.consume_preview_dev_signin_attempt($1) as retry_after",
    [key]
  );
  return result.rows[0].retry_after;
}

beforeAll(async () => {
  await db.exec(
    "create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to service_role;"
  );
  await db.exec(
    readFileSync(
      resolve("supabase/migrations/20261013220621_add_preview_dev_signin_limit.sql"),
      "utf8"
    )
  );
}, 20_000);
beforeEach(async () => {
  await db.exec(
    "reset role; truncate dev_auth_private.preview_dev_signin_limits; set role service_role;"
  );
});
afterAll(() => db.close());

describe("shared preview dev sign-in limit", () => {
  it("allows ten attempts and supplies a retry interval without increasing an exhausted counter", async () => {
    for (let n = 0; n < 10; n++) expect(await attempt()).toBe(0);
    const retryAfter = await attempt();
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
    expect(await attempt()).toBeGreaterThan(0);
    const result = await db.query<{ attempts: number }>(
      "select attempts from dev_auth_private.preview_dev_signin_limits"
    );
    expect(result.rows).toEqual([{ attempts: 10 }]);
  });

  it("admits only ten overlapping requests for the same account", async () => {
    const results = await Promise.all(Array.from({ length: 30 }, () => attempt()));
    expect(results.filter((value) => value === 0)).toHaveLength(10);
    expect(results.filter((value) => value > 0)).toHaveLength(20);
  });

  it("starts a new window after the cooldown", async () => {
    for (let n = 0; n < 10; n++) await attempt();
    await db.exec(
      "update dev_auth_private.preview_dev_signin_limits set window_started_at = clock_timestamp() - interval '61 seconds'"
    );
    expect(await attempt()).toBe(0);
    const result = await db.query<{ attempts: number }>(
      "select attempts from dev_auth_private.preview_dev_signin_limits"
    );
    expect(result.rows[0].attempts).toBe(1);
  });

  it("keeps separate test accounts in separate buckets", async () => {
    for (let n = 0; n < 10; n++) await attempt();
    expect(await attempt("b".repeat(64))).toBe(0);
    expect(await attempt()).toBeGreaterThan(0);
  });

  it.each(["anon", "authenticated"])(
    "prevents %s from consuming limits or reading their table",
    async (role) => {
      await db.exec(`set role ${role}`);
      await expect(attempt()).rejects.toThrow(/permission denied/);
      await expect(
        db.query("select * from dev_auth_private.preview_dev_signin_limits")
      ).rejects.toThrow(/permission denied/);
    }
  );

  it("does not use elevated function privileges, and enables RLS on its private table", async () => {
    await db.exec("reset role");
    const functionResult = await db.query<{ elevated: boolean }>(
      "select prosecdef as elevated from pg_proc where proname = 'consume_preview_dev_signin_attempt'"
    );
    expect(functionResult.rows).toEqual([{ elevated: false }]);
    const tableResult = await db.query<{ rls: boolean }>(
      "select relrowsecurity as rls from pg_class where oid = 'dev_auth_private.preview_dev_signin_limits'::regclass"
    );
    expect(tableResult.rows).toEqual([{ rls: true }]);
  });

  it("rejects malformed account keys without storing them", async () => {
    await expect(attempt("an-email@example.com")).rejects.toThrow("Invalid account key");
    const result = await db.query<{ count: number }>(
      "select count(*)::integer as count from dev_auth_private.preview_dev_signin_limits"
    );
    expect(result.rows[0].count).toBe(0);
  });
});
