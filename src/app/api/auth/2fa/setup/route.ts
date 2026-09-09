import { NextResponse } from "next/server";
import { requireOrganizationUser } from "@/lib/auth/current-user";
import { encryptSecret } from "@/lib/auth/crypto";
import { generateTotpSecret, totpOtpauthUrl } from "@/lib/auth/totp";
import { prisma } from "@/lib/db/prisma";
import { isDevAuthUser, updateDevAuthUser } from "@/lib/auth/dev-store";
import { errorResponse } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const user = await requireOrganizationUser();
    const secret = generateTotpSecret();
    const pendingSecret = encryptSecret(secret);
    if (isDevAuthUser(user)) updateDevAuthUser({ totpPendingSecretEncrypted: pendingSecret });
    else await prisma.user.update({ where: { id: user.id }, data: { totpPendingSecretEncrypted: pendingSecret } });
    return NextResponse.json({ secret, otpauthUrl: totpOtpauthUrl(secret, user.email), message: "Tragen Sie diesen Schlüssel in eine Authenticator-App ein und bestätigen Sie mit dem aktuellen sechsstelligen Code." });
  } catch (error) {
    return errorResponse(error);
  }
}
