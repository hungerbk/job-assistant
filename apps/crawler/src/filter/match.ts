/**
 * Gemini API를 이용한 공고-프로필 매칭 점수 계산
 *
 * @ai-provider Gemini API (gemini-2.0-flash)
 * @ai-change-point 다른 AI로 교체 시: packages/shared/gemini.ts의 sendMessage와
 *   이 함수의 프롬프트 구성, parseJsonResponse 호출 부분을 함께 수정할 것
 */
import { readFileSync } from "fs";
import { join } from "path";
import { sendMessage, parseJsonResponse } from "@job-assistant/shared";
import type { MatchResult } from "@job-assistant/shared";
import type { RawJobPosting } from "../crawlers/types";

/** profile.md 경로 (프로젝트 루트 기준) */
const PROFILE_PATH = join(__dirname, "../../../../profile/profile.md");

/**
 * profile.md 파일을 읽어 반환합니다.
 * 파일이 없으면 profile.example.md를 폴백으로 사용합니다.
 */
function loadProfile(): string {
  try {
    return readFileSync(PROFILE_PATH, "utf-8");
  } catch {
    const examplePath = join(__dirname, "../../../../profile/profile.example.md");
    return readFileSync(examplePath, "utf-8");
  }
}

/**
 * 채용 공고와 내 프로필의 매칭 점수를 계산합니다.
 * 점수가 MATCH_SCORE_THRESHOLD 이상이면 send=true를 반환합니다.
 *
 * @ai-provider Gemini API (gemini-2.0-flash)
 * @ai-change-point 다른 AI로 교체 시: packages/shared/gemini.ts의 sendMessage와
 *   이 함수의 모델명, 응답 파싱 로직을 함께 수정할 것
 */
export async function calculateMatchScore(job: RawJobPosting): Promise<MatchResult> {
  const profile = loadProfile();
  const threshold = Number(process.env.MATCH_SCORE_THRESHOLD ?? 70);

  const systemPrompt = "당신은 채용 공고 매칭 전문가입니다.";

  const userMessage = `[내 프로필]
${profile}

[채용 공고]
회사: ${job.company}
포지션: ${job.position}
JD: ${job.jd ?? "상세 내용 없음"}

아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.
{
  "score": 0~100,
  "match_reasons": ["이유1", "이유2"],
  "mismatch_reasons": ["이유1"],
  "send": true or false
}

send는 score가 ${threshold} 이상일 때 true입니다.`;

  return retryOnQuotaError(() =>
    sendMessage({ systemPrompt, messages: [{ role: "user", content: userMessage }] })
      .then((text) => parseJsonResponse<MatchResult>(text))
  );
}

/**
 * Gemini 429 (quota exceeded) 시 에러 메시지에 포함된 retryDelay만큼 기다린 뒤 재시도합니다.
 * 최대 MAX_RETRIES회 재시도 후에도 실패하면 에러를 던집니다.
 */
async function retryOnQuotaError<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
  const MAX_RETRIES = 3;
  try {
    return await fn();
  } catch (err: unknown) {
    const isQuota =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      (err as { status: number }).status === 429;

    if (!isQuota || attempt >= MAX_RETRIES) throw err;

    // 에러 메시지에서 "retry in Xs" 파싱, 없으면 30초 대기
    const message = err instanceof Error ? err.message : String(err);
    const match = message.match(/retry in (\d+)/i);
    const waitSec = match ? Number(match[1]) + 2 : 30;

    console.warn(`[Gemini 429] ${waitSec}초 후 재시도 (${attempt + 1}/${MAX_RETRIES})...`);
    await new Promise((r) => setTimeout(r, waitSec * 1000));
    return retryOnQuotaError(fn, attempt + 1);
  }
}
