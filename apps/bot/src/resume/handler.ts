/**
 * 자소서 작성 도우미 Slack 명령어 핸들러
 *
 * 지원 명령어:
 *   /coverletter [회사명]  — 자소서 작성 시작
 *   /analyze              — JD 분석 + 강조할 경험 추천
 *   /draft                — 자소서 초안 생성
 *   /clfeedback           — 현재 초안 피드백
 */
import type { App } from "@slack/bolt";
import { sendMessage } from "@job-assistant/shared";
import { getSupabaseClient } from "@job-assistant/shared";
import type { CoverletterQuestion } from "@job-assistant/shared";
import {
  createDraft,
  getLatestDraft,
  updateDraftContent,
  appendFeedback,
} from "./session";
import {
  buildCoverletterSystemPrompt,
  buildAnalyzePrompt,
  buildDraftPrompt,
  buildFeedbackPrompt,
} from "./prompt";

/**
 * Slack Bolt App에 자소서 작성 핸들러를 등록합니다.
 */
export function registerCoverletterHandlers(app: App): void {
  // /coverletter [회사명] — 자소서 작성 시작
  app.command("/coverletter", async ({ command, ack, respond }) => {
    await ack();

    const slackUserId = command.user_id;
    const company = command.text.trim().split(/\s+/)[0];

    if (!company) {
      await respond(
        "회사명을 입력해 주세요. 예: `/coverletter 토스`"
      );
      return;
    }

    await respond(`⏳ *${company}* 자소서 준비 중입니다...`);

    // 공고 DB에서 JD와 자소서 문항 조회
    const { jd, position, questions } = await findJobInfo(company);

    // 세션 생성
    const draft = await createDraft({ slackUserId, company, questions });

    // 시스템 프롬프트 조립 (Gemini 기업 정보 포함)
    const systemPrompt = await buildCoverletterSystemPrompt({
      company,
      jd,
      questions,
    });

    // 세션에 시스템 프롬프트 캐시 (재사용을 위해 draft에 저장하지 않고 매번 재생성)
    // 첫 안내 메시지 생성
    const intro = await sendMessage({
      systemPrompt,
      messages: [
        {
          role: "user",
          content: `${company} ${position} 포지션 자소서 작성을 시작하겠습니다. 먼저 JD를 분석해 주세요.`,
        },
      ],
    });

    const questionsText =
      questions.length > 0
        ? `\n\n*자소서 문항 ${questions.length}개 감지됨*\n${questions
            .map((q, i) => `${i + 1}. ${q.question} (${q.max_length}자)`)
            .join("\n")}`
        : "\n\n자소서 문항 없음 — 자유 형식으로 작성합니다.";

    await respond(
      `✅ *[${company}]* 자소서 작성을 시작합니다!${questionsText}\n\n${intro}\n\n> \`/analyze\` JD 분석  |  \`/draft\` 초안 생성  |  \`/clfeedback\` 피드백`
    );

    // intro를 draft의 첫 feedback으로 저장 (히스토리 추적용)
    await appendFeedback(draft, `[분석] ${intro}`).catch(console.error);
  });

  // /analyze — JD 분석 + 강조할 경험 추천
  app.command("/analyze", async ({ command, ack, respond }) => {
    await ack();

    const slackUserId = command.user_id;
    const draft = await getLatestDraft(slackUserId).catch(() => null);

    if (!draft) {
      await respond("먼저 `/coverletter 회사명` 으로 자소서 작성을 시작해 주세요.");
      return;
    }

    const { jd, position } = await findJobInfo(draft.company ?? "");
    const systemPrompt = await buildCoverletterSystemPrompt({
      company: draft.company ?? "",
      jd,
      questions: draft.questions,
    });

    const analysis = await sendMessage({
      systemPrompt,
      messages: [{ role: "user", content: buildAnalyzePrompt() }],
    });

    await appendFeedback(draft, `[분석] ${analysis}`).catch(console.error);
    await respond(`🔍 *JD 분석 결과*\n\n${analysis}`);
  });

  // /draft — 자소서 초안 생성
  app.command("/draft", async ({ command, ack, respond }) => {
    await ack();

    const slackUserId = command.user_id;
    const draft = await getLatestDraft(slackUserId).catch(() => null);

    if (!draft) {
      await respond("먼저 `/coverletter 회사명` 으로 자소서 작성을 시작해 주세요.");
      return;
    }

    await respond("⏳ 초안 생성 중입니다...");

    const { jd } = await findJobInfo(draft.company ?? "");
    const systemPrompt = await buildCoverletterSystemPrompt({
      company: draft.company ?? "",
      jd,
      questions: draft.questions,
    });

    const draftText = await sendMessage({
      systemPrompt,
      messages: [{ role: "user", content: buildDraftPrompt(draft.questions) }],
    });

    // 초안 저장 (문항 있으면 content_by_question, 없으면 content)
    if (draft.questions.length > 0) {
      await updateDraftContent(draft.id, {
        contentByQuestion: parseQuestionAnswers(draftText, draft.questions),
        version: draft.version + 1,
      });
    } else {
      await updateDraftContent(draft.id, {
        content: draftText,
        version: draft.version + 1,
      });
    }

    await respond(
      `📝 *자소서 초안 v${draft.version + 1}*\n\n${draftText}\n\n> \`/clfeedback\` 피드백 요청  |  \`/draft\` 재생성`
    );
  });

  // /clfeedback — 현재 초안 피드백 (/feedback은 Slack 기본 명령어와 충돌)
  app.command("/clfeedback", async ({ command, ack, respond }) => {
    await ack();

    const slackUserId = command.user_id;
    const draft = await getLatestDraft(slackUserId).catch(() => null);

    if (!draft) {
      await respond("먼저 `/coverletter 회사명` 으로 자소서 작성을 시작해 주세요.");
      return;
    }

    const currentContent = draft.content ?? formatContentByQuestion(draft);
    if (!currentContent) {
      await respond("초안이 없습니다. 먼저 `/draft` 로 초안을 생성해 주세요.");
      return;
    }

    const { jd } = await findJobInfo(draft.company ?? "");
    const systemPrompt = await buildCoverletterSystemPrompt({
      company: draft.company ?? "",
      jd,
      questions: draft.questions,
    });

    const feedbackText = await sendMessage({
      systemPrompt,
      messages: [
        { role: "user", content: buildFeedbackPrompt(currentContent) },
      ],
    });

    await appendFeedback(draft, feedbackText).catch(console.error);
    await respond(`💬 *피드백*\n\n${feedbackText}`);
  });
}

