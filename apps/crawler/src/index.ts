/**
 * 채용 공고 수집 크롤러 진입점
 *
 * 실행 흐름:
 * 1. 각 사이트 크롤러 실행 (원티드, 사람인, 잡코리아)
 * 2. 크로스 플랫폼 중복 제거 (회사명 + 포지션명 기준)
 * 3. URL 해시 기반 중복 제거
 * 4. 제외 목록 필터링
 * 5. Gemini API로 매칭 점수 계산 (요청 사이 딜레이 적용)
 * 6. DB 저장
 * 7. 매칭 점수 >= 임계값이면 Slack 알림 발송 (이메일 알림은 추후 활성화)
 */
import "dotenv/config";
import { getSupabaseClient, sleep, DEFAULT_RATE_LIMIT_DELAY_MS } from "@job-assistant/shared";
import type { JobPosting } from "@job-assistant/shared";
import { crawlWanted } from "./crawlers/wanted";
import { crawlSaramin } from "./crawlers/saramin";
import { crawlJobkorea } from "./crawlers/jobkorea";
import { isDuplicate, hashUrl } from "./filter/dedup";
import { isExcluded } from "./filter/exclude";
import { calculateMatchScore, DailyQuotaExceededError } from "./filter/match";
import { removeCrossplatformDuplicates } from "./filter/crossplatform";
import { sendSlackNotification, sendSlackAlert } from "./notify/slack";
import type { RawJobPosting } from "./crawlers/types";

async function main(): Promise<void> {
  console.log("크롤러 시작...");

  // 1. 크롤링 실행
  const crawled = await runCrawlers();
  console.log(`총 ${crawled.length}개 공고 수집 (중복 제거 전)`);

  // 2. 크로스 플랫폼 중복 제거
  const rawJobs = removeCrossplatformDuplicates(crawled);
  console.log(`크로스 플랫폼 중복 제거 후: ${rawJobs.length}개`);

  let saved = 0;
  let notified = 0;
  let skipped = 0;
  let geminiCallCount = 0;

  const db = getSupabaseClient();
  const threshold = Number(process.env.MATCH_SCORE_THRESHOLD ?? 70);

  // 셀프 리밋 — 일일 무료 할당량의 일부만 사용해 봇 서비스(/interview, /coverletter)용
  // 호출분을 보존한다. (예: 1500 RPD × 90% / 하루 2회 = 675회/회 — 환경에 맞게 조정)
  const maxRequestsPerRun = Number(process.env.GEMINI_REQUESTS_PER_RUN ?? 50);

  for (const job of rawJobs) {
    // 2. 중복 제거
    if (await isDuplicate(job.url)) {
      console.log(`[스킵-중복] ${job.company} — ${job.position}`);
      skipped++;
      continue;
    }

    // 3. 제외 목록 확인
    if (await isExcluded(job)) {
      console.log(`[스킵-제외] ${job.company} — ${job.position}`);
      skipped++;
      continue;
    }

    // 4. 셀프 리밋 — 봇 서비스용 할당량을 보존하기 위해 한도 도달 시 종료.
    // 이미 처리된 공고의 Slack 알림은 루프 내에서 인라인으로 이미 발송되었으므로 손실 없음.
    if (geminiCallCount >= maxRequestsPerRun) {
      console.log(
        `[중단] 이번 실행 호출 한도(${maxRequestsPerRun}회)에 도달. 봇 서비스용 할당량을 보존합니다.`
      );
      await sendSlackAlert(
        `이번 실행의 Gemini 호출 한도(${maxRequestsPerRun}회)에 도달했습니다.\n` +
          `진행 상황: 저장 ${saved}개, 알림 ${notified}개, 스킵 ${skipped}개.\n` +
          `남은 일일 할당량은 봇 서비스(/interview, /coverletter)용으로 예약됩니다.`
      );
      break;
    }

    // 5. Gemini API 매칭 점수 계산 (배치 호출 사이 딜레이)
    console.log(`[매칭 중] ${job.company} — ${job.position} (${geminiCallCount + 1}/${maxRequestsPerRun})`);
    geminiCallCount++;
    let match;
    try {
      match = await calculateMatchScore(job);
    } catch (err) {
      // 일일 할당량 소진 — 더 이상 처리해도 모두 실패하므로 즉시 전체 루프 중단.
      // 분 단위 재시도로는 회복되지 않으므로 시간 낭비를 피한다.
      if (err instanceof DailyQuotaExceededError) {
        console.error(`[중단] ${err.message}`);
        await sendSlackAlert(
          `${err.message}\n\n` +
            `진행 상황: 저장 ${saved}개, 알림 ${notified}개, 스킵 ${skipped}개.\n` +
            `다음 일일 할당량 리셋 후 다시 실행되거나, 유료 플랜으로 업그레이드해 주세요.`
        );
        break;
      }
      console.error(`[오류] 매칭 점수 계산 실패: ${job.url}`, err);
      await sleep(DEFAULT_RATE_LIMIT_DELAY_MS);
      continue;
    }
    console.log(`  → 점수: ${match.score} / 알림: ${match.send}`);

    // 5. DB 저장 (점수에 관계없이 모두 저장)
    // JobPosting 타입으로 검증 후 Supabase 비타입 insert 사용
    // (Supabase SDK 제네릭과 커스텀 Database 타입 간 호환성 이슈 우회)
    const insertData: Omit<JobPosting, "id" | "created_at"> = {
      url: job.url,
      url_hash: hashUrl(job.url),
      company: job.company,
      position: job.position,
      jd: job.jd,
      source: job.source,
      match_score: match.score,
      match_reasons: {
        match: match.match_reasons,
        mismatch: match.mismatch_reasons,
      },
      is_excluded: false,
      notified_at: match.send ? new Date().toISOString() : null,
    };
    const { error: insertError } = await db
      .from("job_postings")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(insertData as any);

    if (insertError) {
      console.error(`[오류] DB 저장 실패: ${job.url}`, insertError.message);
    } else {
      saved++;
    }

    // 6. 임계값 이상이면 알림 발송
    if (match.send && match.score >= threshold) {
      await notify(job, match);
      notified++;
    }

    // Gemini 무료 티어 분당 요청 제한(15 RPM) 대응
    await sleep(DEFAULT_RATE_LIMIT_DELAY_MS);
  }

  console.log(
    `크롤러 완료 — 저장: ${saved}개, 알림: ${notified}개, 스킵: ${skipped}개, Gemini 호출: ${geminiCallCount}회`
  );
}

/**
 * 등록된 모든 크롤러를 실행하고 결과를 합칩니다.
 * 새 크롤러 추가 시 이 함수에만 추가하면 됩니다.
 */
async function runCrawlers(): Promise<RawJobPosting[]> {
  const results = await Promise.allSettled([
    crawlWanted(),
    crawlSaramin(),
    crawlJobkorea(),
  ]);

  return results.flatMap((result) => {
    if (result.status === "fulfilled") return result.value;
    console.error("[크롤러 오류]", result.reason);
    return [];
  });
}

/**
 * Slack 알림을 발송합니다.
 * TODO: 이메일 알림 활성화 시 notify/email.ts의 sendEmailNotification 추가
 */
async function notify(
  job: RawJobPosting,
  match: Awaited<ReturnType<typeof calculateMatchScore>>
): Promise<void> {
  await sendSlackNotification(job, match).catch((err) =>
    console.error("[Slack 알림 실패]", err)
  );
}

main().catch((err) => {
  console.error("크롤러 실행 오류:", err);
  process.exit(1);
});
