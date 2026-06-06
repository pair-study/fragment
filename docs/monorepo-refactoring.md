# 모노레포 구조 재편 — 작업 기록 (2026-06-06)

> 이 문서는 Claude Code와 함께 진행한 프로젝트 초기 구조 정비 작업을 기록합니다.
> 팀원 온보딩 및 변경 맥락 공유를 위해 작성되었습니다.

---

## 배경 — 왜 재편이 필요했나

초기 세팅 이후 문서와 실제 코드 사이에 다음 5가지 불일치가 발견되었습니다.

| # | 문제 | 근거 문서 |
|---|------|-----------|
| 1 | `PrismaService`, `PrismaModule`이 `apps/api/src/prisma/`에 있었음 (규칙상 `packages/database/src/`에 있어야 함) | `apps/api/CLAUDE.md` — "apps/api에 Prisma 관련 파일을 직접 두지 않습니다" |
| 2 | `packages/shared/` 패키지가 없었음 | `docs/stack.md` — packages/shared (공유 타입·Zod 스키마·유틸) |
| 3 | `apps/app/` 디렉터리가 없었음 | 모노레포 구조 정의 |
| 4 | `apps/web/CLAUDE.md`가 `@AGENTS.md` 한 줄뿐이었음 | — |
| 5 | 패키지 이름이 `@repo/database`였으나 문서 기준은 `@ilgam/database` | `apps/api/CLAUDE.md` 스택 표 |

---

## CLAUDE.md 파일 구조 — 역할과 로드 방식

작업 전에 Claude Code의 컨텍스트 로드 방식을 먼저 정리했습니다.

```
로드 순서 (세션 시작 시 자동 주입)
1. ~/.claude/CLAUDE.md          ← 글로벌 (모든 프로젝트 공통)
2. <project-root>/CLAUDE.md     ← 프로젝트 전체 규칙
3. <project-root>/CLAUDE.local.md  ← 개인용 (gitignore 권장)
4. apps/api/CLAUDE.md           ← 해당 디렉터리 작업 시에만 로드
   apps/web/CLAUDE.md
   apps/app/CLAUDE.md
```

**핵심**: 서브 디렉터리의 `CLAUDE.md`는 그 디렉터리 안에서 작업할 때만 컨텍스트에 추가됩니다. 그래서 `docs/api_CLAUDE.md` 처럼 docs/에 모아두면 Claude가 해당 앱 작업 시 자동으로 읽지 않습니다.

### 파일별 역할 분리 원칙

| 파일 | 담아야 할 내용 |
|------|---------------|
| 루트 `CLAUDE.md` | 전 패키지 공통 규칙 — 커밋 컨벤션, 브랜치 전략, 모노레포 구조, 패키지 역할 |
| `apps/*/CLAUDE.md` | 해당 앱의 기술 스택, 디렉터리 구조, 앱별 규칙 |
| `docs/stack.md` | 버전·호환성 레퍼런스 (Claude 지침 아님, 사람이 읽는 문서) |
| `docs/PRD.md`, `SPEC.md` | 제품 요구사항·기능 명세 (Claude 지침 아님) |

---

## 수행한 작업 — 4 Phase

### Phase 1: CLAUDE.md 파일 배치

| 작업 | 상세 |
|------|------|
| `apps/api/CLAUDE.md` 신규 생성 | NestJS 모듈 규칙, Prisma 사용 규칙, 인증/인가, 에러 형식 등 |
| `apps/web/CLAUDE.md` 교체 | `@AGENTS.md` 한 줄 → Next.js App Router 규칙, shadcn/ui, 상태 관리 등으로 교체 (`AGENTS.md`는 유지) |
| `apps/app/CLAUDE.md` 신규 생성 | Expo Router, NativeWind, GPS 규칙, Push 알림 등 |
| `docs/api_CLAUDE.md` 삭제 | `apps/api/CLAUDE.md`로 이동 완료 |
| `docs/web_CLAUDE.md` 삭제 | `apps/web/CLAUDE.md`로 이동 완료 |
| `docs/app_CLAUDE.md` 삭제 | `apps/app/CLAUDE.md`로 이동 완료 |

### Phase 2: `packages/shared` 패키지 신규 생성

웹·앱·API가 공유하는 Zod 스키마, API 타입, 순수 유틸을 담는 패키지입니다.

```
packages/shared/
├── src/
│   ├── types/api/index.ts   # API 요청·응답 타입 (골격, 개발 시 채워야 함)
│   ├── schemas/index.ts     # Zod 스키마 (골격, 개발 시 채워야 함)
│   ├── utils/gps.ts         # GPS 반경 판정 유틸 (구현 완료)
│   └── index.ts
├── package.json             # name: @ilgam/shared
└── tsconfig.json
```

- `apps/web`과 `apps/app` 모두 여기서 Zod 스키마와 타입을 가져와야 합니다.
- 앱별로 동일한 스키마를 중복 정의하지 않습니다.

### Phase 3: `packages/database` 정비 — 코드 이동

