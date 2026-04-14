/**
 * 프로젝트 전체에서 공유하는 공통 타입 정의
 */

/** 채용 공고 */
export interface JobPosting {
  id: string;
  url: string;
  url_hash: string;
  company: string;
  position: string;
  jd: string | null;
  source: JobSource;
  match_score: number | null;
  match_reasons: MatchReasons | null;
  is_excluded: boolean;
  notified_at: string | null;
  created_at: string;
}

/** 공고 출처 */
export type JobSource = "wanted" | "saramin" | "jobkorea" | "linkedin" | "other";

/** AI 매칭 결과 */
export interface MatchReasons {
  match: string[];
  mismatch: string[];
}

/** AI 매칭 점수 계산 결과 (Claude API 응답) */
export interface MatchResult {
  score: number;
  match_reasons: string[];
  mismatch_reasons: string[];
  send: boolean;
}

/** 제외 목록 */
export interface ExcludedJob {
  id: string;
  company: string;
  job_category: string | null;
  url_hash: string | null;
  created_at: string;
}

/** 면접 세션 */
export interface InterviewSession {
  id: string;
  job_posting_id: string | null;
  company: string | null;
  history: ChatMessage[];
  summary: string | null;
  status: "active" | "ended";
  created_at: string;
  ended_at: string | null;
}

/** 채팅 메시지 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

/** 자소서 초안 */
export interface CoverletterDraft {
  id: string;
  job_posting_id: string | null;
  company: string | null;
  questions: CoverletterQuestion[];
  content: string | null;
  content_by_question: CoverletterAnswer[] | null;
  version: number;
  feedback: CoverletterFeedback[];
  created_at: string;
  updated_at: string;
}

/** 자소서 문항 */
export interface CoverletterQuestion {
  question: string;
  max_length: number;
}

/** 자소서 문항별 답변 */
export interface CoverletterAnswer {
  question: string;
  answer: string;
}

/** 자소서 피드백 */
export interface CoverletterFeedback {
  content: string;
  created_at: string;
}

/** Gemini 기업 정보 조회 결과 */
export interface CompanyInfo {
  talent_values: {
    summary: string;
    source_url: string;
  } | null;
  recent_news: Array<{
    title: string;
    summary: string;
    date: string;
    source_url: string;
  }>;
  business_focus: {
    summary: string;
    source_url: string;
  } | null;
}
