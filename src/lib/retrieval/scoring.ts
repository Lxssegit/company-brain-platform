const stopWords = new Set(["der", "die", "das", "ein", "eine", "und", "oder", "für", "mit", "von", "the", "a", "an", "and", "or", "for", "with", "to", "of"]);

export function tokenize(value: string) {
  return value.toLocaleLowerCase("de-DE").split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 2 && !stopWords.has(token));
}

export function lexicalScore(query: string, title: string, content: string) {
  const queryTokens = [...new Set(tokenize(query))];
  if (!queryTokens.length) return 0;
  const titleTokens = new Set(tokenize(title));
  const contentTokens = new Set(tokenize(content));
  const matches = queryTokens.reduce((total, token) => total + (titleTokens.has(token) ? 2 : contentTokens.has(token) ? 1 : 0), 0);
  return Math.min(1, matches / (queryTokens.length * 2));
}

export function retrievalThreshold() {
  const configured = Number(process.env.RETRIEVAL_THRESHOLD ?? "0.12");
  return Number.isFinite(configured) ? Math.min(1, Math.max(0, configured)) : 0.12;
}
