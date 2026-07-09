-- Enable pg_trgm extension for trigram-based full-text search
-- Powers LIKE '%...%' and ILIKE '%...%' queries with index scans
-- instead of sequential scans across 6 large content tables.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- MCQ: question field (primary full-text search target)
CREATE INDEX IF NOT EXISTS "MCQ_question_trgm_idx"
  ON "MCQ" USING GIN ("question" gin_trgm_ops);

-- CQ: uddeepok field (passage/stem, primary full-text search target)
CREATE INDEX IF NOT EXISTS "CQ_uddeepok_trgm_idx"
  ON "CQ" USING GIN ("uddeepok" gin_trgm_ops);

-- Lecture: title field (search target)
CREATE INDEX IF NOT EXISTS "Lecture_title_trgm_idx"
  ON "Lecture" USING GIN ("title" gin_trgm_ops);

-- Suggestion: title field (search target)
CREATE INDEX IF NOT EXISTS "Suggestion_title_trgm_idx"
  ON "Suggestion" USING GIN ("title" gin_trgm_ops);

-- Notice: title and content fields (search target + full-text search)
CREATE INDEX IF NOT EXISTS "Notice_title_trgm_idx"
  ON "Notice" USING GIN ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Notice_content_trgm_idx"
  ON "Notice" USING GIN ("content" gin_trgm_ops);

-- ContentBundle: title field (search target)
CREATE INDEX IF NOT EXISTS "ContentBundle_title_trgm_idx"
  ON "ContentBundle" USING GIN ("title" gin_trgm_ops);

-- Exam: chapterIds uses contains (LIKE '%<id>%') — benefit from trigram indexing
CREATE INDEX IF NOT EXISTS "Exam_chapterIds_trgm_idx"
  ON "Exam" USING GIN ("chapterIds" gin_trgm_ops);
