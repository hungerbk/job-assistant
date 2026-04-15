/**
 * 사람인 채용 공고 크롤러 (공개 REST API 기반)
 *
 * API 엔드포인트:
 *   https://oapi.saramin.co.kr/job-search
 *
 * 사전 조건:
 *   - 사람인 Open API 발급 필요: https://oapi.saramin.co.kr
 *   - 환경변수 SARAMIN_API_KEY 설정 (없으면 크롤러 스킵)
 *
 * 조기 종료 전략:
 *   결과는 최신순(posted) 정렬이므로, 연속 중복 감지 시 조기 종료합니다.
 */
import { isJobAlreadyExists } from "@job-assistant/shared";
import { hashUrl } from "../filter/dedup";
import type { RawJobPosting } from "./types";

const API_URL = "https://oapi.saramin.co.kr/job-search";

/** 한 번에 요청할 공고 수 (API 최대: 110) */
const PAGE_SIZE = 50;

/** 연속 중복 N개 감지 시 조기 종료 */
const STOP_ON_CONSECUTIVE_DUPLICATES = 3;

/** 상세 페이지 요청 사이 딜레이 (ms) */
const REQUEST_DELAY_MS = 500;

interface SaraminJob {
  id: string;
  url: string;
  "active-posting-timestamp": number;
  position: {
    title: string;
    "job-mid-code": { code: string; name: string }[];
  };
  company: {
    detail: {
      name: string;
      href: string;
    };
  };
}

interface SaraminResponse {
  jobs: {
    count: number;
    total: number;
    start: number;
    job: SaraminJob[];
  };
}

/**
 * 사람인 공개 API로 프론트엔드 채용 공고를 수집합니다.
 * SARAMIN_API_KEY가 없으면 빈 배열을 반환합니다.
 */
export async function crawlSaramin(): Promise<RawJobPosting[]> {
  const apiKey = process.env.SARAMIN_API_KEY;
  if (!apiKey) {
    console.log("[사람인] SARAMIN_API_KEY 미설정 → 스킵");
    return [];
  }

  const listings = await fetchListings(apiKey);
  if (listings.length === 0) return [];

  const results: RawJobPosting[] = [];
  let consecutiveDuplicates = 0;

  for (const item of listings) {
    const url = item.url;

    const isDup = await isJobAlreadyExists(hashUrl(url));
    if (isDup) {
      consecutiveDuplicates++;
      if (consecutiveDuplicates >= STOP_ON_CONSECUTIVE_DUPLICATES) {
        console.log(`[사람인] 연속 ${consecutiveDuplicates}개 중복 → 조기 종료`);
        break;
      }
      continue;
    }
    consecutiveDuplicates = 0;

    const company = item.company.detail.name;
    const position = item.position.title;

    // 사람인 공개 API는 목록에 JD 본문을 포함하지 않으므로 null 처리
    // 추후 상세 페이지 스크래핑 추가 시 여기서 fetchJobDetail(item.id)를 호출
    results.push({ url, company, position, jd: null, source: "saramin" });

    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`[사람인] 신규 공고 ${results.length}개 수집 (목록 ${listings.length}개 중)`);
  return results;
}

async function fetchListings(apiKey: string): Promise<SaraminJob[]> {
  const params = new URLSearchParams({
    access_key: apiKey,
    job_mid_cd: "2", // 개발·데이터 직군
    job_cd: "84",    // 웹 개발자 (프론트엔드 포함)
    count: String(PAGE_SIZE),
    sort: "pd",      // 최신 게시일 순
    fields: "posting-timestamp,modification-timestamp,expiration-timestamp,active-posting-timestamp,read-cnt,apply-cnt,bookmark-cnt",
  });

  const response = await fetch(`${API_URL}?${params}`, {
    headers: { Accept: "application/json" },
  });

  console.log(`[사람인] 목록 API 응답 상태: ${response.status}`);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`사람인 목록 API 오류: ${response.status}\n${body.slice(0, 300)}`);
  }

  const json = (await response.json()) as SaraminResponse;
  const jobs = json.jobs?.job ?? [];
  console.log(`[사람인] 목록 ${jobs.length}개 수신`);
  return jobs;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
