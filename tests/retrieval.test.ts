import { describe, expect, it } from "vitest";
import { lexicalMatches, lexicalScore, relevanceFloor, retrievalThreshold } from "@/lib/retrieval/scoring";

const doc = { title: "Garantie", content: "Der Garantiefall wird vom Serviceteam bearbeitet." };
const noise = { title: "Urlaubsantrag", content: "Urlaub wird über das Personalportal beantragt." };

const retrieved = (query: string) => {
  const candidates = [doc, noise]
    .map((item) => ({ item, score: lexicalScore(query, item.title, item.content), matches: lexicalMatches(query, item.title, item.content) }))
    .filter((candidate) => candidate.matches > 0);
  const floor = relevanceFloor(candidates.map((candidate) => candidate.score));
  return candidates.filter((candidate) => candidate.score >= floor).map((candidate) => candidate.item.title);
};

describe("retrieval scoring", () => {
  it("retrieves the same document whether the question is keywords or a sentence", () => {
    expect(retrieved("Garantiefall Serviceteam")).toEqual(["Garantie"]);
    expect(retrieved("Wie genau laeuft bei uns eigentlich der Garantiefall im Serviceteam ab")).toEqual(["Garantie"]);
  });

  it("still keeps a document that shares no term out of the context", () => {
    expect(retrieved("Garantiefall")).not.toContain("Urlaubsantrag");
    expect(lexicalMatches("Garantiefall", noise.title, noise.content)).toBe(0);
  });

  it("ranks a title hit above a body hit", () => {
    expect(lexicalMatches("Garantie", doc.title, doc.content)).toBe(2);
    expect(lexicalMatches("Serviceteam", doc.title, doc.content)).toBe(1);
  });

  it("returns nothing at all when no candidate matches", () => {
    expect(relevanceFloor([])).toBe(Number.POSITIVE_INFINITY);
    expect(relevanceFloor([0, 0])).toBe(Number.POSITIVE_INFINITY);
  });

  it("treats a blank threshold variable as the default, not as zero", () => {
    process.env.RETRIEVAL_THRESHOLD = "";
    expect(retrievalThreshold()).toBe(0.12);
    process.env.RETRIEVAL_THRESHOLD = "   ";
    expect(retrievalThreshold()).toBe(0.12);
    process.env.RETRIEVAL_THRESHOLD = "0.4";
    expect(retrievalThreshold()).toBe(0.4);
    delete process.env.RETRIEVAL_THRESHOLD;
    expect(retrievalThreshold()).toBe(0.12);
  });
});
