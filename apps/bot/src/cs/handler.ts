/**
 * CS 면접 질문 Slack 핸들러 (Gemini API 미사용)
 *
 * 지원 명령어:
 *   /cs             — 전체 카테고리 중 랜덤 질문
 *   /cs [카테고리]  — 특정 카테고리 랜덤 질문
 *   /cs 목록        — 카테고리 목록 표시
 *
 * 버튼:
 *   [답변 보기]  — 현재 질문의 답변 공개 (client.chat.update로 메시지 수정)
 *   [다음 문제]  — 같은 카테고리에서 새 질문 (client.chat.update로 메시지 수정)
 */
import type { App } from "@slack/bolt";
import {
  CS_CATEGORIES,
  CS_QUESTIONS,
  getQuestionsByCategory,
  parseCategory,
  pickRandom,
} from "./questions";
import type { CSCategory, CSQuestion } from "./questions";
import { notifyError } from "../utils/error-notify";

/** 카테고리별 이모지 */
const CATEGORY_EMOJI: Record<CSCategory, string> = {
  JavaScript: "🟡",
  TypeScript: "🔵",
  React: "⚛️",
  브라우저: "🌐",
  네트워크: "📡",
  성능최적화: "⚡",
  웹보안: "🔒",
};

/**
 * Slack Bolt App에 CS 질문 핸들러를 등록합니다.
 */
export function registerCSHandlers(app: App): void {
  // /cs [카테고리 | 목록]
  app.command("/cs", async ({ command, ack, respond }) => {
    await ack();

    const input = command.text.trim();

    // /cs 목록 — 카테고리 안내
    if (input === "목록" || input === "list") {
      const categoryList = CS_CATEGORIES.map(
        (c) => `${CATEGORY_EMOJI[c]} *${c}*`
      ).join("  |  ");

      await respond(
        `📚 *CS 질문 카테고리*\n\n${categoryList}\n\n` +
          `사용법: \`/cs\` 랜덤  |  \`/cs react\` 카테고리 지정`
      );
      return;
    }

    // 카테고리 파싱
    const category = input ? parseCategory(input) : null;

    if (input && !category) {
      const list = CS_CATEGORIES.join(", ");
      await respond(
        `❓ *"${input}"* 카테고리를 찾을 수 없습니다.\n사용 가능한 카테고리: ${list}\n\n예) \`/cs js\`, \`/cs react\`, \`/cs 브라우저\``
      );
      return;
    }

    const pool = getQuestionsByCategory(category ?? undefined);
    const question = pickRandom(pool);

    if (!question) {
      await respond("질문을 불러올 수 없습니다.");
      return;
    }

    await respond({
      blocks: buildQuestionBlocks(question),
      text: `[${question.category}] ${question.question}`,
    });
  });

  // "답변 보기" 버튼 액션
  // "답변 보기" 버튼 액션
  app.action("cs_show_answer", async ({ body, ack, client, respond }) => {
    await ack();

    try {
      const questionId = getActionValue(body);
      if (!questionId) {
        console.warn("[CS] cs_show_answer: questionId 없음");
        return;
      }

      const question = CS_QUESTIONS.find((q) => q.id === questionId);
      if (!question) {
        console.warn(`[CS] cs_show_answer: id=${questionId} 질문 없음`);
        await respond("질문을 찾을 수 없습니다.").catch(() => {});
        return;
      }

      const blocks = buildAnswerBlocks(question);
      const text = `[${question.category}] ${question.question}`;

      await updateMessage({ body, client, respond, blocks, text });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error("[CS] cs_show_answer 오류:", err);
      await notifyError("cs_show_answer", err);
      await respond(`답변을 불러오는 중 오류가 발생했습니다.\n\`${detail}\``).catch(() => {});
    }
  });

  // "다음 문제" 버튼 액션
  app.action("cs_next_question", async ({ body, ack, client, respond }) => {
    await ack();

    try {
      const value = getActionValue(body) as CSCategory | "random" | null;

      const pool = getQuestionsByCategory(
        value && value !== "random" ? value : undefined
      );
      const question = pickRandom(pool);

      if (!question) return;

      const blocks = buildQuestionBlocks(question);
      const text = `[${question.category}] ${question.question}`;

      await updateMessage({ body, client, respond, blocks, text });
    } catch (err) {
      console.error("[CS] cs_next_question 오류:", err);
      await notifyError("cs_next_question", err);
    }
  });
}

