/**
 * 채용 공고 수집 크롤러 진입점
 *
 * 실행 흐름:
 * 1. 각 사이트 크롤러 실행
 * 2. URL 해시 기반 중복 제거
 * 3. 제외 목록 필터링
 * 4. Claude API로 매칭 점수 계산
 * 5. 임계값 이상이면 DB 저장 + Slack/이메일 알림
 */
import "dotenv/config";

async function main(): Promise<void> {
  console.log("크롤러 시작...");
  // TODO: 서비스 1 구현 시 크롤러 로직 추가
  console.log("크롤러 완료.");
}

main().catch((err) => {
  console.error("크롤러 실행 오류:", err);
  process.exit(1);
});
