/**
 * 자소서 초안 세션 관리 — Supabase coverletter_drafts 테이블 CRUD
 */
import { getSupabaseClient } from "@job-assistant/shared";
import type { CoverletterQuestion, CoverletterAnswer, CoverletterFeedback } from "@job-assistant/shared";

export interface CoverletterDraftRow {
  id: string;
  job_posting_id: string | null;
  slack_user_id: string;
  company: string | null;
  questions: CoverletterQuestion[];
  content: string | null;
  content_by_question: CoverletterAnswer[] | null;
  version: number;
  feedback: CoverletterFeedback[];
  created_at: string;
  updated_at: string;
}

/**
 * 새 자소서 초안 세션을 생성합니다.
 */
export async function createDraft(params: {
  slackUserId: string;
  company: string;
  questions: CoverletterQuestion[];
  jobPostingId?: string;
}): Promise<CoverletterDraftRow> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getSupabaseClient() as any;
  const { data, error } = await db
    .from("coverletter_drafts")
    .insert({
      slack_user_id: params.slackUserId,
      company: params.company,
      job_posting_id: params.jobPostingId ?? null,
      questions: params.questions,
      version: 1,
      feedback: [],
    })
    .select()
    .single();

  if (error || !data) throw new Error(`자소서 세션 생성 실패: ${error?.message}`);
  return data as CoverletterDraftRow;
}

/**
 * 사용자의 최신 자소서 초안을 조회합니다.
 * 없으면 null을 반환합니다.
 */
export async function getLatestDraft(
  slackUserId: string,
  company?: string
): Promise<CoverletterDraftRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getSupabaseClient() as any;
  let query = db
    .from("coverletter_drafts")
    .select("*")
    .eq("slack_user_id", slackUserId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (company) query = query.eq("company", company);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`자소서 초안 조회 실패: ${error.message}`);
  return data as CoverletterDraftRow | null;
}

/**
 * 자소서 초안 내용을 업데이트하고 버전을 올립니다.
 */
export async function updateDraftContent(
  draftId: string,
  params: {
    content?: string;
    contentByQuestion?: CoverletterAnswer[];
    version?: number;
  }
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getSupabaseClient() as any;
  const { error } = await db
    .from("coverletter_drafts")
    .update({
      ...(params.content !== undefined && { content: params.content }),
      ...(params.contentByQuestion !== undefined && {
        content_by_question: params.contentByQuestion,
      }),
      ...(params.version !== undefined && { version: params.version }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId);

  if (error) throw new Error(`초안 업데이트 실패: ${error.message}`);
}

/**
 * 자소서 초안에 피드백을 추가합니다.
 */
export async function appendFeedback(
  draft: CoverletterDraftRow,
  feedbackContent: string
): Promise<void> {
  const newFeedback: CoverletterFeedback = {
    content: feedbackContent,
    created_at: new Date().toISOString(),
  };
  const updatedFeedback = [...draft.feedback, newFeedback];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getSupabaseClient() as any;
  const { error } = await db
    .from("coverletter_drafts")
    .update({ feedback: updatedFeedback, updated_at: new Date().toISOString() })
    .eq("id", draft.id);

  if (error) throw new Error(`피드백 저장 실패: ${error.message}`);
}
