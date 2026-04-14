/**
 * 제외 목록 필터 유틸리티
 *
 * 사용자가 Slack에서 "관심 없음" 버튼을 누른 회사/공고를 이후 크롤링에서 스킵합니다.
 * 필터 기준: (회사명 + 직군) 또는 공고 URL 해시
 */
import { isJobExcluded } from "@job-assistant/shared";
import type { RawJobPosting } from "../crawlers/types";
import { hashUrl } from "./dedup";

/**
 * 해당 공고가 제외 목록에 포함되어 있는지 확인합니다.
 * 포함되어 있으면 true를 반환하여 파이프라인에서 스킵합니다.
 */
export async function isExcluded(job: RawJobPosting): Promise<boolean> {
  const jobCategory = process.env.MY_JOB_CATEGORY ?? undefined;
  const urlHash = hashUrl(job.url);

  return isJobExcluded({
    company: job.company,
    jobCategory,
    urlHash,
  });
}
