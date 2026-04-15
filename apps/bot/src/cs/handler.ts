/**
 * CS 면접 질문 Slack 핸들러 (Gemini API 미사용)
 *
 * 지원 명령어:
 *   /cs             — 전체 카테고리 중 랜덤 질문
 *   /cs [카테고리]  — 특정 카테고리 랜덤 질문
 *   /cs 목록        — 카테고리 목록 표시
 *
 * 버튼:
 *   [답변 보기]  — 현재 질문의 답변 공개 (메시지 업데이트)
 *   [다음 문제]  — 같은 카테고리에서 새 질문 (메시지 업데이트)
 */
import type { App } from "@slack/bolt";
import {
  CS_CATEGORIES,
  getQuestionsByCategory,
  parseCategory,
  pickRandom,
} from "./questions";
import type { CSCategory, CSQuestion } from "./questions";

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
  app.action("cs_show_answer", async ({ body, ack, respond }) => {
    await ack();

    const questionId = getActionValue(body);
    if (!questionId) return;

    const question = CS_QUESTIONS.find((q) => q.id === questionId);
    if (!question) return;

    await respond({
      replace_original: true,
      blocks: buildAnswerBlocks(question),
      text: `[${question.category}] ${question.question}`,
    });
  });

  // "다음 문제" 버튼 액션
  app.action("cs_next_question", async ({ body, ack, respond }) => {
    await ack();

    const category = getActionValue(body) as CSCategory | "random" | null;

    const pool = getQuestionsByCategory(
      category && category !== "random" ? category : undefined
    );
    const question = pickRandom(pool);

    if (!question) return;

    await respond({
      replace_original: true,
      blocks: buildQuestionBlocks(question),
      text: `[${question.category}] ${question.question}`,
    });
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

import { CS_QUESTIONS } from "./questions";

function getActionValue(
  body: Parameters<Parameters<App["action"]>[1]>[0]["body"]
): string | null {
  const actions = (body as { actions?: Array<{ value?: string }> }).actions;
  return actions?.[0]?.value ?? null;
}
