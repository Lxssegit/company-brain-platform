import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganizationUser } from "@/lib/auth/current-user";
import { decryptSecret } from "@/lib/auth/crypto";
import { verifyTotp } from "@/lib/auth/totp";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import { isDevAuthUser, updateDevAuthUser } from "@/lib/auth/dev-store";
import { auditEvent } from "@/lib/audit/write";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { errorResponse } from "@/lib/http";

const disableSchema = z.object({ password: z.string().min(1), code: z.string().trim().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  try {
    const limited = rateLimit(clientKey(request, "2fa-disable"), 8, 60_000);
    if (!limited.ok) return tooManyRequests(limited.retryAfterSeconds);
    const user = await requireOrganizationUser();
    const body = disableSchema.parse(await request.json());
    if (!user.passwordHash || !verifyPassword(body.password, user.passwordHash) || !user.totpEnabled || !user.totpSecretEncrypted || !verifyTotp(decryptSecret(user.totpSecretEncrypted), body.code)) return NextResponse.json({ error: "Passwort oder Zwei-Faktor-Code stimmt nicht." }, { status: 422 });
    if (isDevAuthUser(user)) updateDevAuthUser({ totpSecretEncrypted: null, totpPendingSecretEncrypted: null, totpEnabled: false });
    else await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { totpSecretEncrypted: null, totpPendingSecretEncrypted: null, totpEnabled: false } });
      if (user.organizationId) await auditEvent(tx, { organizationId: user.organizationId, actorUserId: user.id, action: "TWO_FACTOR_DISABLED", entityType: "User", entityId: user.id, after: { totpEnabled: false } });
    });
    return NextResponse.json({ enabled: false });
  } catch (error) {
    return errorResponse(error);
  }
}
