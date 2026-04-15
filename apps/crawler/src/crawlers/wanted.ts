/**
 * 원티드 채용 공고 크롤러 (공개 REST API 기반)
 *
 * 이전 Playwright 방식에서 교체: 헤드리스 브라우저 감지 차단 및 선택자 불일치 문제 해결
 *
 * API 엔드포인트:
 *   목록: GET https://www.wanted.co.kr/api/v4/jobs?category=518&...
 *   상세: GET https://www.wanted.co.kr/api/v4/jobs/{id}
 *
 * category=518: 프론트엔드 개발자
 */
import type { RawJobPosting } from "./types";

const BASE_URL = "https://www.wanted.co.kr";
const LIST_API = `${BASE_URL}/api/v4/jobs`;
const JOB_CATEGORY = 518; // 프론트엔드 개발자

/** 목록에서 수집할 최대 공고 수 */
const MAX_LISTINGS = 20;

/** 상세 페이지 요청 사이 딜레이 (ms) — 서버 부하 방지 */
const REQUEST_DELAY_MS = 500;

/** API 요청 공통 헤더 */
const HEADERS = {
  accept: "application/json, text/plain, */*",
  "accept-language": "ko",
  "x-wanted-locale": "ko",
  referer: `${BASE_URL}/`,
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

interface WantedListItem {
  id: number;
  title: string;
  company: { name: string };
}

interface WantedListResponse {
  data: WantedListItem[];
  links?: { next?: string };
}

interface WantedDetailResponse {
  job: {
    id: number;
    title: string;
    company: { name: string };
    detail: {
      main_tasks?: string;
      requirements?: string;
      preferred_points?: string;
      benefits?: string;
      intro?: string;
    };
  };
}

/**
 * 원티드 공개 API로 프론트엔드 채용 공고를 수집합니다.
 */
export async function crawlWanted(): Promise<RawJobPosting[]> {
  const listings = await fetchListings();
  if (listings.length === 0) return [];

  const results: RawJobPosting[] = [];

  for (const item of listings) {
    const jd = await fetchJobDetail(item.id);
    results.push({
      url: `${BASE_URL}/wd/${item.id}`,
      company: item.company.name,
      position: item.title,
      jd,
      source: "wanted",
    });
    // 서버 부하 방지 딜레이
    await sleep(REQUEST_DELAY_MS);
  }

  return results;
}

/**
 * 공고 목록 API를 호출합니다.
 */
async function fetchListings(): Promise<WantedListItem[]> {
  const params = new URLSearchParams({
    country: "kr",
    job_sort: "job.latest_order",
    years: "-1",       // 전체 경력
    category: String(JOB_CATEGORY),
    limit: String(MAX_LISTINGS),
    offset: "0",
  });

  const response = await fetch(`${LIST_API}?${params}`, { headers: HEADERS });

  console.log(`[원티드] 목록 API 응답 상태: ${response.status}`);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`원티드 목록 API 오류: ${response.status}\n${body.slice(0, 300)}`);
  }

  const json = (await response.json()) as WantedListResponse;

  // 실제 응답 구조 확인용 (첫 실행 시 디버깅)
  const keys = Object.keys(json as object);
  console.log(`[원티드] 응답 최상위 키: [${keys.join(", ")}]`);
  console.log(`[원티드] data 배열 길이: ${(json.data ?? []).length}`);

  return json.data ?? [];
}

/**
 * 공고 상세 API를 호출하여 JD 본문을 추출합니다.
 */
async function fetchJobDetail(jobId: number): Promise<string | null> {
  const response = await fetch(`${LIST_API}/${jobId}`, { headers: HEADERS });

  if (!response.ok) {
    console.warn(`[원티드] 상세 조회 실패 (id: ${jobId}): ${response.status}`);
    return null;
  }

  const json = (await response.json()) as WantedDetailResponse;
  const detail = json.job?.detail;
  if (!detail) return null;

  // 주요 JD 섹션을 하나의 텍스트로 합칩니다
  return [
    detail.intro && `[회사 소개]\n${detail.intro}`,
    detail.main_tasks && `[주요 업무]\n${detail.main_tasks}`,
    detail.requirements && `[자격 요건]\n${detail.requirements}`,
    detail.preferred_points && `[우대 사항]\n${detail.preferred_points}`,
    detail.benefits && `[혜택 및 복지]\n${detail.benefits}`,
  ]
    .filter(Boolean)
    .join("\n\n") || null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
