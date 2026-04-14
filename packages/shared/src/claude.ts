/**
 * Claude API 클라이언트 및 공통 유틸리티
 *
 * @ai-provider Claude API (claude-sonnet-4-5)
 * @ai-change-point 다른 AI로 교체 시: 이 파일의 클라이언트 초기화와
 *   모델명(MODEL_ID), 응답 파싱 로직을 수정할 것
 */
import Anthropic from "@anthropic-ai/sdk";

/** 사용할 Claude 모델 ID */
const MODEL_ID = "claude-sonnet-4-5";

/** 최대 토큰 수 */
const MAX_TOKENS = 4096;

let client: Anthropic | null = null;

/**
 * Anthropic 클라이언트 싱글톤을 반환합니다.
 * 환경변수 ANTHROPIC_API_KEY가 필요합니다.
 */
export function getClaudeClient(): Anthropic {
  if (client) return client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("환경변수 ANTHROPIC_API_KEY가 설정되지 않았습니다.");
  }

  client = new Anthropic({ apiKey });
  return client;
}

/**
 * Claude API에 단순 텍스트 메시지를 전송하고 응답을 받습니다.
 *
 * @ai-provider Claude API (claude-sonnet-4-5)
 * @ai-change-point 다른 AI로 교체 시: 이 함수의 API 호출 방식과
 *   응답 추출 로직(content[0].type === "text")을 수정할 것
 */
export async function sendMessage(params: {
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
}): Promise<string> {
  const claude = getClaudeClient();
  const { systemPrompt, messages, maxTokens = MAX_TOKENS } = params;

  const response = await claude.messages.create({
    model: MODEL_ID,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  // 텍스트 응답 추출
  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Claude API에서 텍스트 응답을 받지 못했습니다.");
  }

  return textContent.text;
}

/**
 * Claude API 응답에서 JSON을 파싱합니다.
 * JSON만 반환하도록 프롬프트에 지시한 경우 사용합니다.
 *
 * @ai-change-point 다른 AI로 교체 시: 모델에 따라 JSON 응답 형식이 다를 수 있으므로
 *   파싱 전처리 로직을 함께 검토할 것
 */
export function parseJsonResponse<T>(text: string): T {
  // 마크다운 코드블록 제거 (모델이 ```json ... ``` 형식으로 감싸는 경우 대응)
  const cleaned = text
    .replace(/^```(?:json)?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`JSON 파싱 실패. 응답 내용:\n${text}`);
  }
}
