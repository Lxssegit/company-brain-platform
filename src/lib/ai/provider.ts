export type AIMessage = {
  role: "system" | "user";
  content: string;
};

export type AIProvider = {
  generateEmbedding(input: string): Promise<number[]>;
  generateAnswer(messages: AIMessage[]): Promise<string>;
};

export class AIProviderError extends Error {
  constructor(public readonly code: "AI_NOT_CONFIGURED" | "AI_REQUEST_FAILED" | "AI_INVALID_RESPONSE", message: string) {
    super(message);
    this.name = "AIProviderError";
  }
}

class OpenAIProvider implements AIProvider {
  private readonly apiKey: string;
  private readonly baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  private readonly chatModel = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
  private readonly embeddingModel = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request(path: string, body: Record<string, unknown>) {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
    } catch {
      throw new AIProviderError("AI_REQUEST_FAILED", "AI provider request failed");
    }
    if (!response.ok) throw new AIProviderError("AI_REQUEST_FAILED", `AI provider returned ${response.status}`);
    try {
      return await response.json() as Record<string, unknown>;
    } catch {
      throw new AIProviderError("AI_INVALID_RESPONSE", "AI provider returned invalid JSON");
    }
  }

  async generateEmbedding(input: string) {
    const payload = await this.request("/embeddings", { model: this.embeddingModel, input });
    const data = payload.data;
    const embedding = Array.isArray(data) && data[0] && typeof data[0] === "object" && data[0] !== null && "embedding" in data[0] ? data[0].embedding : null;
    if (!Array.isArray(embedding) || embedding.some((value) => typeof value !== "number")) throw new AIProviderError("AI_INVALID_RESPONSE", "AI provider returned no embedding");
    return embedding as number[];
  }

  async generateAnswer(messages: AIMessage[]) {
    const payload = await this.request("/chat/completions", { model: this.chatModel, temperature: 0, messages });
    const choices = payload.choices;
    const message = Array.isArray(choices) && choices[0] && typeof choices[0] === "object" && choices[0] !== null && "message" in choices[0] ? choices[0].message : null;
    const content = message && typeof message === "object" && message !== null && "content" in message ? message.content : null;
    if (typeof content !== "string" || !content.trim()) throw new AIProviderError("AI_INVALID_RESPONSE", "AI provider returned no answer");
    return content.trim();
  }
}

class UnavailableAIProvider implements AIProvider {
  async generateEmbedding(_input: string): Promise<number[]> {
    throw new AIProviderError("AI_NOT_CONFIGURED", "OPENAI_API_KEY is not configured");
  }

  async generateAnswer(_messages: AIMessage[]): Promise<string> {
    throw new AIProviderError("AI_NOT_CONFIGURED", "OPENAI_API_KEY is not configured");
  }
}

export function getAIProvider(): AIProvider {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  return apiKey ? new OpenAIProvider(apiKey) : new UnavailableAIProvider();
}
