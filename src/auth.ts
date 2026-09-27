import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { decryptSecret } from "@/lib/auth/crypto";
import { verifyTotp } from "@/lib/auth/totp";
import { authenticateDevUser, devAuthFallbackEnabled } from "@/lib/auth/dev-store";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertAuthRuntime } from "@/lib/auth/runtime";

/**
 * The password provider is the product's primary way in, not a development
 * convenience. Accounts carry a scrypt hash, invitations set one, the password
 * policy governs it and two-step protects it — the whole apparatus exists for
 * this path.
 *
 * It used to be registered only when NODE_ENV was not production, which made
 * every real deployment unreachable unless Google was configured, and Google
 * alone cannot serve a company that signs people up by invitation. It also
 * broke the invitation flow outright: accepting one signs you in through this
 * provider, and in production there was nothing to sign in with.
 *
 * What was genuinely development-only is the in-memory fallback further down,
 * and that is where the gate belongs. devAuthFallbackEnabled() already refuses
 * in production, and lib/auth/runtime.ts refuses to boot if somebody tries to
 * force it back on.
 */
const providers = [
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? [Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })]
    : []),
  ...(process.env.AUTH_PASSWORD_LOGIN_ENABLED !== "false"
    ? [Credentials({
        id: "password",
        name: "E-Mail und Passwort",
        credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" }, totpCode: { label: "2FA code", type: "text" } },
        async authorize(credentials) {
          const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
          const password = typeof credentials?.password === "string" ? credentials.password : "";
          const totpCode = typeof credentials?.totpCode === "string" ? credentials.totpCode : "";
          if (!email || !password) return null;
          /* Checked here rather than when this module loads: `next build` runs
             with NODE_ENV=production, and a build machine legitimately has no
             session secret and no database. Asserting at import time turned a
             misconfigured deployment into a broken build instead. This is the
             request that must not succeed against a half-configured server, so
             this is where it is refused. */
          assertAuthRuntime();
          /* Sign-in runs inside NextAuth's own route, so the gate lives here.
             Keyed by address rather than by caller: the thing worth bounding is
             guesses against one account. */
          if (!rateLimit(`login:${email}`, 10, 60_000).ok) return null;
          try {
            const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
            /* No organizationId check here. An account that belongs to
               nowhere yet is exactly the account that has to sign in to found
               one; every page and route decides for itself what it needs. */
            if (user && user.status === "ACTIVE" && verifyPassword(password, user.passwordHash)) {
              if (user.totpEnabled) {
                if (!user.totpSecretEncrypted) return null;
                try {
                  if (!verifyTotp(decryptSecret(user.totpSecretEncrypted), totpCode)) return null;
                } catch {
                  return null;
                }
              }
              return { id: user.id, name: user.name, email: user.email, image: user.image, organizationId: user.organizationId, role: user.role?.key ?? null };
            }
          } catch (error) {
            if (!devAuthFallbackEnabled()) throw error;
          }
          /* Past this line is the development-only path: it authenticates
             against a file and two environment variables with no database
             behind it. authenticateDevUser refuses in production on its own,
             but a wrong password on a real account reaching a second
             authenticator at all is not a shape worth keeping — so the exit is
             here, before it, and not inside it. */
          if (!devAuthFallbackEnabled()) return null;
          const devUser = authenticateDevUser(email, password, (candidate) => {
            if (!candidate.totpSecretEncrypted) return false;
            try { return verifyTotp(decryptSecret(candidate.totpSecretEncrypted), totpCode); } catch { return false; }
          });
          return devUser ? { id: devUser.id, name: devUser.name, email: devUser.email, image: null, organizationId: devUser.organizationId, role: devUser.roleKey } : null;
        },
      })]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers,
  pages: { signIn: "/login" },
  callbacks: {
    /* The credentials provider checks TOTP; an OAuth sign-in never did, so an
       account that had turned on two-step could sign in around it. Until the
       OAuth flow carries its own challenge step, refuse rather than bypass. */
    async signIn({ user, account }) {
      if (!account || account.provider === "password") return true;
      if (!user?.email) return true;
      try {
        const record = await prisma.user.findUnique({ where: { email: user.email }, select: { totpEnabled: true } });
        if (record?.totpEnabled) return "/login?error=TwoFactorRequired";
      } catch {
        return true;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.organizationId = user.organizationId ?? null;
        token.role = user.role ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId ?? token.sub ?? "");
        session.user.organizationId = token.organizationId == null ? null : String(token.organizationId);
        session.user.role = token.role == null ? null : String(token.role);
      }
      return session;
    },
  },
});
