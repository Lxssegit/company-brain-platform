import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { API_ERROR } from "@/lib/i18n/api";

/**
 * The fallback used to be 400 "Request failed" for everything unrecognised, so
 * a null dereference, a dead database and a genuine bad request all came back
 * as the caller's fault — and the real error was never written down anywhere.
 *
 * Three kinds of failure, three answers: what the caller sent wrong (422 with
 * the fields named), what the store refused (409/404), and what broke in here
 * (500, logged, with nothing internal in the body).
 */
export function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "INTERNAL_ERROR";
  if (message === "UNAUTHENTICATED") return NextResponse.json({ error: API_ERROR.unauthenticated }, { status: 401 });
  if (message === "ACCOUNT_INACTIVE") return NextResponse.json({ error: API_ERROR.accountInactive }, { status: 403 });
  if (message === "ORGANIZATION_REQUIRED") return NextResponse.json({ error: API_ERROR.organizationRequired }, { status: 403 });
  if (message.startsWith("FORBIDDEN")) return NextResponse.json({ error: API_ERROR.forbidden }, { status: 403 });
  if (message === "NOT_FOUND") return NextResponse.json({ error: API_ERROR.notFound }, { status: 404 });
  if (message === "CONFLICT") return NextResponse.json({ error: API_ERROR.conflict }, { status: 409 });

  if (error instanceof ZodError) {
    /* Name the fields. "Request failed" tells a caller nothing about which of
       twelve values it got wrong. */
    const fields = error.issues.map((issue) => issue.path.join(".")).filter(Boolean);
    return NextResponse.json({
      error: fields.length ? `Diese Angaben stimmen nicht: ${[...new Set(fields)].join(", ")}` : "Die Angaben sind unvollständig oder ungültig.",
      fields: [...new Set(fields)],
    }, { status: 422 });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return NextResponse.json({ error: "Das gibt es schon." }, { status: 409 });
    if (error.code === "P2025") return NextResponse.json({ error: API_ERROR.notFound }, { status: 404 });
    if (error.code === "P2003") return NextResponse.json({ error: API_ERROR.conflict }, { status: 409 });
  }

  /* Anything past here is a fault in this service, not in the request. It is
     logged because a 500 with no trace is a bug nobody can find, and the body
     carries nothing internal because the caller may be a stranger. */
  console.error("[api] unhandled error", error);
  return NextResponse.json({ error: "Da ist auf unserer Seite etwas schiefgegangen." }, { status: 500 });
}
