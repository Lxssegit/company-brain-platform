import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/authorize";
import { retrieveAuthorizedContext } from "@/lib/retrieval/search";
import { errorResponse } from "@/lib/http";

const querySchema = z.object({ q: z.string().trim().min(2).max(1000), branchId: z.string().uuid().optional(), limit: z.coerce.number().int().min(1).max(20).optional() });

export async function GET(request: Request) {
  try {
    const user = await requirePermission("READ");
    const url = new URL(request.url);
    const query = querySchema.parse({ q: url.searchParams.get("q") ?? "", branchId: url.searchParams.get("branchId") ?? undefined, limit: url.searchParams.get("limit") ?? undefined });
    return NextResponse.json(await retrieveAuthorizedContext(user, query.q, { branchId: query.branchId, limit: query.limit }));
  } catch (error) {
    return errorResponse(error);
  }
}
