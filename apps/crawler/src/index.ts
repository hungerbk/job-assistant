/**
 * 채용 공고 수집 크롤러 진입점
 *
 * 실행 흐름:
 * 1. 각 사이트 크롤러 실행 (원티드, 사람인, 잡코리아)
 * 2. 크로스 플랫폼 중복 제거 (회사명 + 포지션명 기준)
 * 3. URL 해시 기반 중복 제거
 * 4. 제외 목록 필터링
 * 5. 키워드 기반 매칭 점수 계산 (Gemini API 미사용)
 * 6. DB 저장
 * 7. 매칭 점수 >= 임계값이면 Slack 알림 발송
 */
import "dotenv/config";
import { getSupabaseClient } from "@job-assistant/shared";
import type { JobPosting, MatchResult } from "@job-assistant/shared";
import { crawlWanted } from "./crawlers/wanted";
import { crawlSaramin } from "./crawlers/saramin";
import { crawlJobkorea } from "./crawlers/jobkorea";
import { isDuplicate, hashUrl } from "./filter/dedup";
import { isExcluded } from "./filter/exclude";
import { calculateKeywordScore } from "./filter/keyword-match";
import { removeCrossplatformDuplicates } from "./filter/crossplatform";
import { sendSlackNotification } from "./notify/slack";
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

  const db = getSupabaseClient();
  const threshold = Number(process.env.MATCH_SCORE_THRESHOLD || "70");

  for (const job of rawJobs) {
    // 3. 중복 제거
    if (await isDuplicate(job.url)) {
      console.log(`[스킵-중복] ${job.company} — ${job.position}`);
      skipped++;
      continue;
    }

    // 4. 제외 목록 확인
    if (await isExcluded(job)) {
      console.log(`[스킵-제외] ${job.company} — ${job.position}`);
      skipped++;
      continue;
    }

    // 5. 키워드 기반 매칭 점수 계산
    const match = calculateKeywordScore(job);
    console.log(`[매칭] ${job.company} — ${job.position} → 점수: ${match.score} / 알림: ${match.send}`);

    // 6. DB 저장 (점수에 관계없이 모두 저장)
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

    // 7. 임계값 이상이면 알림 발송
    if (match.send && match.score >= threshold) {
      await notify(job, match);
      notified++;
    }
  }

  console.log(
    `크롤러 완료 — 저장: ${saved}개, 알림: ${notified}개, 스킵: ${skipped}개`
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
async function notify(job: RawJobPosting, match: MatchResult): Promise<void> {
  await sendSlackNotification(job, match).catch((err) =>
    console.error("[Slack 알림 실패]", err)
  );
}

main().catch((err) => {
  console.error("크롤러 실행 오류:", err);
  process.exit(1);
});