`PrismaService`와 `PrismaModule`이 `apps/api/src/prisma/`에 있었는데, 규칙상 `packages/database/src/`에 있어야 합니다.

**변경 전:**
```
apps/api/src/prisma/
├── prisma.service.ts   ← apps/api 안에 있었음
└── prisma.module.ts
```

**변경 후:**
```
packages/database/src/
├── prisma.service.ts   ← 이동, @prisma/client 직접 import로 변경
├── database.module.ts  ← 이동 + 모듈명 PrismaModule → DatabaseModule
└── index.ts            ← PrismaService, DatabaseModule export 추가
```

`apps/api/src/app.module.ts`도 함께 수정했습니다:
```ts
// 변경 전
import { PrismaModule } from './prisma/prisma.module'

// 변경 후
import { DatabaseModule } from '@ilgam/database'
```

### Phase 4: 패키지 이름 정리 (`@repo` → `@ilgam`)

`@repo/`는 Turborepo 기본 네임스페이스입니다. 프로젝트 이름인 `@ilgam/`으로 통일했습니다.

| 파일 | 변경 내용 |
|------|-----------|
| `packages/database/package.json` | `@repo/database` → `@ilgam/database` |
| `apps/api/package.json` | name: `api` → `@ilgam/api`, dependency 업데이트, `start:dev` 스크립트 추가 |
| `apps/web/package.json` | name: `web` → `@ilgam/web` |
| `package.json` (루트) | 모든 `--filter` 값 업데이트 |

---

## 변경 전후 구조 비교

### 변경 전
```
final-project/
├── apps/
│   ├── api/
│   │   └── src/prisma/          # PrismaService, PrismaModule 여기 있었음
│   └── web/
│       └── CLAUDE.md            # @AGENTS.md 한 줄뿐
├── packages/
│   └── database/                # @repo/database, PrismaService 없음
└── docs/
    ├── api_CLAUDE.md            # 잘못된 위치
    ├── web_CLAUDE.md            # 잘못된 위치
    └── app_CLAUDE.md            # 잘못된 위치
```

### 변경 후
```
final-project/
├── apps/
│   ├── api/
│   │   ├── CLAUDE.md            # ← 신규
│   │   └── src/                 # prisma/ 디렉터리 삭제됨
│   ├── web/
│   │   ├── AGENTS.md            # 유지
│   │   └── CLAUDE.md            # ← 실제 내용으로 교체
│   └── app/
│       └── CLAUDE.md            # ← 신규 (디렉터리도 신규)
├── packages/
│   ├── shared/                  # ← 신규 (@ilgam/shared)
│   │   └── src/
│   │       ├── types/api/
│   │       ├── schemas/
│   │       └── utils/gps.ts
│   └── database/                # @ilgam/database
│       └── src/
│           ├── prisma.service.ts    # ← apps/api에서 이동
│           ├── database.module.ts   # ← apps/api에서 이동, 이름 변경
│           └── index.ts             # ← export 추가
└── docs/
    ├── PRD.md
    ├── SPEC.md
    ├── stack.md
    └── adr/                     # Architecture Decision Records (비어있음, 개발하며 채울 것)
```

---

## 루트 CLAUDE.md 수정 사항

루트 `CLAUDE.md`도 함께 정비했습니다.

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 기술 스택 | 앱별 3개 상세 표 (중복) | 요약 표 1개 + `docs/stack.md` 참조 |
| 버전 변경 규칙 | 없음 | `docs/stack.md` 기준, 임의 변경 금지 명시 |
| 인프라 설명 | `S3 & CloudFront — 프론트엔드 정적 호스팅` | EC2 (API + Next.js SSR) / S3+CloudFront (정적 에셋) 분리 |
| 프로젝트 구조 | `packages/database` 하나 | `packages/shared` + `packages/database` 역할 분리 |
| 공유 타입 경로 | `packages/database/src/index.ts` | `packages/shared/src/index.ts` |
| 커밋 스코프 | 5개 | `shared` 추가하여 6개 |
| 참고 문서 | 4개, 경로 오류 | 8개, 경로 수정 및 앱 CLAUDE.md 경로 추가 |

## PR 템플릿 수정 사항

`.github/pull_request_template.md`도 함께 수정했습니다.

- 영향 범위에 `shared — packages/shared` 체크박스 추가
- 체크리스트 `공유 타입(packages/database)` → `공유 타입·스키마(packages/shared)`로 수정

---

## 앞으로 해야 할 일

- `packages/shared/src/types/api/` — 도메인별 API 타입 파일 추가 (auth, schedule, attendance, payroll, members)
- `packages/shared/src/schemas/` — 도메인별 Zod 스키마 추가
- `apps/app/` — Expo 앱 초기화 (`pnpm create expo-app` 또는 `npx create-expo-app`)
- `packages/database/prisma/migrations/` — 첫 마이그레이션 생성
- `packages/database/prisma/seed.ts` — 시드 데이터 작성
- `docs/adr/` — 주요 기술 결정 이유 기록 시작 (예: `0001-pnpm-workspaces.md`, `0002-prisma-packages-database.md`)
