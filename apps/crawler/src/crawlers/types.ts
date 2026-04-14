/**
 * 크롤러가 반환하는 원시 공고 데이터 타입
 * DB 저장 전 파이프라인 내부에서 사용합니다.
 */
import type { JobSource } from "@job-assistant/shared";

export interface RawJobPosting {
  url: string;
  company: string;
  position: string;
  /** 크롤링한 채용공고 본문. 상세 페이지 진입 전이면 null. */
  jd: string | null;
  source: JobSource;
}
