/**
 * 원티드 채용 공고 크롤러 (공개 REST API 기반)
 *
 * API 엔드포인트:
 *   목록: GET https://www.wanted.co.kr/api/v4/jobs?category=518&...
 *   상세: GET https://www.wanted.co.kr/api/v4/jobs/{id}
 *
 * category=518: 프론트엔드 개발자
 *
 * 조기 종료 전략:
 *   목록은 최신순 정렬이므로, 연속으로 중복 공고가 나타나면
 *   이후 항목도 모두 이미 처리된 공고입니다. 이 시점에 크롤링을 종료합니다.
 *   - 첫 실행: 중복 없음 → MAX_LISTINGS까지 전부 수집
 *   - 이후 실행: 새 공고만 수집 → 빠르게 종료
 */
import { isJobAlreadyExists } from "@job-assistant/shared";
import { hashUrl } from "../filter/dedup";
import type { RawJobPosting } from "./types";

const BASE_URL = "https://www.wanted.co.kr";
const LIST_API = `${BASE_URL}/api/v4/jobs`;
const JOB_CATEGORY = 518; // 프론트엔드 개발자

/** 첫 실행 시 수집할 최대 공고 수 */
const MAX_LISTINGS = 50;

/** 연속 중복 N개 감지 시 조기 종료 (정렬이 최신순이므로 이후는 모두 기존 공고) */
const STOP_ON_CONSECUTIVE_DUPLICATES = 3;

/** 상세 페이지 요청 사이 딜레이 (ms) */
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
  title?: string;  // API 버전에 따라 title / name 중 하나 사용
  name?: string;
  position?: string;
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
 * 최신순 정렬 기준으로 연속 중복 감지 시 조기 종료합니다.
 */
export async function crawlWanted(): Promise<RawJobPosting[]> {
  const listings = await fetchListings();
  if (listings.length === 0) return [];

  // 첫 번째 항목 구조 로그 (포지션 필드명 확인용)
  if (listings[0]) {
    const sample = listings[0];
    console.log(`[원티드] 항목 구조 샘플: id=${sample.id}, title=${sample.title}, name=${sample.name}`);
  }

  const results: RawJobPosting[] = [];
  let consecutiveDuplicates = 0;

  for (const item of listings) {
    const url = `${BASE_URL}/wd/${item.id}`;

    // 상세 요청 전에 중복 체크 (API 호출 절약)
    const isDup = await isJobAlreadyExists(hashUrl(url));
    if (isDup) {
      consecutiveDuplicates++;
      if (consecutiveDuplicates >= STOP_ON_CONSECUTIVE_DUPLICATES) {
        console.log(`[원티드] 연속 ${consecutiveDuplicates}개 중복 → 조기 종료 (이미 처리된 공고)`);
        break;
      }
      continue;
    }
    consecutiveDuplicates = 0; // 새 공고 발견 시 카운터 리셋

    const jd = await fetchJobDetail(item.id);
    const position = item.title ?? item.name ?? item.position ?? "(포지션명 없음)";

    results.push({ url, company: item.company.name, position, jd, source: "wanted" });
    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`[원티드] 신규 공고 ${results.length}개 수집 (목록 ${listings.length}개 중)`);
  return results;
}

/**
 * 공고 목록 API를 호출합니다.
 */
async function fetchListings(): Promise<WantedListItem[]> {
  const params = new URLSearchParams({
    country: "kr",
    job_sort: "job.latest_order",
    years: "-1",
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
  console.log(`[원티드] 목록 ${(json.data ?? []).length}개 수신`);
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
