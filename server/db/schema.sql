-- Run this once to set up your PostgreSQL database

CREATE TABLE IF NOT EXISTS questions (
    id          SERIAL PRIMARY KEY,
    query       TEXT NOT NULL,
    answer      TEXT NOT NULL,
    query_type  VARCHAR(20),              -- 'search' or 'direct'
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS corrections (
    id              SERIAL PRIMARY KEY,
    query           TEXT NOT NULL,        -- The original question
    original_answer TEXT NOT NULL,        -- What the agent said
    correct_answer  TEXT NOT NULL,        -- What the user says is right
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Index for fast similarity lookups when doing RAG
CREATE INDEX IF NOT EXISTS idx_corrections_query ON corrections USING gin(to_tsvector('english', query));
CREATE INDEX IF NOT EXISTS idx_questions_query   ON questions   USING gin(to_tsvector('english', query));
