/**
 * 면접 연습 AI 프롬프트 조립
 *
 * @ai-provider Gemini API (gemini-2.0-flash)
 * @ai-change-point 다른 AI로 교체 시: packages/shared/gemini.ts의 sendMessage와
 *   이 파일의 시스템 프롬프트 구성 방식을 함께 검토할 것
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { fetchCompanyInfo, formatCompanyInfoForPrompt } from "@job-assistant/shared";

/** 프로필 파일 루트 경로 */
const PROFILE_ROOT = join(__dirname, "../../../../../profile");

/**
 * profile.md를 읽어 반환합니다.
 * 파일이 없으면 profile.example.md를 폴백으로 사용합니다.
 */
export function loadProfile(): string {
  const profilePath = join(PROFILE_ROOT, "profile.md");
  const examplePath = join(PROFILE_ROOT, "profile.example.md");

  if (existsSync(profilePath)) return readFileSync(profilePath, "utf-8");
  return readFileSync(examplePath, "utf-8");
}

/**
 * 기업 정보 파일(companies/회사명.md)을 읽어 반환합니다.
 * 파일이 없으면 빈 문자열을 반환합니다.
 */
export function loadCompanyFile(company: string): string {
  const companyPath = join(PROFILE_ROOT, "companies", `${company}.md`);
  if (existsSync(companyPath)) return readFileSync(companyPath, "utf-8");
  return "";
}

/**
 * 면접관 역할의 시스템 프롬프트를 조립합니다.
 * Gemini API로 최신 기업 정보를 보완합니다.
 */
export async function buildInterviewSystemPrompt(params: {
  company: string;
  position: string;
  jd: string;
}): Promise<string> {
  const { company, position, jd } = params;

  const profile = loadProfile();
  const companyFile = loadCompanyFile(company);

  // Gemini로 최신 기업 정보 조회 (실패해도 계속 진행)
  let companyInfoText = "";
  try {
    const companyInfo = await fetchCompanyInfo(company);
    companyInfoText = formatCompanyInfoForPrompt(companyInfo);
  } catch {
    console.warn(`[경고] ${company} 기업 정보 조회 실패. 파일 정보만 사용합니다.`);
  }

  return `당신은 ${company} ${position} 포지션의 시니어 면접관입니다.

[채용 공고 JD]
${jd}

[회사 정보]
${companyFile || "(파일 없음)"}
${companyInfoText}

[지원자 프로필]
${profile}

면접 진행 규칙:
- 한 번에 하나의 질문만 합니다.
- 지원자의 답변 후 반드시 아래 세 가지를 제공합니다:
  1. 답변의 잘한 점
  2. 부족하거나 보완할 점
  3. 꼬리질문 1~2개
- 기술 질문, 경험 질문, 인성 질문을 골고루 섞어서 진행합니다.
- 경험 질문 시 STAR 구조로 답변하도록 유도합니다.
- /end 명령을 받으면 전체 면접에 대한 총평을 제공합니다.`;
}

/**
 * 힌트 요청용 프롬프트를 조립합니다.
 * 마지막 면접관 질문을 기준으로 힌트를 생성합니다.
 */
export function buildHintPrompt(lastQuestion: string): string {
  return `면접관의 질문: "${lastQuestion}"

이 질문에 대한 답변 힌트를 아래 형식으로 제공해 주세요:
1. 핵심 키워드 (2~3개)
2. 답변 구조 제안
3. 주의할 점`;
}
