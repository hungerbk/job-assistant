/**
 * 채용 공고 수집 크롤러 진입점
 *
 * 실행 흐름:
 * 1. 각 사이트 크롤러 실행 (현재: 원티드)
 * 2. URL 해시 기반 중복 제거
 * 3. 제외 목록 필터링
 * 4. Gemini API로 매칭 점수 계산 (요청 사이 딜레이 적용)
 * 5. DB 저장
 * 6. 매칭 점수 >= 임계값이면 Slack + 이메일 알림 발송
 */
import "dotenv/config";
import { getSupabaseClient, sleep, DEFAULT_RATE_LIMIT_DELAY_MS } from "@job-assistant/shared";
import type { JobPosting } from "@job-assistant/shared";
import { crawlWanted } from "./crawlers/wanted";
import { isDuplicate, hashUrl } from "./filter/dedup";
import { isExcluded } from "./filter/exclude";
import { calculateMatchScore } from "./filter/match";
import { sendSlackNotification } from "./notify/slack";
import { sendEmailNotification } from "./notify/email";
import type { RawJobPosting } from "./crawlers/types";

async function main(): Promise<void> {
  console.log("크롤러 시작...");

  // 1. 크롤링 실행
  const rawJobs = await runCrawlers();
  console.log(`총 ${rawJobs.length}개 공고 수집`);

  let saved = 0;
  let notified = 0;
  let skipped = 0;

  const db = getSupabaseClient();
  const threshold = Number(process.env.MATCH_SCORE_THRESHOLD ?? 70);

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

    // 4. Gemini API 매칭 점수 계산 (배치 호출 사이 딜레이)
    console.log(`[매칭 중] ${job.company} — ${job.position}`);
    let match;
    try {
      match = await calculateMatchScore(job);
    } catch (err) {
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
    `크롤러 완료 — 저장: ${saved}개, 알림: ${notified}개, 스킵: ${skipped}개`
  );
}

/**
 * 등록된 모든 크롤러를 실행하고 결과를 합칩니다.
 * 새 크롤러 추가 시 이 함수에만 추가하면 됩니다.
 */
async function runCrawlers(): Promise<RawJobPosting[]> {
  const results = await Promise.allSettled([crawlWanted()]);

  return results.flatMap((result) => {
    if (result.status === "fulfilled") return result.value;
    console.error("[크롤러 오류]", result.reason);
    return [];
  });
}

/**
 * Slack + 이메일 알림을 발송합니다.
 * 어느 한쪽이 실패해도 나머지는 계속 시도합니다.
 */
async function notify(
  job: RawJobPosting,
  match: Awaited<ReturnType<typeof calculateMatchScore>>
): Promise<void> {
  await Promise.allSettled([
    sendSlackNotification(job, match).catch((err) =>
      console.error("[Slack 알림 실패]", err)
    ),
    sendEmailNotification(job, match).catch((err) =>
      console.error("[이메일 알림 실패]", err)
    ),
  ]);
}

main().catch((err) => {
  console.error("크롤러 실행 오류:", err);
  process.exit(1);
});
