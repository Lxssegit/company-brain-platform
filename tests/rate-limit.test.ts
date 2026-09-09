import { beforeEach, describe, expect, it, vi } from "vitest";
import { clientKey, rateLimit, resetRateLimits } from "@/lib/security/rate-limit";

describe("rate limiting", () => {
  beforeEach(() => { resetRateLimits(); vi.useRealTimers(); });

  it("allows up to the limit and refuses the next attempt", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) expect(rateLimit("k", 5, 60_000).ok).toBe(true);
    const blocked = rateLimit("k", 5, 60_000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps separate callers in separate buckets", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) rateLimit("a", 5, 60_000);
    expect(rateLimit("a", 5, 60_000).ok).toBe(false);
    expect(rateLimit("b", 5, 60_000).ok).toBe(true);
  });

  it("lets the window expire", () => {
    vi.useFakeTimers();
    for (let attempt = 0; attempt < 3; attempt += 1) rateLimit("w", 3, 1_000);
    expect(rateLimit("w", 3, 1_000).ok).toBe(false);
    vi.advanceTimersByTime(1_100);
    expect(rateLimit("w", 3, 1_000).ok).toBe(true);
  });

  it("derives a key from the forwarded address and degrades to a shared one", () => {
    expect(clientKey(new Request("http://x", { headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" } }), "login")).toBe("login:203.0.113.7");
    expect(clientKey(new Request("http://x"), "login")).toBe("login:unknown");
  });
});
