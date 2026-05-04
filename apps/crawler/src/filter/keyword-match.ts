/**
 * 키워드 기반 채용 공고 매칭 점수 계산
 *
 * Gemini API 없이 환경변수의 직군·스킬·제외 조건 키워드로 점수를 산출합니다.
 * 봇 서비스(/interview, /coverletter)를 위해 Gemini 할당량을 보존하는 용도입니다.
 *
 * 점수 구성:
 *   - 직군 키워드 매칭: 40점 (불일치 시 즉시 0점 반환)
 *   - 스킬 키워드 매칭: 최대 60점 (스킬 수로 균등 배분)
 *   - 제외 조건 매칭:  -30점/항목
 *   - 최종 점수: 0~100 클램핑
 */
import type { MatchResult } from "@job-assistant/shared";
import type { RawJobPosting } from "../crawlers/types";

/**
 * 직군·스킬 키워드 매칭으로 채용 공고의 적합도 점수를 계산합니다.
 * Gemini API를 사용하지 않는 동기 함수입니다.
 */
export function calculateKeywordScore(job: RawJobPosting): MatchResult {
  const rawCategory = process.env.MY_JOB_CATEGORY ?? "프론트엔드";
  const category = rawCategory.toLowerCase();

  const skills = (process.env.MY_SKILLS ?? "React,TypeScript,Next.js")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const excluded = (process.env.MY_EXCLUDED_CONDITIONS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const threshold = Number(process.env.MATCH_SCORE_THRESHOLD || "70");

  const searchText = [job.position, job.jd]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const match_reasons: string[] = [];
  const mismatch_reasons: string[] = [];
  let score = 0;

  // 직군 매칭 (40점) — 불일치 시 즉시 0점
  const categoryAliases = [category, "frontend", "프론트"];
  const categoryMatched = categoryAliases.some((k) => searchText.includes(k));
  if (!categoryMatched) {
    mismatch_reasons.push(`직군 키워드 없음 (${rawCategory})`);
    return { score: 0, match_reasons, mismatch_reasons, send: false };
  }
  score += 40;
  match_reasons.push(`직군 매칭 (${rawCategory})`);

  // 스킬 매칭 (최대 60점)
  if (skills.length > 0) {
    const perSkill = 60 / skills.length;
    for (const skill of skills) {
      if (searchText.includes(skill)) {
        score += perSkill;
        match_reasons.push(`스킬: ${skill}`);
      } else {
        mismatch_reasons.push(`스킬 없음: ${skill}`);
      }
    }
  } else {
    score += 60;
  }

  // 제외 조건 (-30점/항목)
  for (const cond of excluded) {
    if (searchText.includes(cond)) {
      score -= 30;
      mismatch_reasons.push(`제외 조건 포함: ${cond}`);
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, match_reasons, mismatch_reasons, send: score >= threshold };
}
