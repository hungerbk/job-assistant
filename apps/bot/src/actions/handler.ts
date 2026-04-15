/**
 * 공고 알림 Slack 버튼 액션 핸들러
 *
 * 크롤러가 발송한 알림 메시지의 버튼 클릭 시 실행됩니다.
 *
 * 버튼 action_id 목록:
 *   exclude_job       — "관심 없음": excluded_jobs에 추가
 *   start_interview   — "면접 연습": 해당 공고 JD로 면접 세션 시작
 *   start_coverletter — "자소서 작성": 해당 공고 JD로 자소서 세션 시작
 *
 * 버튼 value: 공고 URL (공고를 특정하는 키)
 */
import type { App } from "@slack/bolt";
import { createHash } from "crypto";
import { getSupabaseClient, sendMessage } from "@job-assistant/shared";
import { createSession, getActiveSession, appendMessage } from "../interview/session";
import { buildInterviewSystemPrompt } from "../interview/prompt";
import { createDraft } from "../resume/session";
import { buildCoverletterSystemPrompt } from "../resume/prompt";
import type { CoverletterQuestion } from "@job-assistant/shared";

/**
 * Slack Bolt App에 버튼 액션 핸들러를 등록합니다.
 */
export function registerActionHandlers(app: App): void {
  // "관심 없음" 버튼
  app.action("exclude_job", async ({ body, ack, respond }) => {
    await ack();

    const slackUserId = body.user.id;
    const jobUrl = getActionValue(body);
    if (!jobUrl) {
      await respond("공고 URL을 찾을 수 없습니다.");
      return;
    }

    const urlHash = createHash("sha256").update(jobUrl).digest("hex");
    const { company, jobCategory } = await findJobMeta(jobUrl);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getSupabaseClient() as any;
    await db.from("excluded_jobs").insert({
      company,
      job_category: jobCategory,
      url_hash: urlHash,
    });

    // job_postings 테이블의 is_excluded 플래그도 업데이트
    await db
      .from("job_postings")
      .update({ is_excluded: true })
      .eq("url_hash", urlHash);

    await respond(`🚫 *${company}* 공고를 제외 목록에 추가했습니다. 이후 동일 공고는 알림을 보내지 않습니다.`);
  });

  // "면접 연습" 버튼
  app.action("start_interview", async ({ body, ack, respond }) => {
    await ack();

    const slackUserId = body.user.id;
    const jobUrl = getActionValue(body);
    if (!jobUrl) {
      await respond("공고 URL을 찾을 수 없습니다.");
      return;
    }

    // 이미 진행 중인 세션 확인
    const existing = await getActiveSession(slackUserId).catch(() => null);
    if (existing) {
      await respond(
        `이미 *${existing.company}* 면접이 진행 중입니다.\n종료하려면 \`/end\`를 입력하세요.`
      );
      return;
    }

    const { company, position, jd, jobPostingId } = await findJobDetail(jobUrl);

    await respond(`⏳ *${company}* 면접 준비 중입니다...`);

    const session = await createSession({ slackUserId, company, jobPostingId });

    const systemPrompt = await buildInterviewSystemPrompt({ company, position, jd });

    const firstQuestion = await sendMessage({
      systemPrompt,
      messages: [{ role: "user", content: "면접을 시작해 주세요. 첫 질문을 해주세요." }],
    });

    await appendMessage(session.id, "assistant", firstQuestion, []);

    await respond(
      `✅ *[${company}]* 면접을 시작합니다!\n\n${firstQuestion}\n\n> 답변을 입력하면 면접이 진행됩니다. 종료: \`/end\` | 힌트: \`/hint\``
    );
  });

  // "자소서 작성" 버튼
  app.action("start_coverletter", async ({ body, ack, respond }) => {
    await ack();

    const slackUserId = body.user.id;
    const jobUrl = getActionValue(body);
    if (!jobUrl) {
      await respond("공고 URL을 찾을 수 없습니다.");
      return;
    }

    const { company, position, jd, jobPostingId } = await findJobDetail(jobUrl);
    const questions: CoverletterQuestion[] = []; // 기업 파일에서 파싱은 추후 구현

    await respond(`⏳ *${company}* 자소서 준비 중입니다...`);

    const draft = await createDraft({ slackUserId, company, questions, jobPostingId });

    const systemPrompt = await buildCoverletterSystemPrompt({ company, jd, questions });

    const intro = await sendMessage({
      systemPrompt,
      messages: [{
        role: "user",
        content: `${company} ${position} 포지션 자소서 작성을 시작하겠습니다. JD를 분석해 주세요.`,
      }],
    });

    await respond(
      `✅ *[${company}]* 자소서 작성을 시작합니다!\n\n${intro}\n\n> \`/analyze\` JD 분석  |  \`/draft\` 초안 생성  |  \`/clfeedback\` 피드백`
    );
  });
}

// ---------------------------------------------------------------------------
// 내부 유틸리티
// ---------------------------------------------------------------------------

/**
 * Slack actions body에서 버튼 value(공고 URL)를 추출합니다.
 */
function getActionValue(body: Parameters<Parameters<App["action"]>[1]>[0]["body"]): string | null {
  const actions = (body as { actions?: Array<{ value?: string }> }).actions;
  return actions?.[0]?.value ?? null;
}

/**
 * 공고 URL로 DB에서 회사명, 직군을 조회합니다.
 */
async function findJobMeta(url: string): Promise<{
  company: string;
  jobCategory: string;
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getSupabaseClient() as any;
  const { data } = await db
    .from("job_postings")
    .select("company, position")
    .eq("url", url)
    .maybeSingle();

  return {
    company: data?.company ?? "알 수 없음",
    jobCategory: process.env.MY_JOB_CATEGORY ?? data?.position ?? "개발자",
  };
}

/**
 * 공고 URL로 DB에서 JD, 포지션명, id를 조회합니다.
 */
async function findJobDetail(url: string): Promise<{
  company: string;
  position: string;
  jd: string;
  jobPostingId: string | undefined;
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getSupabaseClient() as any;
  const { data } = await db
    .from("job_postings")
    .select("id, company, position, jd")
    .eq("url", url)
    .maybeSingle();

  return {
    company: data?.company ?? "알 수 없음",
    position: data?.position ?? "개발자",
    jd: data?.jd ?? "(JD 없음)",
    jobPostingId: data?.id ?? undefined,
  };
}
