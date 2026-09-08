import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganizationUser } from "@/lib/auth/current-user";
import { encryptSecret, decryptSecret } from "@/lib/auth/crypto";
import { verifyTotp } from "@/lib/auth/totp";
import { prisma } from "@/lib/db/prisma";
import { isDevAuthUser, updateDevAuthUser } from "@/lib/auth/dev-store";
import { auditEvent } from "@/lib/audit/write";
import { errorResponse } from "@/lib/http";

const codeSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  try {
    const user = await requireOrganizationUser();
    const body = codeSchema.parse(await request.json());
    if (!user.totpPendingSecretEncrypted) return NextResponse.json({ error: "2FA setup has not been started" }, { status: 422 });
    const secret = decryptSecret(user.totpPendingSecretEncrypted);
    if (!verifyTotp(secret, body.code)) return NextResponse.json({ error: "Invalid 2FA code" }, { status: 422 });
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
