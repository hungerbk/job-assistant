/**
 * Gemini API 클라이언트 — 채팅, JSON 파싱, 기업 정보 조회 통합 모듈
 *
 * Claude API를 대체하여 모든 AI 기능을 Gemini API로 처리합니다.
 *
 * @ai-provider Gemini API (gemini-2.0-flash)
 * @ai-change-point 다른 AI로 교체 시:
 *   - MODEL_ID 상수 변경
 *   - getGeminiModel() 클라이언트 초기화 방식 변경
 *   - sendMessage() 내 역할 매핑(user/assistant → user/model) 및 API 호출 방식 변경
 *   - 응답 추출 로직(result.response.text()) 변경
 */
import {
  GoogleGenerativeAI,
  GenerativeModel,
  Content,
} from "@google/generative-ai";
import type { CompanyInfo } from "./types";

/** 사용할 Gemini 모델 ID */
const MODEL_ID = "gemini-2.0-flash";

/**
 * Gemini 무료 티어 분당 요청 제한(15 RPM) 대응을 위한 기본 딜레이(ms)
 * 공고 필터링처럼 요청이 몰리는 배치 작업 시 각 호출 사이에 삽입합니다.
 */
export const DEFAULT_RATE_LIMIT_DELAY_MS = 4_000;

let genAI: GoogleGenerativeAI | null = null;

/**
 * GoogleGenerativeAI 클라이언트 싱글톤을 반환합니다.
 * 환경변수 GEMINI_API_KEY가 필요합니다.
 */
function getGenAI(): GoogleGenerativeAI {
  if (genAI) return genAI;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("환경변수 GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

/**
 * 시스템 프롬프트가 적용된 Gemini 모델 인스턴스를 생성합니다.
 * 시스템 프롬프트가 없는 경우 기본 모델을 반환합니다.
 */
function getGeminiModel(systemPrompt?: string): GenerativeModel {
  const ai = getGenAI();
  return ai.getGenerativeModel({
    model: MODEL_ID,
    ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
  });
}

// ---------------------------------------------------------------------------
// 공통 유틸리티
// ---------------------------------------------------------------------------

/**
 * 지정한 시간(ms)만큼 대기합니다.
 * Gemini 무료 티어 요청 제한(15 RPM) 대응을 위해 배치 호출 사이에 사용합니다.
 *
 * 사용 예:
 *   for (const job of jobs) {
 *     await calculateMatchScore(job);
 *     await sleep(DEFAULT_RATE_LIMIT_DELAY_MS);
 *   }
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * AI API 응답 텍스트에서 JSON을 파싱합니다.
 * 모델이 ```json ... ``` 코드블록으로 감싸는 경우도 처리합니다.
 *
 * @ai-change-point 다른 AI로 교체 시: 모델별 응답 형식에 따라
 *   전처리 정규식을 조정할 것
 */
export function parseJsonResponse<T>(text: string): T {
  // 마크다운 코드블록 제거
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

// ---------------------------------------------------------------------------
// 채팅 / 텍스트 생성
// ---------------------------------------------------------------------------

/**
 * Gemini API에 메시지를 전송하고 텍스트 응답을 받습니다.
 * Claude API의 sendMessage와 동일한 인터페이스를 제공합니다.
 *
 * @ai-provider Gemini API (gemini-2.0-flash)
 * @ai-change-point 다른 AI로 교체 시:
 *   - 역할 매핑: Gemini는 "assistant" 대신 "model"을 사용하므로
 *     이 함수의 role 변환 로직을 수정할 것
 *   - API 호출 방식(model.generateContent)과 응답 추출(result.response.text())을 수정할 것
 */
export async function sendMessage(params: {
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
}): Promise<string> {
  const { systemPrompt, messages, maxTokens } = params;
  const model = getGeminiModel(systemPrompt);

  // Gemini는 role이 "user" | "model" 이므로 "assistant"를 "model"로 변환
  const contents: Content[] = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const result = await model.generateContent({
    contents,
    ...(maxTokens
      ? { generationConfig: { maxOutputTokens: maxTokens } }
      : {}),
  });

  return result.response.text();
}

// ---------------------------------------------------------------------------
// 기업 정보 조회
// ---------------------------------------------------------------------------

/**
 * Gemini API로 기업 정보(인재상, 최근 뉴스, 사업 방향)를 조회합니다.
 *
 * @ai-provider Gemini API (gemini-2.0-flash)
 * @ai-change-point 다른 AI로 교체 시: 이 함수의 API 호출 방식과
 *   응답 추출 로직(result.response.text())을 수정할 것
 */
export async function fetchCompanyInfo(companyName: string): Promise<CompanyInfo> {
  const model = getGeminiModel();

  const prompt = `[${companyName}]에 대해 아래 항목을 간결하게 알려줘.
검색 결과 기준으로 최신 정보를 우선으로 해줘.
모든 항목에 출처 URL을 반드시 포함해줘. 확인되지 않은 정보는 포함하지 마.

1. 인재상 및 핵심가치 (공식 사이트 기준)
2. 최근 6개월 주요 뉴스 (3개 이내)
3. 사업 방향 및 현재 집중 분야

JSON 형식으로만 응답해줘:
{
  "talent_values": {
    "summary": "...",
    "source_url": "https://..."
  },
  "recent_news": [
    { "title": "...", "summary": "...", "date": "YYYY-MM-DD", "source_url": "https://..." }
  ],
  "business_focus": {
    "summary": "...",
    "source_url": "https://..."
  }
}

출처 URL이 없는 항목은 응답에서 제외해줘.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return parseJsonResponse<CompanyInfo>(text);
}

/**
 * Gemini 기업 정보를 면접/자소서 프롬프트에 삽입할 텍스트로 포맷합니다.
 */
export function formatCompanyInfoForPrompt(info: CompanyInfo): string {
  const lines: string[] = [];

  if (info.talent_values) {
    lines.push(`[인재상 및 핵심가치]`);
    lines.push(`${info.talent_values.summary} (출처: ${info.talent_values.source_url})`);
  }

  if (info.recent_news.length > 0) {
    lines.push(`\n[최근 뉴스]`);
    for (const news of info.recent_news) {
      lines.push(`- [${news.date}] ${news.title}: ${news.summary} (출처: ${news.source_url})`);
    }
  }

  if (info.business_focus) {
    lines.push(`\n[사업 방향]`);
    lines.push(`${info.business_focus.summary} (출처: ${info.business_focus.source_url})`);
  }

  return lines.join("\n");
}
