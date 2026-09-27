import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganizationUser } from "@/lib/auth/current-user";
import { encryptSecret, decryptSecret } from "@/lib/auth/crypto";
import { verifyTotp } from "@/lib/auth/totp";
import { prisma } from "@/lib/db/prisma";
import { isDevAuthUser, updateDevAuthUser } from "@/lib/auth/dev-store";
import { auditEvent } from "@/lib/audit/write";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { errorResponse } from "@/lib/http";

const codeSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  try {
    const limited = rateLimit(clientKey(request, "2fa-verify"), 8, 60_000);
    if (!limited.ok) return tooManyRequests(limited.retryAfterSeconds);
    const user = await requireOrganizationUser();
    const body = codeSchema.parse(await request.json());
    if (!user.totpPendingSecretEncrypted) return NextResponse.json({ error: "Die Zwei-Faktor-Einrichtung wurde noch nicht gestartet." }, { status: 422 });
    /* A pending secret only exists after setup, which re-authenticates when a
       factor is already active. This is the second lock on the same door. */
    if (user.totpEnabled && !user.totpSecretEncrypted) return NextResponse.json({ error: "Der Kontostatus ist inkonsistent. Bitte melden Sie sich neu an." }, { status: 409 });
    const secret = decryptSecret(user.totpPendingSecretEncrypted);
    if (!verifyTotp(secret, body.code)) return NextResponse.json({ error: "Dieser Zwei-Faktor-Code stimmt nicht. Codes laufen nach 30 Sekunden ab." }, { status: 422 });
    if (isDevAuthUser(user)) updateDevAuthUser({ totpSecretEncrypted: encryptSecret(secret), totpPendingSecretEncrypted: null, totpEnabled: true });
    else await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { totpSecretEncrypted: encryptSecret(secret), totpPendingSecretEncrypted: null, totpEnabled: true } });
      if (user.organizationId) await auditEvent(tx, { organizationId: user.organizationId, actorUserId: user.id, action: "TWO_FACTOR_ENABLED", entityType: "User", entityId: user.id, after: { totpEnabled: true } });
    });
    return NextResponse.json({ enabled: true });
  } catch (error) {
    return errorResponse(error);
  }
}