// ---------------------------------------------------------------------------
// Block Kit 빌더
// ---------------------------------------------------------------------------

/**
 * 질문 메시지 블록을 생성합니다 (답변 숨김 상태).
 */
function buildQuestionBlocks(q: CSQuestion) {
  const emoji = CATEGORY_EMOJI[q.category];
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${emoji} *[${q.category}]*\n\n*Q. ${q.question}*`,
      },
    },
    { type: "divider" },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "💡 답변 보기", emoji: true },
          action_id: "cs_show_answer",
          value: q.id,
          style: "primary",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "다음 문제 →", emoji: true },
          action_id: "cs_next_question",
          value: q.category,
        },
      ],
    },
  ];
}

/**
 * 답변 공개 메시지 블록을 생성합니다.
 */
function buildAnswerBlocks(q: CSQuestion) {
  const emoji = CATEGORY_EMOJI[q.category];
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${emoji} *[${q.category}]*\n\n*Q. ${q.question}*`,
      },
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `💡 *답변*\n\n${q.answer}`,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `🔑 핵심 키워드: ${q.keywords.map((k) => `\`${k}\``).join("  ")}`,
        },
      ],
    },
    { type: "divider" },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "다음 문제 →", emoji: true },
          action_id: "cs_next_question",
          value: q.category,
          style: "primary",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "다른 카테고리", emoji: true },
          action_id: "cs_next_question",
          value: "random",
        },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// 내부 유틸리티
// ---------------------------------------------------------------------------

type ActionBody = Parameters<Parameters<App["action"]>[1]>[0]["body"];
type ActionClient = Parameters<Parameters<App["action"]>[1]>[0]["client"];
type ActionRespond = Parameters<Parameters<App["action"]>[1]>[0]["respond"];

/**
 * 메시지를 업데이트합니다. 세 가지 방법을 순차적으로 시도합니다.
 *
 * 1. respond({ replace_original }) — ephemeral/non-ephemeral 모두 지원
 * 2. client.chat.update — respond 실패 시, channel+ts가 있는 일반 메시지용
 * 3. client.chat.postEphemeral — 위 두 방법 모두 실패 시 새 에페머럴 전송
 *
 * isEphemeral 분기 없이 순차 시도하여 body.container 구조 차이에 강건하게 동작합니다.
 */
async function updateMessage(params: {
  body: ActionBody;
  client: ActionClient;
  respond: ActionRespond;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blocks: any[];
  text: string;
}): Promise<void> {
  const { body, client, respond, blocks, text } = params;
  const channel = getChannelId(body);
  const ts = getMessageTs(body);
  const userId = (body as { user?: { id?: string } }).user?.id;

  // 1. respond(replace_original) — response_url 기반, ephemeral·non-ephemeral 공통 지원
  try {
    await respond({ replace_original: true, blocks, text });
    return;
  } catch (e) {
    console.warn("[CS] respond(replace_original) 실패:", (e as Error).message);
  }

  // 2. chat.update — 일반 메시지에서 채널·ts를 알 때
  if (channel && ts) {
    try {
      await client.chat.update({ channel, ts, blocks, text });
      return;
    } catch (e) {
      console.warn("[CS] chat.update 실패:", (e as Error).message);
    }
  }

  // 3. postEphemeral — 새 에페머럴 메시지로 폴백
  if (channel && userId) {
    await client.chat.postEphemeral({ channel, user: userId, blocks, text });
    return;
  }

  throw new Error(
    `메시지 업데이트 방법을 모두 소진했습니다 (channel=${channel}, ts=${ts}, userId=${userId})`
  );
}

function getActionValue(
  body: Parameters<Parameters<App["action"]>[1]>[0]["body"]
): string | null {
  const actions = (body as { actions?: Array<{ value?: string }> }).actions;
  return actions?.[0]?.value ?? null;
}

function getChannelId(
  body: Parameters<Parameters<App["action"]>[1]>[0]["body"]
): string | null {
  return (body as { channel?: { id?: string } }).channel?.id ?? null;
}

function getMessageTs(
  body: Parameters<Parameters<App["action"]>[1]>[0]["body"]
): string | null {
  return (body as { message?: { ts?: string } }).message?.ts ?? null;
}
