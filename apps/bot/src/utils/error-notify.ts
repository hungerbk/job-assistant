/**
 * Slack 에러 알림 유틸리티
 *
 * Bot에서 발생한 오류를 Slack으로 전송합니다.
 * SLACK_WEBHOOK_URL을 사용하므로 별도 설정 없이 동작합니다.
 */

/**
 * 에러를 Slack 웹훅으로 전송합니다.
 * SLACK_WEBHOOK_URL이 없으면 콘솔 출력만 합니다.
 *
 * @param context 어디서 발생했는지 (예: "cs_show_answer", "/interview")
 * @param error   발생한 에러 또는 메시지
 */
export async function notifyError(
  context: string,
  error: unknown
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  const message =
    error instanceof Error
      ? `${error.message}${error.stack ? `\n${error.stack.split("\n").slice(1, 4).join("\n")}` : ""}`
      : String(error);

  console.error(`[Bot 오류] ${context}:`, error);

  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🚨 *Bot 오류* \`${context}\``,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `🚨 *Bot 오류* — \`${context}\`\n\`\`\`${message.slice(0, 2800)}\`\`\``,
            },
          },
        ],
      }),
    });
  } catch (webhookErr) {
    // 웹훅 전송 자체가 실패해도 앱이 죽지 않도록 에러를 삼킴
    console.error("[error-notify] 웹훅 전송 실패:", webhookErr);
  }
}
