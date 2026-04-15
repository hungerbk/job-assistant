# 새 크롤러 추가 가이드

새로운 채용 사이트 크롤러를 추가하는 방법을 단계별로 설명합니다.

## 1단계 — 크롤러 파일 생성

`apps/crawler/src/crawlers/` 아래에 `{사이트명}.ts` 파일을 만듭니다.

반환 타입은 반드시 `Promise<RawJobPosting[]>` 이어야 합니다:

```typescript
// apps/crawler/src/crawlers/mysite.ts
import { isJobAlreadyExists } from "@job-assistant/shared";
import { hashUrl } from "../filter/dedup";
import type { RawJobPosting } from "./types";

export async function crawlMysite(): Promise<RawJobPosting[]> {
  // 1. 목록 API(또는 HTML) 호출
  const listings = await fetchListings();
  const results: RawJobPosting[] = [];
  let consecutiveDuplicates = 0;

  for (const item of listings) {
    const url = `https://mysite.com/jobs/${item.id}`;

    // 2. DB에서 중복 확인 (상세 요청 전에 먼저 체크)
    const isDup = await isJobAlreadyExists(hashUrl(url));
    if (isDup) {
      consecutiveDuplicates++;
      if (consecutiveDuplicates >= 3) {
        console.log(`[마이사이트] 연속 ${consecutiveDuplicates}개 중복 → 조기 종료`);
        break;
      }
      continue;
    }
    consecutiveDuplicates = 0;

    // 3. 상세 JD 수집 (가능한 경우)
    const jd = await fetchJobDetail(item.id); // 없으면 null

    results.push({
      url,
      company: item.companyName,
      position: item.title,
      jd,
      source: "other", // 아래 4단계 참고
    });
  }

  console.log(`[마이사이트] 신규 공고 ${results.length}개 수집`);
  return results;
}
```

### RawJobPosting 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| `url` | `string` | 공고 상세 URL (중복 키로 사용됨) |
| `company` | `string` | 회사명 |
| `position` | `string` | 포지션명 |
| `jd` | `string \| null` | 채용공고 본문. 수집 불가 시 null |
| `source` | `JobSource` | 플랫폼 식별자 (아래 참고) |

## 2단계 — source 타입에 사이트 추가 (필요 시)

`wanted`, `saramin`, `jobkorea`, `linkedin`, `other` 외의 새 사이트라면
`packages/shared/src/types.ts`의 `JobSource` 타입에 추가합니다:

```typescript
// packages/shared/src/types.ts
export type JobSource = "wanted" | "saramin" | "jobkorea" | "linkedin" | "mynewsite" | "other";
```

## 3단계 — index.ts에 크롤러 등록

`apps/crawler/src/index.ts`의 `runCrawlers()` 함수에 추가합니다:

```typescript
import { crawlMysite } from "./crawlers/mysite";

async function runCrawlers(): Promise<RawJobPosting[]> {
  const results = await Promise.allSettled([
    crawlWanted(),
    crawlSaramin(),
    crawlJobkorea(),
    crawlMysite(), // ← 여기에 추가
  ]);
  // ...
}
```

크롤러는 병렬로 실행되므로 순서는 관계없습니다.
동일한 공고가 여러 플랫폼에 있으면 `removeCrossplatformDuplicates()`가 자동으로 처리합니다.

## 4단계 — 환경변수 추가 (API 키가 필요한 경우)

API 키 없이 스킵할 수 있도록 처리합니다:

```typescript
export async function crawlMysite(): Promise<RawJobPosting[]> {
  const apiKey = process.env.MYSITE_API_KEY;
  if (!apiKey) {
    console.log("[마이사이트] MYSITE_API_KEY 미설정 → 스킵");
    return [];
  }
  // ...
}
```

그리고 다음 두 곳에 추가합니다:

**.env.example**
```
# MYSITE_API_KEY=    # 마이사이트 API 키 (없으면 스킵)
```

**.github/workflows/crawler.yml**
```yaml
env:
  MYSITE_API_KEY: ${{ secrets.MYSITE_API_KEY }}
```

GitHub 저장소 Settings → Secrets and variables → Actions 에서 시크릿을 추가하세요.

## 5단계 — 타입 체크 확인

```bash
npm run type-check --workspace=apps/crawler
```

오류 없이 통과하면 완료입니다.

---

## 사이트별 접근 방식 참고

| 사이트 | 방식 | 비고 |
|--------|------|------|
| 원티드 | 공개 REST API | API 키 불필요 |
| 사람인 | 공개 REST API | API 키 필요 (무료 발급) |
| 잡코리아 | 미구현 (공개 API 없음) | Playwright 또는 비공식 API 분석 필요 |
| 링크드인 | 비공식 API 또는 스크래핑 | 이용약관 확인 필요 |

## 크로스 플랫폼 중복 처리

같은 공고가 여러 플랫폼에 동시 게시되는 경우, `filter/crossplatform.ts`가
**(회사명 + 포지션명)** 정규화 키를 기준으로 자동 제거합니다.

- `runCrawlers()` 반환값에 자동 적용됨
- 목록 앞 항목(더 높은 우선순위 플랫폼)이 유지됨
- 현재 우선순위: 원티드 → 사람인 → 잡코리아 → 추가된 순서
