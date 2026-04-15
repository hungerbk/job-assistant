/**
 * Slack Bot 진입점
 *
 * 서비스 1 연동: 공고 알림 버튼 액션 (관심 없음 / 면접 연습 / 자소서 작성)
 * 서비스 2: 면접 연습 (/interview, /end, /hint)
 * 서비스 3: 자소서 작성 (/coverletter, /analyze, /draft, /clfeedback)
 */
import "dotenv/config";
import { App } from "@slack/bolt";
import { registerActionHandlers } from "./actions/handler";
import { registerInterviewHandlers } from "./interview/handler";
import { registerCoverletterHandlers } from "./resume/handler";
import { registerCSHandlers } from "./cs/handler";
import { notifyError } from "./utils/error-notify";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // Socket Mode 사용 시 아래 주석 해제 (Render 배포 시에는 HTTP 모드 권장)
  // socketMode: true,
  // appToken: process.env.SLACK_APP_TOKEN,
});

// 공고 알림 버튼 액션 핸들러 (서비스 1 → 2, 3 연결)
registerActionHandlers(app);

// 면접 연습 핸들러 등록
registerInterviewHandlers(app);

// 자소서 작성 핸들러 등록
registerCoverletterHandlers(app);

// CS 질문 핸들러 등록
registerCSHandlers(app);

// 전역 에러 핸들러 — 각 핸들러에서 처리되지 않은 에러를 Slack으로 알림
app.error(async (error) => {
  await notifyError("전역 에러 핸들러", error);
});

(async () => {
  const port = Number(process.env.PORT) || 3000;
  await app.start(port);
  console.log(`Slack Bot 실행 중 (port: ${port})`);
})();
