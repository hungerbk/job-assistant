/**
 * Supabase 클라이언트 초기화 및 공통 DB 유틸리티
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { JobPosting, ExcludedJob, InterviewSession, CoverletterDraft } from "./types";

/** Supabase DB 테이블 타입 맵 */
export interface Database {
  public: {
    Tables: {
      job_postings: {
        Row: JobPosting;
        Insert: Omit<JobPosting, "id" | "created_at">;
        Update: Partial<Omit<JobPosting, "id" | "created_at">>;
      };
      excluded_jobs: {
        Row: ExcludedJob;
        Insert: Omit<ExcludedJob, "id" | "created_at">;
        Update: Partial<Omit<ExcludedJob, "id" | "created_at">>;
      };
      interview_sessions: {
        Row: InterviewSession;
        Insert: Omit<InterviewSession, "id" | "created_at">;
        Update: Partial<Omit<InterviewSession, "id" | "created_at">>;
      };
      coverletter_drafts: {
        Row: CoverletterDraft;
        Insert: Omit<CoverletterDraft, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<CoverletterDraft, "id" | "created_at">>;
      };
    };
  };
}

let client: SupabaseClient<Database> | null = null;

/**
 * Supabase 클라이언트 싱글톤을 반환합니다.
 * 환경변수 SUPABASE_URL, SUPABASE_ANON_KEY가 필요합니다.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("환경변수 SUPABASE_URL, SUPABASE_ANON_KEY가 설정되지 않았습니다.");
  }

  client = createClient<Database>(url, key);
  return client;
}

/**
 * URL 해시로 이미 수집된 공고인지 확인합니다.
 */
export async function isJobAlreadyExists(urlHash: string): Promise<boolean> {
  const db = getSupabaseClient();
  const { data, error } = await db
    .from("job_postings")
    .select("id")
    .eq("url_hash", urlHash)
    .maybeSingle();

  if (error) throw new Error(`DB 조회 오류: ${error.message}`);
  return data !== null;
}

/**
 * 제외 목록에 해당하는 공고인지 확인합니다.
 * 회사명+직군 또는 URL 해시 기준으로 확인합니다.
 */
export async function isJobExcluded(params: {
  company: string;
  jobCategory?: string;
  urlHash?: string;
}): Promise<boolean> {
  const db = getSupabaseClient();
  const { company, jobCategory, urlHash } = params;

  // URL 해시로 특정 공고 제외 여부 확인
  if (urlHash) {
    const { data } = await db
      .from("excluded_jobs")
      .select("id")
      .eq("url_hash", urlHash)
      .maybeSingle();
    if (data) return true;
  }

  // 회사명 + 직군으로 제외 여부 확인
  let query = db.from("excluded_jobs").select("id").eq("company", company);
  if (jobCategory) {
    query = query.eq("job_category", jobCategory);
  }
  const { data } = await query.maybeSingle();
  return data !== null;
}
