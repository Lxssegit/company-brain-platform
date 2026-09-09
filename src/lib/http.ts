import { NextResponse } from "next/server";

export function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "INTERNAL_ERROR";
  if (message === "UNAUTHENTICATED") return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (message === "ACCOUNT_INACTIVE") return NextResponse.json({ error: "Account is not active" }, { status: 403 });
  if (message === "ORGANIZATION_REQUIRED") return NextResponse.json({ error: "Organization required" }, { status: 403 });
  if (message.startsWith("FORBIDDEN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ error: "Request failed" }, { status: 400 });
}
