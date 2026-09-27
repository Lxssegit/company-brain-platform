import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * app.css and landing.css are both global and both were written as if they were
 * the only sheet on the page. globals.css imports app.css first, so every name
 * landing.css repeats silently wins across the whole signed-in application.
 *
 * That is not a hypothetical: `.btn`, `.btn-quiet` and `.decision` collided,
 * and the result was every button in the application rendering as the marketing
 * page's black rectangle — visible on screen, invisible to typecheck, lint and
 * the rest of this suite. The fix was to scope those rules under `.site`; this
 * test is what keeps them scoped.
 *
 * Adding a shared name is allowed. Adding it unscoped is not.
 */
function topLevelClasses(file: string) {
  const css = readFileSync(join(process.cwd(), "src/app", file), "utf8");
  const names = new Set<string>();
  /* Selectors that start a line at column zero are the unscoped ones. Anything
     nested inside a media query is indented, and anything already scoped starts
     with its scope rather than the class. */
  for (const line of css.split("\n")) {
    const match = /^\.([a-zA-Z][\w-]*)[^{]*\{/.exec(line);
    if (match) names.add(match[1]);
  }
  return names;
}

describe("global stylesheets", () => {
  it("do not define the same class name twice", () => {
    const app = topLevelClasses("app.css");
    const landing = topLevelClasses("landing.css");
    const shared = [...landing].filter((name) => app.has(name)).sort();
    expect(shared, "landing.css must scope any name app.css already uses, e.g. under .site").toEqual([]);
  });

  it("keeps the marketing button styles off the application's buttons", () => {
    const landing = readFileSync(join(process.cwd(), "src/app/landing.css"), "utf8");
    for (const line of landing.split("\n")) {
      expect(line, "an unscoped .btn rule here restyles every button in the app").not.toMatch(/^\.btn[\s{:,]/);
    }
  });
});
