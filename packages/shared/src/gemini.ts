/**
 * Gemini API 클라이언트 및 기업 정보 조회 유틸리티
 *
 * @ai-provider Gemini API (gemini-2.0-flash)
 * @ai-change-point 다른 AI로 교체 시: 이 파일의 클라이언트 초기화,
 *   모델명(MODEL_ID), 응답 파싱 로직을 수정할 것
 */
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import type { CompanyInfo } from "./types";
import { parseJsonResponse } from "./claude";

/** 사용할 Gemini 모델 ID */
const MODEL_ID = "gemini-2.0-flash";

let genAI: GoogleGenerativeAI | null = null;

/**
 * Gemini 클라이언트 싱글톤을 반환합니다.
 * 환경변수 GEMINI_API_KEY가 필요합니다.
 */
function getGeminiClient(): GenerativeModel {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("환경변수 GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }

  return genAI.getGenerativeModel({ model: MODEL_ID });
}

/**
 * Gemini API로 기업 정보(인재상, 최근 뉴스, 사업 방향)를 조회합니다.
 *
 * @ai-provider Gemini API (gemini-2.0-flash)
 * @ai-change-point 다른 AI로 교체 시: 이 함수의 API 호출 방식과
 *   응답 추출 로직(result.response.text())을 수정할 것
 */
export async function fetchCompanyInfo(companyName: string): Promise<CompanyInfo> {
  const model = getGeminiClient();

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
