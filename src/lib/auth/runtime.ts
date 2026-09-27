/**
 * What the server needs before it can honestly claim to authenticate anyone.
 *
 * These are checked rather than assumed because each one fails quietly. A
 * missing AUTH_SECRET leaves NextAuth unable to sign a session; a missing
 * AUTH_ENCRYPTION_KEY falls back to AUTH_SECRET, so rotating one of them
 * silently invalidates every stored two-factor secret and the failure surfaces
 * later, as people who cannot log in, rather than at the boot that caused it.
 */
export type RuntimeProblem = { key: string; detail: string };

const MIN_SECRET_LENGTH = 32;

export function authRuntimeProblems(env: NodeJS.ProcessEnv = process.env): RuntimeProblem[] {
  if (env.NODE_ENV !== "production") return [];
  const problems: RuntimeProblem[] = [];

  const secret = env.AUTH_SECRET?.trim();
  if (!secret) {
    problems.push({ key: "AUTH_SECRET", detail: "fehlt — ohne sie kann keine Sitzung signiert werden" });
  } else if (secret.length < MIN_SECRET_LENGTH) {
    problems.push({ key: "AUTH_SECRET", detail: `ist ${secret.length} Zeichen lang, nötig sind mindestens ${MIN_SECRET_LENGTH}` });
  }

  /* Not required: crypto.ts falls back to AUTH_SECRET, and one key is a
     defensible setup. Required to be long enough if it is set at all, because
     a short one is the setup that looks configured and is not. */
  const encryption = env.AUTH_ENCRYPTION_KEY?.trim();
  if (encryption && encryption.length < MIN_SECRET_LENGTH) {
    problems.push({ key: "AUTH_ENCRYPTION_KEY", detail: `ist ${encryption.length} Zeichen lang, nötig sind mindestens ${MIN_SECRET_LENGTH}` });
  }

  if (!env.DATABASE_URL?.trim()) {
    problems.push({ key: "DATABASE_URL", detail: "fehlt — Anmeldung prüft Konten in der Datenbank" });
  }

  /* The in-memory fallback authenticates against environment variables with no
     database behind it. It is already gated on NODE_ENV, and this says so out
     loud if somebody ever tries to force it back on in production. */
  if (env.AUTH_DEV_MEMORY_FALLBACK === "true") {
    problems.push({ key: "AUTH_DEV_MEMORY_FALLBACK", detail: "ist in der Produktion gesetzt — dieser Notzugang gehört nur in die Entwicklung" });
  }

  return problems;
}

export function assertAuthRuntime(env: NodeJS.ProcessEnv = process.env) {
  const problems = authRuntimeProblems(env);
  if (problems.length === 0) return;
  /* Loud and at boot. A half-configured authentication layer that starts
     anyway is how a deployment goes live with sessions nobody can hold. */
  throw new Error(
    `Die Anmeldung ist in der Produktion nicht vollständig eingerichtet:\n${problems
      .map((problem) => `  - ${problem.key} ${problem.detail}`)
      .join("\n")}`,
  );
}
