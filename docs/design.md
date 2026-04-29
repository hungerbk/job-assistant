# Job Assistant 설계 문서

> 채용 공고 수집 · 면접 연습 · 자소서 작성을 하나의 모노레포에서 운영하는 개인 취업 도우미 시스템

---

## 목차

1. [전체 아키텍처](#전체-아키텍처)
2. [프로젝트 구조](#프로젝트-구조)
3. [환경 설정](#환경-설정)
4. [사용자 프로필 파일](#사용자-프로필-파일)
5. [서비스 1 - 채용 공고 수집 & 알림](#서비스-1---채용-공고-수집--알림)
6. [서비스 2 - 면접 연습 챗봇](#서비스-2---면접-연습-챗봇)
7. [서비스 3 - 자소서 작성 도우미](#서비스-3---자소서-작성-도우미)
8. [서비스 간 연결](#서비스-간-연결)
9. [DB 스키마](#db-스키마)
10. [AI 프롬프트 설계](#ai-프롬프트-설계)
11. [기술 스택 요약](#기술-스택-요약)

---

## 전체 아키텍처

```
[서비스 1] 크롤러 (GitHub Actions Cron, 하루 2회)
      │
      ├─ 취업 사이트 크롤링 (원티드, 사람인, 잡코리아 등)
      ├─ 중복 제거 (URL 해시)
      ├─ Gemini API로 JD ↔ 내 프로필 매칭 점수 계산
      ├─ 제외 목록 필터
      └─ Slack + 이메일 알림 발송
             │
             ▼
         Supabase (공고 DB)
             │
      ┌──────┴──────┐
      ▼             ▼
[서비스 2]      [서비스 3]
면접 연습        자소서 작성
Slack Bot       (추후 결정)
      │             │
      └──────┬──────┘
             ▼
    Gemini API (단일 클라이언트)
    (면접관 역할 / 기업 정보 검색)
```

---

## 프로젝트 구조

```
job-assistant/
├── apps/
│   ├── crawler/              # 서비스 1: 공고 수집 크롤러 (Node.js)
│   │   ├── src/
│   │   │   ├── crawlers/     # 사이트별 크롤러
│   │   │   ├── filter/       # 중복 제거, AI 매칭, 제외 목록
│   │   │   └── notify/       # Slack, 이메일 발송
│   │   └── package.json
│   │
│   └── bot/                  # 서비스 2, 3: Slack Bot (Node.js)
│       ├── src/
│       │   ├── actions/      # 공고 알림 버튼 액션 핸들러
│       │   ├── interview/    # 면접 연습 핸들러
│       │   ├── resume/       # 자소서 작성 핸들러
│       │   ├── cs/           # CS 면접 질문 핸들러
│       │   └── utils/        # 에러 알림 등 유틸리티
│       └── package.json
│
├── packages/
│   └── shared/               # 공통 모듈
│       ├── db.ts             # Supabase 클라이언트
│       ├── gemini.ts         # Gemini API 유틸 (매칭, 면접, 자소서, 기업정보 통합)
│       └── types.ts          # 공통 타입
│
├── profile/
│   ├── profile.example.md    # ✅ 커밋 O (템플릿)
│   ├── profile.md            # ❌ 커밋 X
│   └── companies/
│       ├── company.example.md # ✅ 커밋 O (템플릿)
│       └── 토스.md            # ❌ 커밋 X
│
├── supabase/
│   └── migrations/           # DB 스키마
│
├── .github/
│   └── workflows/
│       └── crawler.yml       # Cron 스케줄 (하루 2회)
│
├── .env.example              # ✅ 커밋 O
├── .env                      # ❌ 커밋 X
├── .gitignore
├── turbo.json
└── package.json
```

---

## 환경 설정

### `.env.example`

```env
# AI
GEMINI_API_KEY=

# DB
SUPABASE_URL=
SUPABASE_ANON_KEY=

# 알림
SLACK_WEBHOOK_URL=          # 공고 알림용
SLACK_BOT_TOKEN=            # Slack Bot용 (면접 연습)
SLACK_SIGNING_SECRET=
EMAIL_FROM=
SENDGRID_API_KEY=

# 내 프로필 (단순 값)
MY_CAREER_YEARS=3
MY_SKILLS=React,TypeScript,Next.js
MY_PREFERRED_COMPANY_SIZE=스타트업,중견
MY_EXCLUDED_CONDITIONS=게임회사,교대근무,퍼블리셔
MY_MIN_SALARY=5000
MY_JOB_CATEGORY=프론트엔드

# 공고 매칭 기준 점수 (0~100)
MATCH_SCORE_THRESHOLD=70
```

### `.gitignore` 추가 항목

```
.env
profile/profile.md
profile/companies/*.md
!profile/companies/company.example.md
```

---

## 사용자 프로필 파일

### `profile/profile.example.md`

```markdown
## 기본 정보

- 직군: 프론트엔드
- 경력: 3년
- 주요 스킬: React, TypeScript, Next.js

## STAR 경험

### [경험 제목 예: 레거시 코드 성능 개선]

- Situation: 상황 설명
- Task: 맡은 역할
- Action: 구체적으로 한 일
- Result: 결과 (수치 포함)

### [경험 제목 예: 팀 내 갈등 해결]

- Situation:
- Task:
- Action:
- Result:

## 자기소개 (30초 버전)

...

## 지원 동기 포인트

- 왜 이 직군을 선택했는가:
- 커리어 방향:
```

### `profile/companies/company.example.md`

```markdown
## 회사명

### 기본 정보

- 업종:
- 규모:
- 지원 직군:

### 인재상 & 핵심가치

...

### 최근 뉴스 / 이슈

- [날짜] 내용

### 자소서 문항

<!-- 문항이 없으면 이 섹션 삭제. 문항이 있으면 번호와 글자 수 제한 함께 기재 -->

1. (예) 지원 동기를 작성해 주세요. (500자 이내)
2. (예) 본인의 강점과 약점을 작성해 주세요. (800자 이내)
3. (예) 팀워크 경험을 서술해 주세요. (1000자 이내)

### 메모 (면접 준비)

- 지원 이유:
- 예상 질문:
```

---

## 서비스 1 - 채용 공고 수집 & 알림

### 흐름

```
GitHub Actions Cron
      │
      ▼
각 사이트 크롤러 실행 (Playwright)
      │
      ▼
URL 해시로 중복 제거 → 이미 DB에 있으면 스킵
      │
      ▼
제외 목록 확인 → 제외된 회사/공고면 스킵
      │
      ▼
Gemini API로 매칭 점수 계산
      │
   점수 >= 임계값?
   YES → DB 저장 + Slack & 이메일 발송
   NO  → DB에 저장만 (알림 없음)
```

### 크롤링 대상 사이트

| 사이트   | 방법                     | 상태     |
| -------- | ------------------------ | -------- |
| 원티드   | 공개 REST API            | ✅ 구현  |
| 사람인   | 공개 REST API (Open API) | ✅ 구현  |
| 잡코리아 | 미정 (스텁)              | ⏳ 미구현 |

### GitHub Actions Cron 스케줄

```yaml
# .github/workflows/crawler.yml
on:
  schedule:
    - cron: "0 23 * * *" # 한국시간 오전 8시 (UTC 23시)
    - cron: "0 9 * * *" # 한국시간 오후 6시 (UTC 9시)
  workflow_dispatch: # 수동 실행도 가능
```

### 제외 목록

- 사용자가 Slack 알림 메시지에서 "관심 없음" 버튼 클릭 시 DB에 저장
- `(회사명 + 직군)` 또는 공고 URL 기준으로 이후 동일 공고 필터링

### Gemini 무료 티어 요청 제한 대응

Gemini 무료 티어는 분당 15회, 일일 약 1500회 요청 제한이 있어, 공고가 한 번에 많이 수집되거나 누적 호출이 많으면 오류가 발생할 수 있음.

**대응 전략 (3단계):**

1. **분당 RPM 대응** — `packages/shared/gemini.ts`의 `DEFAULT_RATE_LIMIT_DELAY_MS`(4초)를 호출 사이에 삽입.
2. **셀프 리밋** — `GEMINI_REQUESTS_PER_RUN` 환경변수로 1회 실행당 호출 한도를 설정. 일일 할당량의 일부(예: 90%)만 사용하고 남은 분량은 봇 서비스(/interview, /coverletter)용으로 예약. 한도 도달 시 즉시 종료 + Slack 알림.
3. **일일 할당량 소진 감지** — 429 에러의 `errorDetails`에서 `PerDay` 위반을 감지하면 `DailyQuotaExceededError`로 즉시 중단(분 단위 재시도가 무의미하므로 시간 낭비 방지).

### 알림 포맷 (Slack)

```
📌 [회사명] 포지션명
매칭 점수: 85점
✅ 매칭: React, TypeScript 모두 요구 / 스타트업 / 연봉 범위 적합
❌ 미스매치: 없음

🔗 <공고 URL|공고 바로가기>

[관심 없음] [면접 연습] [자소서 작성]
```

> Slack의 `<URL|텍스트>` 문법으로 링크를 인라인으로 표시합니다.

---

## 서비스 2 - 면접 연습 챗봇

### 채널

- **Slack Bot** (메인) — 모바일에서도 사용 가능
- 추후 Discord, 카카오톡 등으로 확장 가능 (Webhook 방식으로 채널만 교체)

### 흐름

```
사용자: /interview [회사명] 또는 [공고 ID]
      │
      ▼
해당 공고 JD + 기업 정보(companies/*.md) + 내 profile.md 로드
      │
      ▼
Gemini API 시스템 프롬프트 구성
      │
      ▼
면접관 역할로 첫 질문 발송
      │
      ▼
사용자 답변 → Gemini 피드백 + 꼬리질문
      │
      ▼
/end 입력 시 → 전체 세션 총평 발송
```

### 세션 관리

- 대화 히스토리를 Supabase에 저장
- 매 메시지마다 전체 히스토리를 Gemini API에 전달 (무상태)
- 세션 ID: `{userId}_{timestamp}`

### Slack Bot 명령어

| 명령어                | 설명                             |
| --------------------- | -------------------------------- |
| `/interview`          | 최근 알림받은 공고 목록에서 선택 |
| `/interview [회사명]` | 특정 회사로 면접 연습 시작       |
| `/end`                | 세션 종료 + 총평                 |
| `/hint`               | 현재 질문에 대한 답변 힌트       |
| `/cs`                 | CS 면접 질문 (랜덤 또는 카테고리 지정) |
| `/cs [카테고리]`      | 특정 카테고리 CS 질문              |
| `/cs 목록`            | CS 질문 카테고리 목록              |

---

## 서비스 3 - 자소서 작성 도우미

> UI 방식은 추후 결정. 우선 Slack Bot으로 구현, 필요 시 웹으로 확장.

### 흐름

```
사용자: /coverletter [회사명]
      │
      ▼
공고 JD + companies/회사명.md 로드
      │
      ▼
Gemini API로 최신 뉴스/인재상 보완 (없는 경우)
      │
      ▼
Gemini API: JD 분석 → 어떤 경험을 강조할지 추천
      │
      ▼
사용자가 항목 선택 → Gemini가 초안 생성
      │
      ▼
사용자 수정 요청 → Gemini 피드백 반복
      │
      ▼
최종본 출력 (Slack 메시지 또는 파일)
```

### Slack Bot 명령어

| 명령어                  | 설명                         |
| ----------------------- | ---------------------------- |
| `/coverletter [회사명]` | 자소서 작성 시작             |
| `/analyze`              | JD 분석 + 강조할 경험 추천   |
| `/draft`                | 초안 생성                    |
| `/clfeedback`           | 현재 초안에 대한 피드백 요청 |

---

## 서비스 간 연결

### 공고 → 면접 → 자소서

```
서비스 1 알림 메시지 (Slack)
  └─ [면접 연습 시작] 버튼 클릭
        └─ 서비스 2: 해당 공고 JD 자동 주입
  └─ [자소서 작성] 버튼 클릭
        └─ 서비스 3: 해당 공고 JD 자동 주입
```

### 공통으로 사용하는 데이터

| 데이터               | 출처                     | 사용처         |
| -------------------- | ------------------------ | -------------- |
| 내 프로필, STAR 경험 | `profile/profile.md`     | 서비스 1, 2, 3 |
| 기업 정보            | `profile/companies/*.md` | 서비스 2, 3    |
| 최신 뉴스            | Gemini API               | 서비스 2, 3    |
| 공고 JD              | Supabase (서비스 1 수집) | 서비스 2, 3    |

---

## DB 스키마

### `job_postings` (공고)

```sql
CREATE TABLE job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  url_hash TEXT UNIQUE NOT NULL,   -- 중복 제거용
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  jd TEXT,
  source TEXT,                     -- 'wanted', 'saramin' 등
  match_score INTEGER,             -- AI 매칭 점수
  match_reasons JSONB,
  is_excluded BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `excluded_jobs` (제외 목록)

```sql
CREATE TABLE excluded_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  job_category TEXT,               -- 직군 단위로 제외 가능
  url_hash TEXT,                   -- 특정 공고만 제외
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `interview_sessions` (면접 세션)

```sql
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID REFERENCES job_postings(id),
  slack_user_id TEXT NOT NULL,       -- Slack 사용자 ID (세션 조회용)
  company TEXT,
  history JSONB DEFAULT '[]',      -- 전체 대화 내역
  summary TEXT,                    -- 세션 종료 시 총평
  status TEXT DEFAULT 'active',    -- 'active' | 'ended'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);
```

### `coverletter_drafts` (자소서 초안)

```sql
CREATE TABLE coverletter_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID REFERENCES job_postings(id),
  slack_user_id TEXT NOT NULL,
  company TEXT,
  questions JSONB DEFAULT '[]',    -- 자소서 문항 [{question, max_length}]
  content TEXT,                    -- 문항 없는 경우 단일 텍스트
  content_by_question JSONB,       -- 문항 있는 경우 [{question, answer}]
  version INTEGER DEFAULT 1,
  feedback JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## AI 프롬프트 설계

### 서비스 1 - 공고 매칭 프롬프트

```
당신은 채용 공고 매칭 전문가입니다.

[내 프로필]
{profile.md 내용}

[채용 공고]
회사: {company}
포지션: {position}
JD: {jd (핵심 부분만 전처리)}

아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.
{
  "score": 0~100,
  "match_reasons": ["이유1", "이유2"],
  "mismatch_reasons": ["이유1"],
  "send": true or false
}

send는 score가 {MATCH_SCORE_THRESHOLD} 이상일 때 true입니다.
```

### 서비스 2 - 면접 연습 시스템 프롬프트

```
당신은 [회사명] [포지션] 포지션의 시니어 면접관입니다.

[채용 공고 JD]
{jd}

[회사 정보]
{companies/회사명.md 내용}
{Gemini로 가져온 최신 뉴스}

[지원자 프로필]
{profile.md 내용}

면접 진행 규칙:
- 한 번에 하나의 질문만 합니다.
- 지원자의 답변 후 반드시 아래 세 가지를 제공합니다:
  1. 답변의 잘한 점
  2. 부족하거나 보완할 점
  3. 꼬리질문 1~2개
- 기술 질문, 경험 질문, 인성 질문을 골고루 섞어서 진행합니다.
- 경험 질문 시 STAR 구조로 답변하도록 유도합니다.
- /end 명령을 받으면 전체 면접에 대한 총평을 제공합니다.
```

### 서비스 3 - 자소서 작성 시스템 프롬프트

```
당신은 채용 전문가이자 자소서 코치입니다.

[채용 공고 JD]
{jd}

[회사 정보]
{companies/회사명.md 내용}
{Gemini로 가져온 최신 뉴스 및 인재상}

[지원자 프로필 및 STAR 경험]
{profile.md 내용}

[자소서 문항]
<!-- 문항이 있는 경우에만 포함 -->
1. {문항1} ({글자수} 이내)
2. {문항2} ({글자수} 이내)

역할:
1. JD를 분석하여 회사가 원하는 핵심 역량을 추출합니다.
2. 지원자의 STAR 경험 중 JD에 가장 적합한 것을 추천합니다.
3. 초안 작성 요청 시 지원자의 실제 경험 기반으로 자소서를 작성합니다.
   - 자소서 문항이 있는 경우: 문항별로 각각 작성하며 글자 수 제한을 반드시 준수합니다.
   - 자소서 문항이 없는 경우: 지원 동기, 강점, 경험 순서로 자유 형식으로 작성합니다.
4. 수정 요청 시 구체적인 피드백과 개선안을 제시합니다.
- 지어내지 않고, 반드시 프로필에 있는 경험만 활용합니다.
```

### Gemini - 기업 정보 보완 프롬프트

```
[회사명]에 대해 아래 항목을 간결하게 알려줘.
검색 결과 기준으로 최신 정보를 우선으로 해줘.
모든 항목에 출처 URL을 반드시 포함해줘. 확인되지 않은 정보는 포함하지 마.

1. 인재상 및 핵심가치 (공식 사이트 기준)
2. 최근 6개월 주요 뉴스 (3개 이내)
3. 사업 방향 및 현재 집중 분야

JSON 형식으로만 응답해줘:
{
  "talent_values": {
    "summary": "...",
    "source_url": "https://..."
  },
  "recent_news": [
    { "title": "...", "summary": "...", "date": "YYYY-MM-DD", "source_url": "https://..." }
  ],
  "business_focus": {
    "summary": "...",
    "source_url": "https://..."
  }
}
```

출처 URL이 없는 항목은 응답에서 제외합니다.
Slack 알림 및 자소서/면접 프롬프트 삽입 시 각 항목 옆에 링크를 함께 표시합니다.

---

## 기술 스택 요약

| 역할           | 기술                                              |
| -------------- | ------------------------------------------------- |
| 모노레포 관리  | Turborepo                                         |
| 언어           | TypeScript (Node.js)                              |
| 크롤링         | REST API (fetch)                                  |
| 스케줄러       | GitHub Actions Cron                               |
| 메인 AI        | Gemini API (gemini-2.0-flash)                     |
| 기업 정보 검색 | Gemini API (통합, 별도 클라이언트 불필요)         |
| DB             | Supabase (PostgreSQL)                             |
| 알림 채널      | Slack Webhook + SendGrid                          |
| 면접/자소서 봇 | Slack Bot (Bolt SDK)                              |
| 배포           | GitHub Actions (크롤러) / Railway 무료 티어 (Bot) |

---

## 개발 우선순위 (권장 순서)

1. **모노레포 기본 세팅** — Turborepo, 공통 패키지, Supabase 연결
2. **프로필 파일 작성** — `profile.md`, 기업 정보 파일
3. **서비스 1** — 크롤러 1개 사이트부터 시작 → AI 매칭 → Slack 알림
4. **서비스 2** — Slack Bot + 면접 연습 기본 기능
5. **서비스 3** — 자소서 초안 생성
6. **통합** — 공고 알림 버튼 → 면접/자소서 연결
