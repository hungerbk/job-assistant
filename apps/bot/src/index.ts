/**
 * Slack Bot 진입점
 *
 * 서비스 2: 면접 연습 (/interview, /end, /hint)
 * 서비스 3: 자소서 작성 (/coverletter, /analyze, /draft, /feedback) — 추후 추가
 */
import "dotenv/config";
import { App } from "@slack/bolt";
import { registerInterviewHandlers } from "./interview/handler";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // Socket Mode 사용 시 아래 주석 해제 (Railway 배포 시에는 HTTP 모드 권장)
  // socketMode: true,
  // appToken: process.env.SLACK_APP_TOKEN,
});

// 면접 연습 핸들러 등록
registerInterviewHandlers(app);

// TODO: 서비스 3 구현 후 자소서 핸들러 등록
// registerCoverletterHandlers(app);

(async () => {
  const port = Number(process.env.PORT) || 3000;
  await app.start(port);
  console.log(`Slack Bot 실행 중 (port: ${port})`);
})();
