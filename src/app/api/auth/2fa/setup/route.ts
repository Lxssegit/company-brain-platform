import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganizationUser } from "@/lib/auth/current-user";
import { encryptSecret, decryptSecret } from "@/lib/auth/crypto";
import { verifyPassword } from "@/lib/auth/password";
import { generateTotpSecret, totpOtpauthUrl, verifyTotp } from "@/lib/auth/totp";
import { prisma } from "@/lib/db/prisma";
import { isDevAuthUser, updateDevAuthUser } from "@/lib/auth/dev-store";
import { errorResponse } from "@/lib/http";

const reenrollSchema = z.object({ password: z.string().min(1), code: z.string().trim().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  try {
    const user = await requireOrganizationUser();

    /* Re-enrolling replaces the factor that protects this account. Without a
       re-authentication step, anyone holding a live session could call setup
       and then verify to swap the victim's second factor for their own. */
    if (user.totpEnabled) {
      const body = reenrollSchema.safeParse(await request.json().catch(() => ({})));
      if (!body.success) return NextResponse.json({ error: "Zum Einrichten eines neuen Geräts sind Passwort und aktueller Code nötig." }, { status: 422 });
      const passwordOk = Boolean(user.passwordHash) && verifyPassword(body.data.password, user.passwordHash);
      let codeOk = false;
      try {
        codeOk = Boolean(user.totpSecretEncrypted) && verifyTotp(decryptSecret(user.totpSecretEncrypted!), body.data.code);
      } catch {
        codeOk = false;
      }
      if (!passwordOk || !codeOk) return NextResponse.json({ error: "Passwort oder aktueller Zwei-Faktor-Code stimmt nicht." }, { status: 422 });
    }

    const secret = generateTotpSecret();
    const pendingSecret = encryptSecret(secret);
    if (isDevAuthUser(user)) updateDevAuthUser({ totpPendingSecretEncrypted: pendingSecret });
    else await prisma.user.update({ where: { id: user.id }, data: { totpPendingSecretEncrypted: pendingSecret } });
    return NextResponse.json({ secret, otpauthUrl: totpOtpauthUrl(secret, user.email), message: "Tragen Sie diesen Schlüssel in eine Authenticator-App ein und bestätigen Sie mit dem aktuellen sechsstelligen Code." });
  } catch (error) {
    return errorResponse(error);
  }
}
