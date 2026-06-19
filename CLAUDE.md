# 프로젝트 개발 규칙 (반드시 준수)

## 프로젝트 개요

소·중형 단일 매장부터 다점포 사업장까지, 근무 스케줄 편성과 급여 계산을 자동화하는 SaaS

- **관리자(웹)**: 스케줄 편성, 근태 관리, 급여 정산

---

## 기술 스택

새 파일을 생성하거나 기능을 구현할 때 아래 스택만 사용한다. 임의로 대체 라이브러리를 추가하지 않는다.
`docs/stack.md`에 명시된 라이브러리 버전을 임의로 변경하거나 업그레이드하지 않는다. 버전 변경이 필요한 경우 반드시 팀과 협의 후 `docs/stack.md`를 먼저 업데이트한다.
앱별 상세 규칙은 각 앱의 `CLAUDE.md`를 참조한다.

| 영역                   | 핵심 기술                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| 관리자 웹 (`apps/web`) | Next.js (App Router), React, TypeScript, Tailwind CSS, @moyeorak/design-system(1순위) + shadcn/ui(보조)      |
| 백엔드 (`apps/api`)    | Express, TypeScript, PostgreSQL, Prisma                                                                      |
| 공통                   | Zustand (전역 상태), TanStack Query (서버 상태), React Hook Form + Zod (폼)                                  |
| 테스트                 | Vitest + React Testing Library + MSW (Frontend), Jest + Supertest (Backend)                                  |
| 인프라                 | AWS EC2 (백엔드 API + Next.js SSR), S3 + CloudFront (정적 에셋 CDN), GitHub Actions (CI/CD), pnpm Workspaces |

**상태 분류 원칙**: 서버 데이터 → TanStack Query / UI 전역 상태 → Zustand / 폼 상태 → React Hook Form / 컴포넌트 로컬 상태 → useState

---

## 프로젝트 구조

```
final-project/
├── apps/
│   ├── web/          # Next.js — 관리자 웹 (데스크탑 전용)
│   └── api/          # Express — 백엔드 API 서버
├── packages/
│   ├── shared/       # 공유 Zod 스키마, API 타입, 유틸 (@ilgam/shared)
│   └── database/     # Prisma 스키마·마이그레이션·클라이언트 헬퍼 (@ilgam/database)
└── docs/             # PRD, 기능 명세, 기술 스택 정의서, 아키텍처 결정 기록 등
```

**패키지 역할 구분**

- `packages/database` — Prisma schema, migrations, seed, Prisma client helper 전담. `apps/api`는 여기서 export하는 `prisma` 또는 `createPrismaClient`를 사용한다.
- `packages/shared` — 웹·API가 공유하는 Zod 스키마, API 요청·응답 타입, 순수 유틸. 공유가 필요한 타입은 `packages/shared/src/index.ts`에서 export한다.

---

## 개발 명령어

```bash
pnpm dev          # Next.js 웹만 실행
pnpm dev:api      # DB 빌드 후 Express API 실행
pnpm dev:all      # 웹 + API 병렬 실행

pnpm db:generate  # Prisma 클라이언트 재생성 (스키마 변경 후 필수)
pnpm db:migrate   # 마이그레이션 실행
pnpm db:push      # 스키마 즉시 반영 (개발 전용)
pnpm db:studio    # Prisma Studio 실행
pnpm db:reset     # DB 초기화
```

---

## Git 명령어 실행 위치

모노레포에서는 여러 패키지의 코드가 동시에 변경되는 경우가 잦다. **모든 `git` 명령어(`add`, `commit`, `push`, `status` 등)는 반드시 프로젝트 루트 디렉토리에서 실행한다.**

```bash
# ❌ 금지: 특정 앱/패키지 폴더 안에서 실행
cd apps/web && git add .  # packages/의 변경사항이 누락됨

# ✅ 권장: 항상 루트 디렉토리에서 실행
git add .  # 저장소 전체의 모든 변경사항이 안전하게 스테이징됨
```

---

## 커밋 컨벤션

```
type(scope): 한 줄 설명 (50자 이내)

[선택] 본문 — 왜 변경했는지 (72자 줄 바꿈)
[선택] 꼬리말 — 관련 이슈 번호
```

### 타입

| 타입       | 설명                                    |
| ---------- | --------------------------------------- |
| `feat`     | 새로운 기능 추가                        |
| `fix`      | 버그 수정                               |
| `refactor` | 기능 변경 없는 코드 구조 개선           |
| `test`     | 테스트 코드 추가/수정                   |
| `style`    | 코드 포맷, 세미콜론 등 (로직 변경 없음) |
| `perf`     | 성능 개선                               |
| `docs`     | 문서 추가/수정                          |
| `chore`    | 빌드 설정, 패키지 관리, CI 수정 등      |

### 스코프(Scope)

어떤 모듈이 변경되었는지 타입 뒤 괄호에 명시한다. 여러 패키지가 복합적으로 변경된 경우 스코프를 생략한다.

| 스코프   | 해당 경로                                     |
| -------- | --------------------------------------------- |
| `web`    | `apps/web`                                    |
| `api`    | `apps/api`                                    |
| `db`     | `packages/database` (스키마·마이그레이션)     |
| `shared` | `packages/shared` (공유 타입·Zod 스키마·유틸) |
| `repo`   | 루트 설정, CI/CD, 문서 전체                   |

