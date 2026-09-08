import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ service: "company-brain", phase: 6, status: "ok" });
}
