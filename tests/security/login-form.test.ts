import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A form without a method submits as GET. Between first paint and hydration the
 * React submit handler does not exist yet, so a submit in that window sent the
 * password as a query parameter — into the address bar, the history, the
 * Referer of the next request and every access log in between. It was observed,
 * not theorised: `GET /login?email=…&password=…` in a dev server log.
 *
 * There is no component renderer in this suite, and pulling one in for two
 * attributes would cost more than it guards. Reading the source is enough to
 * catch the regression that matters: someone removing either half of the fix.
 */
const source = readFileSync(join(process.cwd(), "src/app/login/PasswordLoginForm.tsx"), "utf8");

describe("login form", () => {
  it("never submits credentials as a GET query string", () => {
    expect(source).toMatch(/<form[^>]*\bmethod="post"/);
  });

  it("refuses a submit until the handler that prevents the native one exists", () => {
    expect(source).toMatch(/useEffect\(\(\) => setReady\(true\), \[\]\)/);
    expect(source).toMatch(/const blocked = pending \|\| !ready/);
    expect(source).toMatch(/type="submit"[^>]*disabled=\{blocked\}/);
  });
});
