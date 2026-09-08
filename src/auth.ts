import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { decryptSecret } from "@/lib/auth/crypto";
import { verifyTotp } from "@/lib/auth/totp";
import { authenticateDevUser, devAuthFallbackEnabled } from "@/lib/auth/dev-store";

const providers = [
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? [Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })]
    : []),
  ...(process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_LOGIN_ENABLED !== "false"
    ? [Credentials({
        id: "local",
        name: "Local development",
        credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" }, totpCode: { label: "2FA code", type: "text" } },
        async authorize(credentials) {
          const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
          const password = typeof credentials?.password === "string" ? credentials.password : "";
          const totpCode = typeof credentials?.totpCode === "string" ? credentials.totpCode : "";
          if (!email || !password) return null;
          try {
            const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
            if (user && user.status === "ACTIVE" && user.organizationId && verifyPassword(password, user.passwordHash)) {
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
