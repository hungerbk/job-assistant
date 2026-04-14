/**
 * Slack Bot 진입점 (서비스 2: 면접 연습, 서비스 3: 자소서 작성)
 *
 * 지원 명령어:
 * - /interview [회사명] : 면접 연습 시작
 * - /end               : 면접 세션 종료 + 총평
 * - /hint              : 현재 질문 힌트
 * - /coverletter [회사명] : 자소서 작성 시작
 * - /analyze           : JD 분석 + 강조할 경험 추천
 * - /draft             : 자소서 초안 생성
 * - /feedback          : 현재 초안 피드백
 */
import "dotenv/config";
import { App } from "@slack/bolt";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// TODO: 서비스 2 구현 시 면접 연습 핸들러 등록
// TODO: 서비스 3 구현 시 자소서 작성 핸들러 등록

(async () => {
  await app.start(Number(process.env.PORT) || 3000);
  console.log("Slack Bot 실행 중...");
})();
