/**
 * 잡코리아 채용 공고 크롤러 (스텁)
 *
 * 잡코리아는 공개 API를 제공하지 않습니다.
 * 현재는 구조만 정의해두고, 실제 수집은 비활성화 상태입니다.
 *
 * 활성화 방법:
 *   1. Playwright 기반 스크래핑 구현 (아래 TODO 참고)
 *   2. 또는 비공식 API 엔드포인트 분석 후 fetch 기반으로 구현
 *   3. crawlJobkorea()에서 ENABLED 플래그 제거
 *
 * TODO: 실제 구현 시 아래 접근 방식 중 선택
 *   A) Playwright 스크래핑:
 *      - URL: https://www.jobkorea.co.kr/Search/?stext=프론트엔드&tabType=recruit&order=1
 *      - 셀렉터: .list-post .title (공고 제목), .name (회사명)
 *      - package.json에 playwright 의존성 추가 필요
 *
 *   B) 비공식 API (분석 필요):
 *      - 브라우저 개발자 도구 → Network 탭 → XHR 요청 분석
 *      - wanted.ts와 동일한 fetch 기반 패턴으로 구현
 */
import type { RawJobPosting } from "./types";

/**
 * 잡코리아 크롤러 (현재 비활성화)
 * 실제 구현 완료 후 이 함수를 index.ts의 runCrawlers()에 추가하세요.
 */
export async function crawlJobkorea(): Promise<RawJobPosting[]> {
  console.log("[잡코리아] 크롤러가 아직 구현되지 않았습니다 → 스킵");
  return [];

  // TODO: 아래는 구현 예시 스켈레톤입니다
  // const listings = await fetchListings();
  // const results: RawJobPosting[] = [];
  //
  // for (const item of listings) {
  //   const url = `https://www.jobkorea.co.kr/Recruit/GI_Read/${item.id}`;
  //   const isDup = await isJobAlreadyExists(hashUrl(url));
  //   if (isDup) { ... }
  //
  //   results.push({
  //     url,
  //     company: item.companyName,
  //     position: item.title,
  //     jd: await fetchJobDetail(item.id),
  //     source: "jobkorea",
  //   });
  // }
  // return results;
}
