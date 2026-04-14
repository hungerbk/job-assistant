/**
 * 원티드 채용 공고 크롤러 (Playwright 기반)
 *
 * 대상: https://www.wanted.co.kr/jobs?job_sort=job.latest_order&years=-1&category=518
 * (프론트엔드 개발자, 전체 경력, 최신순)
 *
 * 수집 흐름:
 * 1. 목록 페이지에서 공고 카드(회사명, 포지션, URL) 수집
 * 2. 각 공고 상세 페이지 진입 → JD 본문 추출
 */
import { chromium, type Browser, type Page } from "playwright";
import type { RawJobPosting } from "./types";

/** 원티드 프론트엔드 개발자 목록 URL */
const LIST_URL =
  "https://www.wanted.co.kr/jobs?job_sort=job.latest_order&years=-1&category=518";

/** 목록 페이지에서 수집할 최대 공고 수 */
const MAX_LISTINGS = 20;

/** 페이지 로드 대기 시간 (ms) */
const PAGE_LOAD_WAIT_MS = 2_000;

/**
 * 원티드에서 채용 공고 목록을 수집합니다.
 * Playwright로 브라우저를 실행하여 SPA 렌더링을 처리합니다.
 */
export async function crawlWanted(): Promise<RawJobPosting[]> {
  const browser = await chromium.launch({ headless: true });
  try {
    const listings = await fetchListings(browser);
    const results: RawJobPosting[] = [];

    for (const listing of listings) {
      const jd = await fetchJobDetail(browser, listing.url);
      results.push({ ...listing, jd });
    }

    return results;
  } finally {
    await browser.close();
  }
}

/**
 * 목록 페이지에서 공고 카드(회사명, 포지션, URL)를 수집합니다.
 */
async function fetchListings(
  browser: Browser
): Promise<Omit<RawJobPosting, "jd">[]> {
  const page = await browser.newPage();
  await page.goto(LIST_URL, { waitUntil: "networkidle" });

  // 무한 스크롤 — 충분한 공고가 로드될 때까지 스크롤
  await autoScroll(page, MAX_LISTINGS);

  const cards = await page.$$eval(
    'a[data-cy="job-card"]',
    (anchors: HTMLAnchorElement[], max: number) =>
      anchors.slice(0, max).map((a) => {
        const base = "https://www.wanted.co.kr";
        const href = a.getAttribute("href") ?? "";
        const url = href.startsWith("http") ? href : base + href;

        // 카드 내 텍스트 요소에서 포지션명과 회사명 추출
        const texts = Array.from(a.querySelectorAll("strong, span")).map(
          (el: Element) => el.textContent?.trim() ?? ""
        );
        const position = texts[0] ?? "";
        const company = texts[1] ?? "";

        return { url, company, position };
      }),
    MAX_LISTINGS
  );

  await page.close();

  return cards
    .filter((c) => c.url && c.company && c.position)
    .map((c) => ({ ...c, source: "wanted" as const }));
}

/**
 * 공고 상세 페이지에서 JD 본문을 추출합니다.
 */
async function fetchJobDetail(
  browser: Browser,
  url: string
): Promise<string | null> {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(PAGE_LOAD_WAIT_MS);

    // 원티드 상세 페이지 JD 컨테이너 선택자
    const jd = await page.$eval(
      ".JobDescription_JobDescription__VWfcb, [class*='JobDescription']",
      (el) => el.textContent?.trim() ?? null
    ).catch(() => null);

    return jd;
  } finally {
    await page.close();
  }
}

/**
 * 무한 스크롤 페이지에서 maxItems개 이상의 카드가 렌더링될 때까지 스크롤합니다.
 */
async function autoScroll(page: Page, maxItems: number): Promise<void> {
  let prevCount = 0;
  const MAX_ATTEMPTS = 10;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const count = await page.$$eval(
      'a[data-cy="job-card"]',
      (els) => els.length
    );
    if (count >= maxItems) break;
    if (count === prevCount) break; // 더 이상 로드 안 됨

    prevCount = count;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1_500);
  }
}