// ---------------------------------------------------------------------------
// 내부 유틸리티
// ---------------------------------------------------------------------------

/**
 * 회사명으로 공고 DB에서 JD, 포지션명, 자소서 문항을 조회합니다.
 */
async function findJobInfo(company: string): Promise<{
  jd: string;
  position: string;
  questions: CoverletterQuestion[];
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getSupabaseClient() as any;
  const { data } = await db
    .from("job_postings")
    .select("jd, position")
    .eq("company", company)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 기업 파일에서 자소서 문항 파싱은 추후 구현 (현재는 빈 배열 반환)
  return {
    jd: data?.jd ?? "(JD 없음)",
    position: data?.position ?? "개발자",
    questions: [],
  };
}

/**
 * 문항별 초안 텍스트를 CoverletterAnswer 배열로 파싱합니다.
 * 모델 응답이 "1. 질문\n답변" 형식이라고 가정합니다.
 */
function parseQuestionAnswers(
  text: string,
  questions: CoverletterQuestion[]
): Array<{ question: string; answer: string }> {
  // 문항 번호(1., 2. ...)로 분리
  const parts = text.split(/\n(?=\d+\.\s)/);
  return questions.map((q, i) => ({
    question: q.question,
    answer: parts[i]?.replace(/^\d+\.\s.*\n/, "").trim() ?? "",
  }));
}

/**
 * content_by_question 배열을 하나의 텍스트로 합칩니다.
 */
function formatContentByQuestion(
  draft: import("./session").CoverletterDraftRow
): string {
  if (!draft.content_by_question) return "";
  return draft.content_by_question
    .map((item, i) => `${i + 1}. ${item.question}\n${item.answer}`)
    .join("\n\n");
}
