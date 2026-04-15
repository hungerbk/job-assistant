/**
 * 자소서 작성 AI 프롬프트 조립
 *
 * @ai-provider Gemini API (gemini-2.0-flash)
 * @ai-change-point 다른 AI로 교체 시: packages/shared/gemini.ts의 sendMessage와
 *   이 파일의 시스템 프롬프트, 분석/초안/피드백 프롬프트를 함께 검토할 것
 */
import { fetchCompanyInfo, formatCompanyInfoForPrompt } from "@job-assistant/shared";
import type { CoverletterQuestion } from "@job-assistant/shared";
import { loadProfile, loadCompanyFile } from "../interview/prompt";

/**
 * 자소서 작성 시스템 프롬프트를 조립합니다.
 */
export async function buildCoverletterSystemPrompt(params: {
  company: string;
  jd: string;
  questions: CoverletterQuestion[];
}): Promise<string> {
  const { company, jd, questions } = params;

  const profile = loadProfile();
  const companyFile = loadCompanyFile(company);

  let companyInfoText = "";
  try {
    const companyInfo = await fetchCompanyInfo(company);
    companyInfoText = formatCompanyInfoForPrompt(companyInfo);
  } catch {
    console.warn(`[경고] ${company} 기업 정보 조회 실패. 파일 정보만 사용합니다.`);
  }

  const questionsSection =
    questions.length > 0
      ? `[자소서 문항]\n${questions
          .map((q, i) => `${i + 1}. ${q.question} (${q.max_length}자 이내)`)
          .join("\n")}`
      : "";

  return `당신은 채용 전문가이자 자소서 코치입니다.

[채용 공고 JD]
${jd}

[회사 정보]
${companyFile || "(파일 없음)"}
${companyInfoText}

[지원자 프로필 및 STAR 경험]
${profile}

${questionsSection}

역할:
1. JD를 분석하여 회사가 원하는 핵심 역량을 추출합니다.
2. 지원자의 STAR 경험 중 JD에 가장 적합한 것을 추천합니다.
3. 초안 작성 요청 시 지원자의 실제 경험 기반으로 자소서를 작성합니다.
   - 자소서 문항이 있는 경우: 문항별로 각각 작성하며 글자 수 제한을 반드시 준수합니다.
   - 자소서 문항이 없는 경우: 지원 동기, 강점, 경험 순서로 자유 형식으로 작성합니다.
4. 수정 요청 시 구체적인 피드백과 개선안을 제시합니다.
- 지어내지 않고, 반드시 프로필에 있는 경험만 활용합니다.`;
}

/**
 * JD 분석 + 강조할 경험 추천 프롬프트를 생성합니다.
 * /analyze 명령어에서 사용합니다.
 */
export function buildAnalyzePrompt(): string {
  return `위 JD를 분석하여 다음을 제공해 주세요:

1. **핵심 역량 키워드** (3~5개): 회사가 가장 중요하게 보는 것
2. **강조할 STAR 경험 추천** (2~3개): 내 프로필에서 JD에 가장 잘 맞는 경험과 그 이유
3. **주의할 점**: 이 회사/포지션에 자소서를 쓸 때 특별히 신경 써야 할 것

간결하고 실용적으로 답해 주세요.`;
}

/**
 * 자소서 초안 생성 프롬프트를 생성합니다.
 * /draft 명령어에서 사용합니다.
 */
export function buildDraftPrompt(questions: CoverletterQuestion[]): string {
  if (questions.length > 0) {
    return `위 자소서 문항에 맞게 초안을 작성해 주세요.
각 문항별로 글자 수 제한을 반드시 지키고, 실제 프로필의 경험만 사용해 주세요.
형식: 문항 번호와 질문을 먼저 쓰고 답변을 이어서 작성해 주세요.`;
  }
  return `자유 형식 자소서 초안을 작성해 주세요.
지원 동기 → 강점 → 주요 경험 순서로 구성하고, 실제 프로필의 경험만 사용해 주세요.`;
}

/**
 * 현재 초안에 대한 피드백 프롬프트를 생성합니다.
 * /feedback 명령어에서 사용합니다.
 */
export function buildFeedbackPrompt(currentDraft: string): string {
  return `현재 자소서 초안에 대한 피드백을 제공해 주세요:

[현재 초안]
${currentDraft}

다음 항목별로 검토해 주세요:
1. **강점**: 잘 된 부분
2. **개선 필요**: 구체적으로 부족한 부분과 이유
3. **수정 제안**: 개선된 문장 또는 단락 예시 (1~2개)`;
}
