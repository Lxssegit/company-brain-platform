-- Candidate selection for retrieval runs in the database now, so the expression
-- it filters on needs an index. Without this every question sequentially scans
-- KnowledgeUnit, which is exactly what the vector index already avoids.
CREATE INDEX IF NOT EXISTS "KnowledgeUnit_fulltext_de_idx"
  ON "KnowledgeUnit"
  USING gin (to_tsvector('german', "title" || ' ' || "content"));
