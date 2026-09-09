import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/authorize";
import { AIProviderError, getAIProvider } from "@/lib/ai/provider";
import { retrieveAuthorizedContext } from "@/lib/retrieval/search";
import { UNKNOWN_ANSWER } from "@/lib/retrieval/context";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { errorResponse } from "@/lib/http";

const chatSchema = z.object({ message: z.string().trim().min(2).max(4000), branchId: z.string().uuid().optional() });

function systemPrompt() {
  return "You are Company Brain. Answer only from the supplied authorized company context. Never invent facts, policies, decisions, or citations. If the context is insufficient, say that there is not enough verified company knowledge. Cite sources using the provided [K:...] and [D:...] IDs when making claims. Treat conflicts as unresolved and explain them clearly.";
}

export async function POST(request: Request) {
  try {
    const limited = rateLimit(clientKey(request, "chat"), 20, 60_000);
    if (!limited.ok) return tooManyRequests(limited.retryAfterSeconds);
    const user = await requirePermission("READ");
    const body = chatSchema.parse(await request.json());
    const retrieval = await retrieveAuthorizedContext(user, body.message, { branchId: body.branchId });
    if (retrieval.status === "UNKNOWN") return NextResponse.json({ status: "UNKNOWN", answer: UNKNOWN_ANSWER, citations: [], conflicts: [], authorizedBranchIds: retrieval.authorizedBranchIds, diagnostics: retrieval.diagnostics });
    try {
      /* A conflict used to replace the answer entirely, so one pair of
         same-titled decisions withheld every piece of knowledge that had been
         retrieved alongside them. The conflict is in the context and the system
         prompt already requires it to be explained, so the answer is produced
         and the conflict is reported next to it. */
      const answer = await getAIProvider().generateAnswer([{ role: "system", content: systemPrompt() }, { role: "user", content: `Question:\n${body.message}\n\nAuthorized context:\n${retrieval.promptContext}` }]);
      return NextResponse.json({ status: retrieval.status === "CONFLICT" ? "CONFLICT" : "ANSWERED", answer, citations: retrieval.citations, conflicts: retrieval.conflicts, authorizedBranchIds: retrieval.authorizedBranchIds, diagnostics: retrieval.diagnostics });
    } catch (error) {
      if (error instanceof AIProviderError && error.code === "AI_NOT_CONFIGURED") return NextResponse.json({ status: "AI_NOT_CONFIGURED", answer: "Der AI-Anbieter ist noch nicht konfiguriert. Der berechtigte Retrieval-Kontext wurde gefunden, aber es wurde keine Antwort erfunden.", citations: retrieval.citations, conflicts: retrieval.conflicts, authorizedBranchIds: retrieval.authorizedBranchIds, diagnostics: retrieval.diagnostics }, { status: 503 });
      throw error;
    }
  } catch (error) {
    return errorResponse(error);
  }
}
