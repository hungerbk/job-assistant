/**
 * 크로스 플랫폼 중복 제거
 *
 * 같은 공고가 여러 플랫폼(원티드, 사람인 등)에 동시 게시되는 경우,
 * URL이 달라 URL 해시 기반 dedup만으로는 중복을 잡을 수 없습니다.
 *
 * 이 모듈은 (회사명 + 포지션명) 정규화 키를 기준으로
 * 수집 단계에서 메모리 내 중복을 제거합니다.
 *
 * 정규화 규칙:
 *   - 소문자 변환
 *   - 괄호·특수문자 제거
 *   - 공백 정리 (연속 공백 → 단일 공백, trim)
 */
import type { RawJobPosting } from "../crawlers/types";

/**
 * 회사명과 포지션명을 정규화한 중복 감지 키를 반환합니다.
 * 예: "카카오 (주)" + "프론트엔드 개발자 (React)"
 *  → "카카오  프론트엔드 개발자 react"
 */
function buildDedupeKey(company: string, position: string): string {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[()（）\[\]【】]/g, "") // 괄호 제거
      .replace(/[^\w\s가-힣]/g, " ")    // 특수문자 → 공백
      .replace(/\s+/g, " ")             // 연속 공백 → 단일 공백
      .trim();

  return `${normalize(company)}|${normalize(position)}`;
}

/**
 * 수집된 공고 목록에서 크로스 플랫폼 중복을 제거합니다.
 *
 * 동일한 (회사명 + 포지션명) 조합이 여러 플랫폼에서 수집된 경우,
 * 목록 앞에 있는 항목(우선순위 높은 플랫폼)을 유지하고 나머지를 제거합니다.
 *
 * @param jobs - 모든 플랫폼에서 수집된 원시 공고 목록
 * @returns 크로스 플랫폼 중복이 제거된 목록
 */
export function removeCrossplatformDuplicates(
  jobs: RawJobPosting[]
): RawJobPosting[] {
  const seen = new Set<string>();
  const result: RawJobPosting[] = [];

  for (const job of jobs) {
    const key = buildDedupeKey(job.company, job.position);
    if (seen.has(key)) {
      console.log(
        `[크로스플랫폼 중복] ${job.company} — ${job.position} (${job.source}) 스킵`
      );
      continue;
    }
    seen.add(key);
    result.push(job);
  }

  const removed = jobs.length - result.length;
  if (removed > 0) {
    console.log(`[크로스플랫폼] ${removed}개 중복 제거 (${jobs.length}개 → ${result.length}개)`);
  }

  return result;
}
