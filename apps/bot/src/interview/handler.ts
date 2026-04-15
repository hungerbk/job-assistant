/**
 * 면접 연습 Slack 명령어 핸들러
 *
 * 지원 명령어:
 *   /interview [회사명]  — 면접 연습 시작
 *   /end                — 세션 종료 + 총평
 *   /hint               — 현재 질문 힌트
 *
 * 일반 메시지 — 진행 중인 세션이 있으면 답변으로 처리
 */
import type { App } from "@slack/bolt";
import { sendMessage } from "@job-assistant/shared";
import { getSupabaseClient } from "@job-assistant/shared";
import {
  createSession,
  getActiveSession,
  appendMessage,
  endSession,
} from "./session";
import {
  buildInterviewSystemPrompt,
  buildHintPrompt,
} from "./prompt";
import type { ChatMessage } from "@job-assistant/shared";

/**
 * Slack Bolt App에 면접 연습 핸들러를 등록합니다.
 */
export function registerInterviewHandlers(app: App): void {
  // /interview [회사명] 또는 /interview (공고 목록에서 선택)
  app.command("/interview", async ({ command, ack, respond }) => {
    await ack();

    const slackUserId = command.user_id;
    const rawText = command.text.trim();

    if (!rawText) {
      await respond(await buildRecentJobsMessage(slackUserId));
      return;
    }

    // "회사명 포지션명" 형태를 허용 — 첫 단어를 회사명으로 사용
    const company = rawText.split(/\s+/)[0];

    // 이미 진행 중인 세션 확인
    const existing = await getActiveSession(slackUserId).catch(() => null);
    if (existing) {
      await respond(
        `이미 *${existing.company}* 면접이 진행 중입니다.\n종료하려면 \`/end\`를 입력하세요.`
      );
      return;
    }

    // 공고 DB에서 JD 조회
    const { jd, position } = await findJobJd(company);

    // 세션 생성
    const session = await createSession({ slackUserId, company });

    // 시스템 프롬프트 조립 (Gemini 기업 정보 포함)
    await respond(`⏳ *${company}* 면접 준비 중입니다...`);
    const systemPrompt = await buildInterviewSystemPrompt({
      company,
      position,
      jd,
    });

    // 첫 질문 생성
    const firstQuestion = await sendMessage({
      systemPrompt,
      messages: [
        { role: "user", content: "면접을 시작해 주세요. 첫 질문을 해주세요." },
      ],
    });

    // 세션에 기록
    await appendMessage(session.id, "assistant", firstQuestion, []);

    await respond(
      `✅ *[${company}]* 면접을 시작합니다!\n\n${firstQuestion}\n\n> 답변을 입력하면 면접이 진행됩니다. 종료: \`/end\` | 힌트: \`/hint\``
    );
  });

  // /end — 세션 종료 + 총평
  app.command("/end", async ({ command, ack, respond }) => {
    await ack();

    const slackUserId = command.user_id;
    const session = await getActiveSession(slackUserId).catch(() => null);

    if (!session) {
      await respond("진행 중인 면접 세션이 없습니다.");
      return;
    }

    // 총평 생성
    const systemPrompt = `당신은 면접관입니다. 지금까지의 면접 내용을 바탕으로 총평을 제공해 주세요.`;
    const summaryRequest =
      "지금까지의 면접 전체에 대해 총평을 작성해 주세요. 잘한 점, 아쉬운 점, 개선 방향을 구체적으로 알려주세요.";

    const summary = await sendMessage({
      systemPrompt,
      messages: [
        ...toApiMessages(session.history),
        { role: "user", content: summaryRequest },
      ],
    });

    await endSession(session.id, summary);

    await respond(
      `🏁 *[${session.company}]* 면접이 종료되었습니다.\n\n*📝 총평*\n${summary}`
    );
  });

  // /hint — 현재 질문 힌트
  app.command("/hint", async ({ command, ack, respond }) => {
    await ack();

    const slackUserId = command.user_id;
    const session = await getActiveSession(slackUserId).catch(() => null);

    if (!session) {
      await respond("진행 중인 면접 세션이 없습니다.");
      return;
    }

    // 마지막 면접관 질문 추출
    const lastAssistantMsg = [...session.history]
      .reverse()
      .find((m) => m.role === "assistant");

    if (!lastAssistantMsg) {
      await respond("힌트를 제공할 질문이 없습니다.");
      return;
    }

    const hint = await sendMessage({
      systemPrompt: "당신은 면접 코치입니다.",
      messages: [
        { role: "user", content: buildHintPrompt(lastAssistantMsg.content) },
      ],
    });

    await respond(`💡 *힌트*\n${hint}`);
  });

  // DM/채널 일반 메시지 — 진행 중 세션이 있으면 면접 답변으로 처리
  app.message(async ({ message, say }) => {
    // bot_message, 슬래시 커맨드 등 필터링
    if (message.subtype || !("user" in message) || !message.user) return;

    const slackUserId = message.user;
    const userText = "text" in message ? (message.text ?? "") : "";
    if (!userText.trim()) return;

    const session = await getActiveSession(slackUserId).catch(() => null);
    if (!session) return; // 활성 세션 없으면 무시

    // 사용자 메시지 저장
    const history = await appendMessage(
      session.id,
      "user",
      userText,
      session.history
    );

    // 프롬프트를 다시 빌드하지 않고 저장된 히스토리로 연속 대화
    const systemPrompt = await buildInterviewSystemPrompt({
      company: session.company ?? "",
      position: "개발자",
      jd: "",
    });

    const response = await sendMessage({
      systemPrompt,
      messages: toApiMessages(history),
    });

    await appendMessage(session.id, "assistant", response, history);
    await say(response);
  });
}

// ---------------------------------------------------------------------------
// 내부 유틸리티
// ---------------------------------------------------------------------------

/**
 * ChatMessage[] → sendMessage용 messages 배열로 변환합니다.
 */
function toApiMessages(
  history: ChatMessage[]
): Array<{ role: "user" | "assistant"; content: string }> {
  return history.map((m) => ({ role: m.role, content: m.content }));
}

/**
 * 최근 알림받은 공고 목록 메시지를 생성합니다.
 * /interview 인자 없이 호출 시 사용합니다.
 */
async function buildRecentJobsMessage(slackUserId: string): Promise<string> {
  const db = getSupabaseClient();
  const { data } = await db
    .from("job_postings")
    .select("company, position, url")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .not("notified_at" as any, "is", null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq("is_excluded" as any, false)
    .order("notified_at", { ascending: false })
    .limit(5)
    .returns<Array<{ company: string; position: string; url: string }>>();

  if (!data || data.length === 0) {
    return "최근 알림받은 공고가 없습니다. `/interview 회사명` 형식으로 직접 입력해 주세요.";
  }

  const list = data
    .map((j, i) => `${i + 1}. *${j.company}* — ${j.position}`)
    .join("\n");

  return `최근 알림받은 공고 목록입니다.\n면접 연습을 시작하려면 \`/interview 회사명\`을 입력하세요.\n\n${list}`;
}

/**
 * 회사명으로 공고 DB에서 JD와 포지션명을 조회합니다.
 */
async function findJobJd(
  company: string
): Promise<{ jd: string; position: string }> {
  const db = getSupabaseClient();
  const { data } = await db
    .from("job_postings")
    .select("jd, position")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq("company" as any, company)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = data as { jd: string | null; position: string } | null;
  return {
    jd: row?.jd ?? "(JD 없음)",
    position: row?.position ?? "개발자",
  };
}
