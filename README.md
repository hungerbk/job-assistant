# Job Assistant

채용 공고 수집 · 면접 연습 · 자소서 작성을 하나의 모노레포에서 운영하는 개인 취업 도우미 시스템

## 서비스 구성

| 서비스 | 설명 | 실행 환경 |
|--------|------|-----------|
| **크롤러** | 채용 사이트 공고 수집 → Gemini 매칭 → Slack 알림 | GitHub Actions (하루 2회) |
| **Slack Bot** | 면접 연습 챗봇 + 자소서 작성 도우미 | Render (상시 실행) |

```
[크롤러] 원티드·사람인 크롤링
       → Gemini로 내 프로필과 매칭 점수 계산
       → Slack 알림 (매칭 점수 ≥ 임계값)
              │
     [관심 없음] [면접 연습] [자소서 작성]
                    │             │
              [Slack Bot] ←────────
              면접 연습 / 자소서 작성
```

## 프로젝트 구조

```
job-assistant/
├── apps/
│   ├── crawler/          # 공고 수집 크롤러
│   │   └── src/
│   │       ├── crawlers/ # 사이트별 크롤러 (wanted, saramin, jobkorea)
│   │       ├── filter/   # 중복 제거, Gemini 매칭, 제외 목록, 크로스 플랫폼 중복
│   │       └── notify/   # Slack 알림
│   └── bot/              # Slack Bot
│       └── src/
│           ├── interview/ # 면접 연습 (/interview, /end, /hint)
│           ├── resume/    # 자소서 작성 (/coverletter, /analyze, /draft, /clfeedback)
│           └── actions/   # 버튼 액션 핸들러
├── packages/
│   └── shared/           # 공통 모듈 (Gemini API, Supabase, 타입)
├── profile/
│   ├── profile.example.md        # 프로필 템플릿
│   └── companies/
│       └── company.example.md    # 기업 정보 템플릿
├── supabase/
│   └── migrations/       # DB 스키마
└── docs/
    ├── design.md          # 설계 문서
    └── adding-crawlers.md # 크롤러 추가 가이드
```

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 값을 채웁니다:

| 변수 | 설명 | 필수 |
|------|------|------|
| `GEMINI_API_KEY` | Google Gemini API 키 | ✅ |
| `SUPABASE_URL` | Supabase 프로젝트 URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase anon 키 | ✅ |
| `SLACK_WEBHOOK_URL` | 공고 알림용 Incoming Webhook URL | ✅ |
| `SLACK_BOT_TOKEN` | Slack Bot 토큰 (`xoxb-...`) | Bot 사용 시 |
| `SLACK_SIGNING_SECRET` | Slack 앱 Signing Secret | Bot 사용 시 |
| `MATCH_SCORE_THRESHOLD` | 알림 발송 기준 점수 (기본값: 70) | |
| `SARAMIN_API_KEY` | 사람인 Open API 키 | 사람인 크롤러 사용 시 |

### 3. DB 스키마 적용

Supabase 대시보드 SQL Editor에서 실행:

```bash
supabase/migrations/20260414000000_initial_schema.sql
```

### 4. 프로필 파일 작성

```bash
cp profile/profile.example.md profile/profile.md
```

`profile/profile.md`를 열어 본인의 경력, 스킬, STAR 경험을 작성합니다.
이 파일은 Gemini 매칭, 면접 연습, 자소서 작성 전반에 사용됩니다.

특정 기업 준비 시 기업 정보 파일도 추가:

```bash
cp profile/companies/company.example.md profile/companies/토스.md
```

## 크롤러 실행

```bash
npm run build --workspace=packages/shared
npm run build --workspace=apps/crawler
cd apps/crawler && node dist/index.js
```

또는 로컬 개발 시:

```bash
npm run dev --workspace=apps/crawler
```

## Slack Bot 실행

```bash
npm run build --workspace=packages/shared
npm run build --workspace=apps/bot
npm run start:bot
```

## 배포

### 크롤러 — GitHub Actions

`.github/workflows/crawler.yml`이 하루 2회(KST 08:00, 18:00) 자동 실행됩니다.

GitHub 저장소 Settings → Secrets and variables에 아래 시크릿을 추가하세요:

- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SLACK_WEBHOOK_URL`
- `SARAMIN_API_KEY` (사람인 사용 시)

Variables에 추가:
- `MY_JOB_CATEGORY` (예: `프론트엔드`)
- `MATCH_SCORE_THRESHOLD` (예: `70`)

수동 실행은 Actions 탭 → Job Crawler → Run workflow.

### Slack Bot — Render

| 항목 | 값 |
|------|-----|
| Root Directory | (비워두기) |
| Build Command | `npm ci && npx turbo run build --filter=@job-assistant/bot...` |
| Start Command | `npm run start:bot` |

Environment Variables에 `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`를 추가합니다.

## Slack Bot 명령어

### 면접 연습

| 명령어 | 설명 |
|--------|------|
| `/interview [회사명]` | 면접 연습 시작 (공고 알림 버튼으로도 시작 가능) |
| `/hint` | 현재 질문 힌트 |
| `/end` | 세션 종료 + 총평 |

### 자소서 작성

| 명령어 | 설명 |
|--------|------|
| `/coverletter [회사명]` | 자소서 작성 시작 |
| `/analyze` | JD 분석 + 강조할 경험 추천 |
| `/draft` | 초안 생성 |
| `/clfeedback` | 초안 피드백 |

## 새 크롤러 추가

[docs/adding-crawlers.md](docs/adding-crawlers.md) 참고

## 기술 스택

| 역할 | 기술 |
|------|------|
| 모노레포 | Turborepo + npm workspaces |
| 언어 | TypeScript (Node.js 24) |
| AI | Google Gemini API (gemini-2.0-flash) |
| DB | Supabase (PostgreSQL) |
| 알림 | Slack Webhook (Block Kit) |
| Bot | Slack Bolt SDK |
| 스케줄러 | GitHub Actions Cron |
| Bot 배포 | Render |
