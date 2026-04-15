/**
 * 면접 세션 관리 — Supabase interview_sessions 테이블 CRUD
 */
import { getSupabaseClient } from "@job-assistant/shared";
import type { ChatMessage } from "@job-assistant/shared";

export interface InterviewSessionRow {
  id: string;
  job_posting_id: string | null;
  slack_user_id: string;
  company: string | null;
  history: ChatMessage[];
  summary: string | null;
  status: "active" | "ended";
  created_at: string;
  ended_at: string | null;
}

/**
 * 새 면접 세션을 생성합니다.
 */
export async function createSession(params: {
  slackUserId: string;
  company: string;
  jobPostingId?: string;
}): Promise<InterviewSessionRow> {
  const db = getSupabaseClient();
  const { data, error } = await db
    .from("interview_sessions")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      slack_user_id: params.slackUserId,
      company: params.company,
      job_posting_id: params.jobPostingId ?? null,
      history: [],
      status: "active",
    } as any)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`세션 생성 실패: ${error?.message}`);
  }
  return data as unknown as InterviewSessionRow;
}

/**
 * 사용자의 활성 세션을 조회합니다.
 * 활성 세션이 없으면 null을 반환합니다.
 */
export async function getActiveSession(
  slackUserId: string
): Promise<InterviewSessionRow | null> {
  const db = getSupabaseClient();
  const { data, error } = await db
    .from("interview_sessions")
    .select("*")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq("slack_user_id" as any, slackUserId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq("status" as any, "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`세션 조회 실패: ${error.message}`);
  return data as unknown as InterviewSessionRow | null;
}

/**
 * 세션에 메시지를 추가하고 Supabase에 저장합니다.
 */
export async function appendMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  currentHistory: ChatMessage[]
): Promise<ChatMessage[]> {
  const newMessage: ChatMessage = {
    role,
    content,
    timestamp: new Date().toISOString(),
  };
  const updatedHistory = [...currentHistory, newMessage];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getSupabaseClient() as any;
  const { error } = await db
    .from("interview_sessions")
    .update({ history: updatedHistory })
    .eq("id", sessionId);

  if (error) throw new Error(`메시지 저장 실패: ${error.message}`);
  return updatedHistory;
}

/**
 * 세션을 종료하고 총평을 저장합니다.
 */
export async function endSession(
  sessionId: string,
  summary: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getSupabaseClient() as any;
  const { error } = await db
    .from("interview_sessions")
    .update({ status: "ended", summary, ended_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) throw new Error(`세션 종료 실패: ${error.message}`);
}
