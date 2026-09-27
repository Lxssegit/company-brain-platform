import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, PASSWORD_MIN_LENGTH } from "@/lib/auth/password";
import { auditEvent } from "@/lib/audit/write";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { inviteIdentifier, inviteSecretMatches, parseInviteParam } from "@/lib/invitations/token";
import { errorResponse } from "@/lib/http";

/* No composition rules: length is what actually resists guessing, and the
   attempt itself is rate-limited and the result hashed. The minimum is the
   hash function's own, imported rather than repeated. */
const acceptSchema = z.object({
  invite: z.string().min(24).max(400),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(200),
});

/**
 * Unauthenticated by necessity — the person accepting has no account yet — so
 * this is the one write path a stranger can reach, and it is rate-limited by
 * origin like the login route.
 */
export async function POST(request: Request) {
  try {
    const limit = rateLimit(clientKey(request, "invite-accept"), 8, 10 * 60 * 1000);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

    const body = acceptSchema.parse(await request.json());
    const parsed = parseInviteParam(body.invite);
    /* One message for every failure below: a stranger must not learn whether an
       invitation exists, has expired, or was already used. */
    const refused = () => NextResponse.json({ error: "Diese Einladung ist nicht mehr gültig. Bitten Sie um eine neue." }, { status: 422 });
    if (!parsed) return refused();

    const stored = await prisma.verificationToken.findFirst({ where: { identifier: inviteIdentifier(parsed.userId) } });
    if (!stored || !inviteSecretMatches(parsed.secret, stored.token)) return refused();
    if (stored.expires.getTime() <= Date.now()) {
      await prisma.verificationToken.deleteMany({ where: { identifier: stored.identifier } });
      return refused();
    }

    const user = await prisma.user.findUnique({ where: { id: parsed.userId }, select: { id: true, email: true, status: true, organizationId: true } });
    /* An invitation only ever activates an account that is still waiting. It
       can never reset the password of one that is already in use. */
    if (!user || user.status !== "INVITED" || !user.organizationId) return refused();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(body.password), status: "ACTIVE", emailVerified: new Date() } });
      await tx.verificationToken.deleteMany({ where: { identifier: stored.identifier } });
      await auditEvent(tx, { organizationId: user.organizationId!, actorUserId: user.id, action: "USER_ACTIVATED", entityType: "User", entityId: user.id, after: { email: user.email } });
    });

    return NextResponse.json({ email: user.email }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
