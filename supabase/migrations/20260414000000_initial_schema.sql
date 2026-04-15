-- Job Assistant 초기 DB 스키마
-- Supabase 대시보드 > SQL Editor에서 실행하거나 supabase db push로 적용

-- ----------------------------------------------------------------
-- 채용 공고
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_postings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url          TEXT UNIQUE NOT NULL,
  url_hash     TEXT UNIQUE NOT NULL,   -- 중복 제거용 SHA-256 해시
  company      TEXT NOT NULL,
  position     TEXT NOT NULL,
  jd           TEXT,
  source       TEXT,                   -- 'wanted' | 'saramin' | 'jobkorea' | 'linkedin' | 'other'
  match_score  INTEGER,                -- AI 매칭 점수 (0~100)
  match_reasons JSONB,                 -- { match: string[], mismatch: string[] }
  is_excluded  BOOLEAN DEFAULT FALSE,
  notified_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_postings_url_hash  ON job_postings (url_hash);
CREATE INDEX IF NOT EXISTS idx_job_postings_company   ON job_postings (company);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings (created_at DESC);

-- ----------------------------------------------------------------
-- 제외 목록 (Slack "관심 없음" 버튼)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS excluded_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company      TEXT NOT NULL,
  job_category TEXT,                   -- 직군 단위 제외 (NULL이면 회사 전체)
  url_hash     TEXT,                   -- 특정 공고만 제외할 때 사용
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_excluded_jobs_company   ON excluded_jobs (company);
CREATE INDEX IF NOT EXISTS idx_excluded_jobs_url_hash  ON excluded_jobs (url_hash);

-- ----------------------------------------------------------------
-- 면접 세션
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interview_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id  UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  slack_user_id   TEXT NOT NULL,       -- Slack 사용자 ID (세션 조회용)
  company         TEXT,
  history         JSONB DEFAULT '[]',  -- [{ role, content, timestamp }]
  summary         TEXT,                -- 세션 종료 시 총평
  status          TEXT DEFAULT 'active', -- 'active' | 'ended'
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_user   ON interview_sessions (slack_user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON interview_sessions (slack_user_id, status);

-- ----------------------------------------------------------------
-- 자소서 초안
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coverletter_drafts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id       UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  slack_user_id        TEXT NOT NULL,
  company              TEXT,
  questions            JSONB DEFAULT '[]',  -- [{ question, max_length }]
  content              TEXT,               -- 자유 형식 초안
  content_by_question  JSONB,              -- [{ question, answer }]
  version              INTEGER DEFAULT 1,
  feedback             JSONB DEFAULT '[]', -- [{ content, created_at }]
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coverletter_drafts_user ON coverletter_drafts (slack_user_id);
