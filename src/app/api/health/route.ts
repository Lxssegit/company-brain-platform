import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * A health check that always answers "ok" is worse than none: it reports the
 * service healthy while the store behind it is down, which is the failure it
 * exists to catch. This one actually asks.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ service: "company-brain", database: "up", status: "ok" });
  } catch {
    return NextResponse.json({ service: "company-brain", database: "down", status: "degraded" }, { status: 503 });
  }
}
