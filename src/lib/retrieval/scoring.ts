const stopWords = new Set(["der", "die", "das", "ein", "eine", "und", "oder", "für", "mit", "von", "the", "a", "an", "and", "or", "for", "with", "to", "of"]);

export function tokenize(value: string) {
  return value.toLocaleLowerCase("de-DE").split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 2 && !stopWords.has(token));
}

/** Weighted count of query terms the document actually carries; title counts double. */
export function lexicalMatches(query: string, title: string, content: string) {
  const queryTokens = [...new Set(tokenize(query))];
  if (!queryTokens.length) return 0;
  const titleTokens = new Set(tokenize(title));
  const contentTokens = new Set(tokenize(content));
  return queryTokens.reduce((total, token) => total + (titleTokens.has(token) ? 2 : contentTokens.has(token) ? 1 : 0), 0);
}

/**
 * Share of the query this document accounts for. Every candidate for one query
 * shares the same denominator, so this orders them correctly — but its absolute
 * value falls as the question gets wordier, which is why it must not be
 * compared against a fixed cutoff. Use relevanceFloor for that.
 */
export function lexicalScore(query: string, title: string, content: string) {
  const queryTokens = [...new Set(tokenize(query))];
  if (!queryTokens.length) return 0;
  return Math.min(1, lexicalMatches(query, title, content) / (queryTokens.length * 2));
}

export function retrievalThreshold() {
  const raw = process.env.RETRIEVAL_THRESHOLD?.trim();
  /* Number("") is 0, which turned an unset or blank variable into "return
     everything" rather than into the documented default. */
  if (!raw) return 0.12;
  const configured = Number(raw);
  return Number.isFinite(configured) ? Math.min(1, Math.max(0, configured)) : 0.12;
}

/**
 * The cutoff is relative to the best candidate for this query, not absolute.
 * An absolute cutoff on a length-normalised score meant the same document was
 * retrieved for "Garantiefall Serviceteam" and dropped for the same question
 * asked as a sentence.
 */
export function relevanceFloor(scores: number[]) {
  const best = Math.max(0, ...scores);
  if (best <= 0) return Number.POSITIVE_INFINITY;
  return best * retrievalThreshold();
}
