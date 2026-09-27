import { describe, expect, it } from "vitest";
import { authRuntimeProblems, assertAuthRuntime } from "@/lib/auth/runtime";

const productionBase: NodeJS.ProcessEnv = {
  NODE_ENV: "production",
  AUTH_SECRET: "a".repeat(48),
  DATABASE_URL: "postgresql://user:pass@localhost:5432/brain",
};

describe("authRuntimeProblems", () => {
  it("stays out of the way outside production", () => {
    expect(authRuntimeProblems({ NODE_ENV: "development" })).toEqual([]);
    expect(authRuntimeProblems({ NODE_ENV: "test" })).toEqual([])
  });

  it("passes a production setup that has what it needs", () => {
    expect(authRuntimeProblems(productionBase)).toEqual([]);
  });

  it("names a missing session secret", () => {
    const { AUTH_SECRET: _drop, ...without } = productionBase;
    expect(authRuntimeProblems(without).map((problem) => problem.key)).toContain("AUTH_SECRET");
  });

  /* A short secret is the setup that looks configured and is not, which is
     worse than an absent one: nothing prompts anybody to look at it. */
  it("names a session secret too short to be one", () => {
    expect(authRuntimeProblems({ ...productionBase, AUTH_SECRET: "short" }).map((problem) => problem.key)).toContain("AUTH_SECRET");
  });

  it("accepts a missing encryption key, because it falls back to the session secret", () => {
    expect(authRuntimeProblems(productionBase)).toEqual([]);
  });

  it("rejects an encryption key that is set but too short", () => {
    expect(authRuntimeProblems({ ...productionBase, AUTH_ENCRYPTION_KEY: "nope" }).map((problem) => problem.key)).toContain("AUTH_ENCRYPTION_KEY");
  });

  it("names a missing database, because accounts live there", () => {
    const { DATABASE_URL: _drop, ...without } = productionBase;
    expect(authRuntimeProblems(without).map((problem) => problem.key)).toContain("DATABASE_URL");
  });

  /* The in-memory fallback authenticates against environment variables with no
     database behind it. It is gated on NODE_ENV already; this refuses to start
     if somebody tries to talk it back on anyway. */
  it("refuses the development fallback in production", () => {
    expect(authRuntimeProblems({ ...productionBase, AUTH_DEV_MEMORY_FALLBACK: "true" }).map((problem) => problem.key))
      .toContain("AUTH_DEV_MEMORY_FALLBACK");
  });

  it("throws at boot rather than serving a half-configured sign-in", () => {
    expect(() => assertAuthRuntime(productionBase)).not.toThrow();
    expect(() => assertAuthRuntime({ NODE_ENV: "production" })).toThrowError(/AUTH_SECRET/);
  });

  it("reports every problem at once, not one per restart", () => {
    const problems = authRuntimeProblems({ NODE_ENV: "production", AUTH_DEV_MEMORY_FALLBACK: "true" });
    expect(problems.map((problem) => problem.key).sort()).toEqual(["AUTH_DEV_MEMORY_FALLBACK", "AUTH_SECRET", "DATABASE_URL"]);
  });
});
