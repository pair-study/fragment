# Fragment · 프래그먼트

**소규모 조직의 근무 스케줄을 추천하고, 조정·확정·보관하는 웹 서비스입니다.**

조직의 영업시간, 근무자별 가능 시간, 주간 계약 시간, 시간대별 최소 필요 인원을 모아 스케줄 초안을 만듭니다. 운영자는 추천 결과와 부족한 인원을 확인하고, 배정을 수정한 뒤 최종 근무표를 확정하고 CSV로 내보낼 수 있습니다.

- 저장소: [pair-study/fragment](https://github.com/pair-study/fragment)
- 서비스 주소: [fragment.io.kr](https://fragment.io.kr) — 저장소에 등록된 주소이며, 현재 배포 상태는 별도 확인이 필요합니다.
- 문서 기준: **2026-10-23**, `develop`의 `99d30a3` 소스와 설정. 아래 구현 범위는 코드 확인 결과이며 운영 환경의 동작 검증 결과를 뜻하지 않습니다.

## 현재 구현 범위

Next.js 운영 웹과 Express API, PostgreSQL로 구성된 **단일 조직 관리 MVP**입니다. 관리자가 근무자의 정보를 직접 입력하는 흐름이며, 아래 화면과 API가 연결되어 있습니다.

| 영역           | 구현 내용                                                                       | 웹 경로                              |
| -------------- | ------------------------------------------------------------------------------- | ------------------------------------ |
| 인증           | 회원가입, 로그인·로그아웃, 세션 갱신, 인증·조직 상태에 따른 화면 이동           | `/signup`, `/login`                  |
| 조직           | 계정당 조직 1개 생성·조회·수정, 요일별 영업시간·휴무일·익일 종료 설정           | `/organization/new`, `/organization` |
| 인력           | 등록·조회·수정·삭제, 사번 자동 생성, 주간 계약 시간 관리                        | `/workers`                           |
| 최소 인원 조건 | 요일·시간대별 필요 인원 등록·조회·수정·삭제                                     | `/staffing-rules`                    |
| 가능 시간      | 활성 근무 기간 설정, 근무자별 30분 단위 가능 시간 입력·일괄 저장                | `/availability`                      |
| 스케줄         | 추천 생성, 가능 후보·추천 배정·미충족 조건 조회, 초안 배정 추가·수정·삭제, 확정 | `/schedules`                         |
| 보관함         | 확정 이력의 연도·월 필터, 상세 달력, CSV 내보내기                               | `/schedule-history`                  |
| 대시보드       | 조직 운영 정보, 가장 최근 확정 스케줄, CSV 내보내기                             | `/dashboard`                         |

### 기본 사용 순서

```text
회원가입·로그인 → 조직 생성 및 영업시간 설정
→ 인력 등록 → 최소 인원 조건 등록
→ 근무 기간 설정 및 인력별 가능 시간 저장
→ 스케줄 추천 → 초안 검토·조정 → 확정
→ 대시보드·보관함 조회 및 CSV 내보내기
```

**최소 인원 조건을 가능 시간보다 먼저 등록해야 합니다.** 영업시간 안이라도 최소 인원 조건이 없는 시간대는 가능 시간 입력과 자동 추천 대상이 아닙니다.

## 스케줄 추천 정책

외부 AI 모델이나 별도 작업 큐 없이 API 서버 안에서 동기적으로 실행하는 규칙 기반 로직입니다.

1. 영업시간, 최소 인원 조건, 근무자의 가능 시간이 겹치는 구간을 계산합니다.
2. 해당 구간 전체에 근무할 수 있는 사람을 **가능 후보**로 저장합니다.
3. 시간 중복을 피하면서 최소 필요 인원을 우선 채우고, 주간 계약 시간 사용률과 당일 배정량 등을 고려해 **추천 배정**을 선택합니다.
4. 필요한 인원보다 배정 인원이 적으면 **미충족 조건**으로 기록합니다.
5. 결과를 `DRAFT`로 저장하고, 운영자의 검토 후 `CONFIRMED`로 전환합니다.

예를 들어 영업시간이 `09:00~18:00`, 최소 인원 조건이 `12:00~14:00 / 3명`, 가능한 근무자가 2명이면 해당 구간에 2명을 추천하고 부족 인원 1명을 표시합니다. 나머지 영업시간은 자동 추천 대상에서 제외합니다.

- **주간 계약 시간은 배분 기준이며 강제 상한이 아닙니다.** 최소 필요 인원을 채우기 위해 계약 시간을 넘길 수 있습니다.
- 추천 요청 기간은 조직의 활성 근무 기간과 같아야 합니다.
- 같은 입력과 기간에 대한 초안이 이미 있으면 중복 생성은 `409 DRAFT_ALREADY_EXISTS`로 거절합니다.
- 확정 스케줄은 보관함에서 조회·내보내기하며, 일반 초안 편집 API로 변경할 수 없습니다.
- 이름과 사번을 배정 시점의 스냅샷으로 저장해 근무자 삭제 후에도 과거 근무표를 조회할 수 있습니다.
- 휴게 시간 자동 삽입, 하루 최대 근무 시간, 연속 근무일 제한, 숙련도·역할별 배정은 현재 MVP 범위에 포함하지 않습니다.

상세 기준은 [스케줄 추천 정책](docs/SCHEDULING_POLICY.md)을 확인하세요.

## 기술 스택

| 구분         | 사용 기술                                                               |
| ------------ | ----------------------------------------------------------------------- |
| 실행 환경    | Node.js 22.x, pnpm 10.x (`packageManager`: 10.34.1), TypeScript 5.x     |
| 웹           | Next.js 15.3.x App Router, React 19.1.x                                 |
| UI           | Tailwind CSS 4.1.x, `@moyeorak/design-system` 0.3.x, shadcn/ui·Radix UI |
| 서버 상태·폼 | TanStack Query 5.x, React Hook Form 7.x, Zod 3.25.x                     |
| API          | Express 5.x, JWT access token, refresh token cookie, bcryptjs           |
| DB           | PostgreSQL 17.x 기준, Prisma 6.8.x                                      |
| 테스트       | 웹: Vitest·React Testing Library / API: Jest·Supertest                  |
| 품질 관리    | ESLint, Prettier, Husky, commitlint, GitHub Actions                     |
| 배포 구성    | 웹: Vercel / API·PostgreSQL: Railway — 프로젝트 문서 기준               |

Zustand는 기술 스택 문서에 도입 기준이 정의되어 있지만 현재 웹 패키지 의존성에는 없습니다. 도입 기준은 [기술 스택 정의서](docs/stack.md), 실제 설치 버전은 `pnpm-lock.yaml`을 확인합니다.

## 프로젝트 구조

```text
fragment/
├── apps/
│   ├── web/                  # Next.js 운영 웹
│   │   └── src/
│   │       ├── app/          # 인증·온보딩·관리 화면 라우트
│   │       ├── features/     # 기능별 UI, API 호출, Query hooks
│   │       ├── components/   # 공통 UI·레이아웃
│   │       └── lib/          # API 클라이언트·유틸
│   └── api/                  # Express API
│       └── src/
│           ├── routes/       # HTTP 라우팅
│           ├── modules/      # 기능별 handler·service·추천 로직
│           └── middlewares/  # 인증·조직 접근·요청 검증·에러 처리
├── packages/
│   ├── shared/               # @fragment/shared: 공통 Zod 스키마·API 타입
│   └── database/             # @fragment/database: Prisma·migration·seed
├── docs/                     # 제품·기능·API·DB·추천 정책 문서
└── .github/workflows/ci.yml   # PR 대상 품질 검사
```

```mermaid
flowchart LR
    Browser[운영자 브라우저] --> Web[Next.js 운영 웹]
    Web -->|/api 프록시| API[Express API]
    API --> Prisma[Prisma]
    Prisma --> DB[(PostgreSQL)]
    Shared[공유 타입 · Zod 스키마] -.-> Web
    Shared -.-> API
```

개발 환경에서는 Next.js가 `/api/*` 요청을 기본적으로 `http://localhost:3001/api/*`로 전달합니다. Access token은 웹 메모리에서 관리하고 refresh token은 HttpOnly cookie로 전달합니다. API는 인증 사용자와 소유 조직을 기준으로 데이터에 접근합니다.

## 로컬 실행

### 준비 및 설치

- Node.js **22.x** (`.nvmrc` 기준)
- pnpm **10.34.1** (`package.json` 기준)
- 실행 중인 PostgreSQL과 개발용 데이터베이스
- 비공개 저장소에 접근할 수 있는 GitHub 계정

아래 명령은 저장소 루트에서 실행합니다. `.npmrc`의 `engine-strict=true` 때문에 다른 Node.js 메이저 버전에서는 의존성 설치가 거절될 수 있습니다.

```bash
git clone https://github.com/pair-study/fragment.git
cd fragment
git switch develop
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
```

Windows PowerShell에서도 `cp`를 사용할 수 있습니다. 루트 `.env`의 DB 연결 정보와 JWT secret을 로컬 값으로 수정하고, **`packages/database/.env`에도 같은 `DATABASE_URL`을 설정**합니다.

```dotenv
# packages/database/.env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DB_NAME"
```

API의 개발 실행 스크립트는 루트 `.env`를 명시적으로 읽습니다. Prisma CLI는 database 패키지에서 실행되므로 DB용 `.env`를 따로 준비합니다. 두 파일의 DB 연결 대상은 같아야 합니다.

```bash
pnpm db:generate
pnpm db:migrate
pnpm --filter @fragment/shared build
pnpm dev:all
```

`db:migrate`는 개발용 데이터베이스에 저장소의 마이그레이션을 적용합니다. PostgreSQL 사용자에게 개발 마이그레이션에 필요한 권한이 있어야 합니다.

| 접속 대상          | 로컬 주소                              |
| ------------------ | -------------------------------------- |
| 운영 웹            | http://localhost:3000                  |
| REST API 기준 경로 | http://localhost:3001/api              |
| Swagger UI         | http://localhost:3001/api/docs         |
| OpenAPI JSON       | http://localhost:3001/api/openapi.json |

### 환경변수

| 변수                           | 로컬 기본값·예시                                    | 용도·설정 위치                                                               |
| ------------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| `DATABASE_URL`                 | `postgresql://USER:PASSWORD@localhost:5432/DB_NAME` | 루트 `.env`와 `packages/database/.env`에 동일하게 설정                       |
| `JWT_ACCESS_SECRET`            | 직접 지정한 로컬 secret                             | API access token 서명, 루트 `.env`                                           |
| `WEB_APP_ORIGIN`               | `http://localhost:3000`                             | API CORS·인증 요청 origin 검사, 루트 `.env`                                  |
| `JWT_ACCESS_EXPIRES_IN`        | `15m`                                               | Access token 유효기간, 루트 `.env`                                           |
| `REFRESH_TOKEN_EXPIRES_DAYS`   | `7`                                                 | Refresh token 유효기간, 루트 `.env`                                          |
| `API_PUBLIC_BASE_URL`          | `http://localhost:3001/api`                         | OpenAPI에 표시할 API 주소, 루트 `.env`                                       |
| `PORT`                         | `3001`                                              | API 실행 포트, 필요하면 루트 `.env`에 추가                                   |
| `NEXT_PUBLIC_API_BASE_URL`     | `/api`                                              | 브라우저 API 요청 기준 경로, 변경 시 `apps/web/.env.local`에 설정            |
| `API_PROXY_ORIGIN`             | 개발 시 `http://localhost:3001`                     | Next.js 프록시 목적지. `/api`를 제외한 origin을 `apps/web/.env.local`에 설정 |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | 빈 값                                               | 선택: GitHub MCP 개발 도구용. 서비스 실행에는 불필요                         |

Next.js의 환경변수는 `apps/web/.env.local` 또는 배포 플랫폼의 웹 환경변수에 설정합니다. 루트 `.env`만 바꿔서는 Next.js 설정에 반영되지 않습니다. API 포트를 바꾸면 프록시와 OpenAPI 주소도 맞춰 주세요.

운영 웹은 `/api`를 API 서버로 전달할 프록시 구성이 필요합니다. Vercel에서는 `API_PROXY_ORIGIN`을 Railway API origin으로 설정하고, API에는 실제 웹 origin과 공개 API 주소를 설정합니다. 운영 refresh cookie는 `Secure`를 사용하므로 HTTPS 환경을 전제로 합니다.

### 선택: 개발용 샘플 데이터

```bash
pnpm --filter @fragment/database exec node --env-file=.env -r ts-node/register prisma/seed.ts
```

Seed는 샘플 관리자·카페 조직·근무자 3명·최소 인원 조건·활성 근무 기간을 만듭니다. 로그인 정보는 개발용 예제인 `owner@fragment.local` / `Password123!`입니다.

- 샘플 근무 기간은 **2026-06-22~2026-07-05**로 고정되어 있습니다. 현재 날짜로 사용하려면 화면에서 기간을 다시 설정하세요.
- 가능 시간과 스케줄은 seed에서 생성하지 않으므로 직접 입력·추천해야 합니다.
- 재실행하면 샘플 조직의 기존 최소 인원 조건을 교체하므로 개발용 DB에서 사용하세요.

## 자주 쓰는 명령어

| 명령어              | 동작                                                      |
| ------------------- | --------------------------------------------------------- |
| `pnpm dev`          | 웹만 실행                                                 |
| `pnpm dev:api`      | database 빌드 후 API 실행; API 스크립트에서 shared도 빌드 |
| `pnpm dev:all`      | database 빌드 후 웹·API 병렬 실행                         |
| `pnpm build`        | 웹 프로덕션 빌드                                          |
| `pnpm build:api`    | API와 의존 워크스페이스 패키지 빌드                       |
| `pnpm db:generate`  | Prisma Client 생성                                        |
| `pnpm db:migrate`   | 개발 마이그레이션 실행                                    |
| `pnpm db:studio`    | Prisma Studio 실행                                        |
| `pnpm db:push`      | 개발용 DB에 스키마 직접 반영                              |
| `pnpm db:reset`     | 개발용 DB 초기화; 기존 데이터 삭제                        |
| `pnpm format:check` | 저장소 포맷 검사                                          |
| `pnpm test:web`     | 웹 Vitest 실행                                            |
| `pnpm test:api`     | API Jest 실행                                             |
| `pnpm test`         | 웹·API 테스트 순차 실행                                   |

`packages/shared`의 배포 진입점은 `dist`이므로 웹만 실행하거나 빌드하기 전에는 `pnpm --filter @fragment/shared build`를 먼저 실행합니다. 공유 코드 수정 후에도 다시 빌드해야 합니다.

### 품질 검사와 CI

```bash
pnpm format:check
pnpm --filter @fragment/shared build
pnpm db:generate
pnpm --filter @fragment/database build
pnpm --filter @fragment/web lint
pnpm --filter @fragment/web typecheck
pnpm test:web
pnpm --filter @fragment/api lint
pnpm --filter @fragment/api typecheck
pnpm test:api
```

GitHub Actions는 `main`·`develop` 대상 PR에서 위 범위의 포맷·타입·린트·테스트를 검사합니다. 현재 CI에는 프로덕션 빌드나 실제 DB를 사용하는 전체 사용자 흐름 검증은 포함되어 있지 않습니다.

## 개발을 다시 시작할 때

1. [제품 요구사항](docs/PRD.md)과 [기능 명세](docs/SPEC.md)에서 MVP 흐름을 확인합니다.
2. [추천 정책](docs/SCHEDULING_POLICY.md)을 읽고 최소 인원 조건 → 가능 시간 → 추천 순서로 로컬에서 확인합니다.
3. [API 계약](docs/API.md), [OpenAPI](docs/openapi.yaml), [ERD](docs/ERD.md)를 실제 route·service·Prisma 스키마와 함께 확인합니다.
4. 배포 환경변수, DB 마이그레이션 적용 상태, 저장소 이름 변경 후 Vercel·Railway의 GitHub 연동을 확인합니다.
5. [열린 이슈](https://github.com/pair-study/fragment/issues)와 [PR](https://github.com/pair-study/fragment/pulls)을 확인한 뒤 작업 이슈와 브랜치를 만듭니다.

프로젝트 규칙상 `main`·`develop`에 직접 push하지 않습니다. 작업 이슈를 먼저 만들고 별도 브랜치에서 변경한 후 `develop`으로 PR을 올립니다. 커밋 형식은 `type(scope): 설명`이며, `feature → develop`은 squash merge, `develop → main`은 배포 시 merge commit과 버전 태그를 사용합니다.

상세 규칙은 [루트 규칙](CLAUDE.md), [웹 규칙](apps/web/CLAUDE.md), [API 규칙](apps/api/CLAUDE.md)을 참고하세요.
