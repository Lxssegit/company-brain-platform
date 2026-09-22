import { createServer, type Server } from "node:http";
import { createHash } from "node:crypto";

/**
 * A stand-in for the embedding provider, so the vector half of retrieval can be
 * exercised without an OpenAI key.
 *
 * It is deliberately not random. Each word lights a fixed handful of dimensions,
 * so two texts that share words end up close together and cosine distance means
 * something. What is under test is this project's SQL, its permission predicate
 * and its fusion of the two candidate sets — not the provider.
 */
const DIMENSIONS = 1536;
const SLOTS_PER_WORD = 8;

export function deterministicEmbedding(text: string): number[] {
  const vector = new Float64Array(DIMENSIONS);
  const words = text.toLowerCase().normalize("NFKD").replace(/[^a-zäöüß0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 2);
  for (const word of words) {
    const digest = createHash("sha256").update(word).digest();
    for (let i = 0; i < SLOTS_PER_WORD; i += 1) {
      vector[digest.readUInt16BE(i * 2) % DIMENSIONS] += digest[16 + i] % 2 === 0 ? 1 : -1;
    }
  }
  let norm = 0;
  for (const value of vector) norm += value * value;
  norm = Math.sqrt(norm) || 1;
  return Array.from(vector, (value) => value / norm);
}

export type EmbeddingDouble = { baseUrl: string; close: () => Promise<void> };

/** Speaks enough of the OpenAI shape for src/lib/ai/provider.ts to use it. */
export async function startEmbeddingDouble(): Promise<EmbeddingDouble> {
  const server: Server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      response.setHeader("content-type", "application/json");
      const payload = body ? JSON.parse(body) as { input?: string | string[] } : {};
      if (request.url?.endsWith("/embeddings")) {
        const input = Array.isArray(payload.input) ? payload.input : [payload.input ?? ""];
        response.end(JSON.stringify({ data: input.map((text, index) => ({ index, embedding: deterministicEmbedding(String(text)) })) }));
        return;
      }
      if (request.url?.endsWith("/chat/completions")) {
        response.end(JSON.stringify({ choices: [{ message: { content: "Antwort aus dem Testdouble." } }] }));
        return;
      }
      response.statusCode = 404;
      response.end(JSON.stringify({ error: "unknown route" }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("embedding double did not bind a port");
  return {
    baseUrl: `http://127.0.0.1:${address.port}/v1`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}
