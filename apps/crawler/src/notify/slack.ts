/**
 * Slack Webhook 공고 알림 발송 모듈
 *
 * 알림 포맷 (design.md 기준):
 * 📌 [회사명] 포지션명
 * 매칭 점수: 85점
 * ✅ 매칭: React, TypeScript 모두 요구 / 스타트업 / 연봉 범위 적합
 * ❌ 미스매치: 없음
 * 🔗 <공고 URL|공고 바로가기>
 * [관심 없음] [면접 연습] [자소서 작성]
 */
import type { MatchResult } from "@job-assistant/shared";
import type { RawJobPosting } from "../crawlers/types";

/** Slack Block Kit 타입 (최소 정의) */
interface SlackBlock {
  type: string;
  text?: { type: string; text: string };
  elements?: Array<{ type: string; text?: { type: string; text: string }; value?: string; action_id?: string }>;
}

interface SlackPayload {
  blocks: SlackBlock[];
  text: string; // 알림 미리보기용 폴백 텍스트
}

/**
 * 공고 알림 Slack 메시지를 발송합니다.
 * 환경변수 SLACK_WEBHOOK_URL이 필요합니다.
 */
export async function sendSlackNotification(
  job: RawJobPosting,
  match: MatchResult
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("환경변수 SLACK_WEBHOOK_URL이 설정되지 않았습니다.");
  }

  const payload = buildSlackPayload(job, match);

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack 알림 발송 실패: ${response.status} ${response.statusText}`);
  }
}

/**
 * Slack Block Kit 메시지 페이로드를 생성합니다.
 */
function buildSlackPayload(job: RawJobPosting, match: MatchResult): SlackPayload {
  const matchList =
    match.match_reasons.length > 0
      ? match.match_reasons.join(" / ")
      : "없음";

  const mismatchList =
    match.mismatch_reasons.length > 0
      ? match.mismatch_reasons.join(" / ")
      : "없음";

  return {
    text: `📌 [${job.company}] ${job.position} — 매칭 점수: ${match.score}점`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: [
            `📌 *[${job.company}]* ${job.position}`,
            `매칭 점수: *${match.score}점*`,
            `✅ 매칭: ${matchList}`,
            `❌ 미스매치: ${mismatchList}`,
            `🔗 <${job.url}|공고 바로가기>`,
          ].join("\n"),
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "관심 없음" },
            value: job.url,
            action_id: "exclude_job",
          },
          {
            type: "button",
            text: { type: "plain_text", text: "면접 연습" },
            value: job.url,
            action_id: "start_interview",
          },
          {
            type: "button",
            text: { type: "plain_text", text: "자소서 작성" },
            value: job.url,
            action_id: "start_coverletter",
          },
        ],
      },
    ],
  };
}
