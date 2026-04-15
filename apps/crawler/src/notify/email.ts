/**
 * SendGrid 이메일 공고 알림 발송 모듈
 *
 * 환경변수:
 *   SENDGRID_API_KEY  — SendGrid API 키
 *   EMAIL_FROM        — 발신자 이메일
 *   EMAIL_TO          — 수신자 이메일 (미설정 시 EMAIL_FROM과 동일)
 */
import type { MatchResult } from "@job-assistant/shared";
import type { RawJobPosting } from "../crawlers/types";

/**
 * 공고 알림 이메일을 발송합니다.
 */
export async function sendEmailNotification(
  job: RawJobPosting,
  match: MatchResult
): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error(
      "환경변수 SENDGRID_API_KEY, EMAIL_FROM이 설정되지 않았습니다."
    );
  }

  const to = process.env.EMAIL_TO ?? from;
  const subject = `[취업 알림] [${job.company}] ${job.position} — ${match.score}점`;
  const html = buildEmailHtml(job, match);

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });

  // SendGrid는 성공 시 202 반환
  if (response.status !== 202) {
    throw new Error(`이메일 발송 실패: ${response.status} ${response.statusText}`);
  }
}

/**
 * HTML 특수문자를 이스케이프합니다.
 * 외부 데이터(크롤링 결과, AI 응답)를 HTML에 삽입할 때 XSS를 방지합니다.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 이메일 본문 HTML을 생성합니다.
 */
function buildEmailHtml(job: RawJobPosting, match: MatchResult): string {
  const matchList =
    match.match_reasons.length > 0
      ? match.match_reasons.map((r: string) => `<li>${escapeHtml(r)}</li>`).join("")
      : "<li>없음</li>";

  const mismatchList =
    match.mismatch_reasons.length > 0
      ? match.mismatch_reasons.map((r: string) => `<li>${escapeHtml(r)}</li>`).join("")
      : "<li>없음</li>";

  const company = escapeHtml(job.company);
  const position = escapeHtml(job.position);
  const url = escapeHtml(job.url);

  return `
<h2>📌 [${company}] ${position}</h2>
<p><strong>매칭 점수: ${match.score}점</strong></p>

<h3>✅ 매칭 이유</h3>
<ul>${matchList}</ul>

<h3>❌ 미스매치</h3>
<ul>${mismatchList}</ul>

<p><a href="${url}">공고 바로가기</a></p>
`.trim();
}
