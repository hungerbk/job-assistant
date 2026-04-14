/**
 * URL 해시 기반 중복 공고 제거 유틸리티
 */
import { createHash } from "crypto";
import { isJobAlreadyExists } from "@job-assistant/shared";

/**
 * URL을 SHA-256 해시로 변환합니다.
 * DB 중복 체크 및 저장 시 url_hash 컬럼에 사용합니다.
 */
export function hashUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

/**
 * 해당 공고가 이미 DB에 존재하는지 확인합니다.
 * 존재하면 true를 반환하여 크롤링 파이프라인에서 스킵합니다.
 */
export async function isDuplicate(url: string): Promise<boolean> {
  const urlHash = hashUrl(url);
  return isJobAlreadyExists(urlHash);
}
