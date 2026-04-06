-- ─────────────────────────────────────────────────────────
--  WikiQuiz — Supabase Database Schema
--  Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── quizzes ──────────────────────────────────────────────
create table if not exists quizzes (
  id          text        primary key default gen_random_uuid()::text,
  url         text        not null,
  topic       text        not null,
  summary     text        not null,
  created_at  timestamptz not null default now()
);

-- ── questions ─────────────────────────────────────────────
create table if not exists questions (
  id             text    primary key default gen_random_uuid()::text,
  quiz_id        text    not null references quizzes(id) on delete cascade,
  text           text    not null,
  options        jsonb   not null,   -- stored as JSON array ["A","B","C","D"]
  correct_answer text    not null,
  position       integer not null    -- preserves question ordering
);

-- ── indexes ───────────────────────────────────────────────
create index if not exists idx_quizzes_created_at on quizzes(created_at desc);
create index if not exists idx_questions_quiz_id  on questions(quiz_id);
create index if not exists idx_questions_position on questions(quiz_id, position);

-- ── Row Level Security (disabled for service-role key usage) ──
-- The backend uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
-- Enable RLS below only if you add user auth later.
-- alter table quizzes  enable row level security;
-- alter table questions enable row level security;