**예시**

- `feat(web): 조직 생성 페이지 UI 구현`
- `feat(api): 조직 생성 API 구현`
- `fix(db): 근로자 테이블 상태 컬럼명 수정`
- `chore(repo): pnpm 의존성 업데이트`
- `feat: 회원가입 기능 및 DB 스키마 연동` ← 여러 패키지 복합 변경 시 스코프 생략

**규칙**

- 제목은 현재형 동사 또는 명사형 (구현, 수정, 추가)
- 제목 끝 마침표 생략
- 관련 이슈가 있으면 꼬리말에 `Closes #번호` 또는 `Related to #번호` 명시

---

## 이슈 생성 단위 기준

**1 이슈 = 1 PR** 원칙. 레이어(DB / API / UI)가 다르면 이슈를 분리한다.

| 레이어       | 스코프   | 이슈 제목 예시                          |
| ------------ | -------- | --------------------------------------- |
| DB 스키마    | `db`     | `feat(db): 조직·근로자 테이블 설계`     |
| 공유 타입    | `shared` | `feat(shared): 조직 API 응답 타입 정의` |
| 백엔드 API   | `api`    | `feat(api): 조직 생성 API 구현`         |
| 관리자 웹 UI | `web`    | `feat(web): 조직 생성 페이지 UI 구현`   |

이슈 제목 형식은 커밋 컨벤션과 동일하다(`type(scope): 설명`).
이슈 본문 작성 형식 → `.github/ISSUE_TEMPLATE/feature_request.md`

---

## 브랜치 전략

```
main
└── develop
    ├── feature/기능명
    ├── fix/버그명
    ├── refactor/리팩터링명
    ├── test/테스트명
    ├── docs/문서명
    └── chore/작업명
```

- `main`, `develop`에 직접 push 금지
- 모든 작업은 이슈를 먼저 생성하고 브랜치명에 이슈 번호 포함 권장 (`feature/12-login-api`)
- `feature → develop`: **Squash and merge**
- `develop → main`: **Merge commit** + 버전 태그 (`v0.1.0`)
- PR은 가능하면 **500줄 이내**로 분리

### develop → main 머지 기준

`develop → main` 머지는 **일정이 아닌 배포 이벤트**에 맞춘다. **마일스톤(FR) 단위**로 관련 기능이 모두 완료되고 `develop`에서 검증이 끝났을 때 머지한다.

```
예시
feat(db): 회원·조직 테이블 설계  ─┐
feat(api): 조직 생성 API        ─┤→ develop 검증 → main 머지 → v0.1.0 태그
feat(web): 조직 생성 UI         ─┘
```

- `develop`은 항상 실행 가능한 상태를 유지한다. CI가 깨진 채로 두지 않는다.
- 기능이 절반만 구현된 상태로 `develop`에 머지하지 않는다.
- `main` 머지 후 반드시 버전 태그를 달아 롤백 기준점을 남긴다.

### 브랜치 생성 의무 조건

다음 조건 중 하나라도 해당하면 반드시 새 브랜치를 생성한다.

| 조건                    | 이유                                        | 브랜치명 예시                 |
| ----------------------- | ------------------------------------------- | ----------------------------- |
| DB 스키마 변경          | 마이그레이션 롤백이 까다로워 이력 격리 필요 | `feature/db-worker-schema`    |
| 3개 이상 파일 동시 변경 | 영향 범위가 넓어 리뷰·롤백 용이성 확보      | `feature/org-create-flow`     |
| 새로운 스펙(기능) 시작  | 스펙 단위 작업 이력 분리 및 추적            | `feature/fr-1-org-management` |

### 스펙 단위 작업 워크플로우

새로운 기능을 개발할 때는 아래 순서를 따른다.

```bash
# 1. 최신화 및 브랜치 생성
git checkout develop
git pull origin develop
git checkout -b feature/fr-1-org-management

# 2. 루트에서 커밋
git add .
git commit -m "feat(web): 조직 생성 페이지 UI 구현"

# 3. 푸시 및 PR 생성
git push origin feature/fr-1-org-management
```

### 작업 중 다른 버그·수정 발견 시

현재 브랜치에서 그대로 수정하지 않는다. 모노레포에서는 하나의 수정이 다른 모듈에 예상치 못한 영향을 줄 수 있다.

1. 하던 작업을 먼저 커밋한다.
2. 버그 수정용 새 브랜치(`fix/버그명`)를 생성하거나 메모해 둔다.
3. 작업 컨텍스트를 분리하여 해결한다.

---

## 참고 문서

- 제품 요구사항 → `docs/PRD.md`
- 기능 명세 → `docs/SPEC.md`
- 기술 스택 정의 (버전·호환성) → `docs/stack.md`
- 검증 계획 및 기술 리스크 → `docs/TEST_PLAN.md`
- API 서버 개발 규칙 → `apps/api/CLAUDE.md`
- 관리자 웹 개발 규칙 → `apps/web/CLAUDE.md`
- PR 작성 형식 → `.github/pull_request_template.md`
- 이슈 작성 형식 → `.github/ISSUE_TEMPLATE/feature_request.md`
