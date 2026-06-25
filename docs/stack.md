# 기술 스택 정의서

이 문서는 MVP 구현에서 사용하는 기술 스택의 기준 문서입니다. 각 작업 영역의 `CLAUDE.md`는 이 문서를 참조하고, 상세 버전 변경이 생기면 이 문서를 함께 갱신합니다.

## 1. 공통

| 항목 | 선택 |
| --- | --- |
| Monorepo | pnpm Workspaces `10.x` |
| Runtime | Node.js `22.x` LTS |
| Language | TypeScript `5.x` |
| Formatter | Prettier `3.x` |
| Git Hooks | Husky `9.x`, commitlint `21.x` |

## 2. Frontend

| 항목 | 선택 |
| --- | --- |
| Framework | Next.js `15.3.x` |
| UI Library | React `19.1.x` |
| Styling | Tailwind CSS `4.1.x` |
| Design System | `@moyeorak/design-system` `0.3.x` |
| UI 보조 | shadcn/ui, Radix UI |
| Icon | lucide-react |

### 적용 기준

- 운영 웹은 반응형으로 구현합니다.
- 컴포넌트는 `@moyeorak/design-system`을 우선 사용합니다.
- 디자인 시스템에 없는 컴포넌트만 shadcn/ui 또는 Radix UI 기반으로 보완합니다.
- Tailwind CSS v4와 함께 사용할 때는 전역 CSS 진입점에서 `@moyeorak/design-system/layers.css`를 가장 먼저 import하고, `@moyeorak/design-system/styles.css`를 함께 import합니다.
- 화면 상태는 서버 상태, 전역 UI 상태, 로컬 UI 상태, 폼 상태를 구분합니다.

### 상태와 폼 적용 기준

| 구분 | 선택 | 사용 기준 |
| --- | --- | --- |
| Server State | TanStack Query `5.x` | API 조회, 캐싱, 재요청, mutation |
| Form | React Hook Form `7.x` | 입력 폼 상태 관리 |
| Form Resolver | `@hookform/resolvers` `5.x` | React Hook Form과 Zod 연결 |
| Validation | Zod `3.25.x` | 폼/API schema 검증 |
| Global UI State | Zustand `5.x` | 화면 간 공유가 필요한 UI 상태가 생길 때만 사용 |

상태/폼 라이브러리는 해당 기능 구현 코드와 함께 `apps/web/package.json`에 추가합니다.

## 3. Backend

| 항목 | 선택 |
| --- | --- |
| API Server | Express `5.x` |
| Runtime | Node.js `22.x` LTS |
| Language | TypeScript `5.x` |
| Database | PostgreSQL `17.x` |
| ORM | Prisma `6.8.x` |
| Auth | JWT 기반 인증 |
| Validation | Zod `3.25.x` |

### 적용 기준

- `apps/api`는 HTTP API와 인증, 요청 검증, 서비스 호출을 담당합니다.
- Prisma schema, migration, seed, Prisma client helper는 `packages/database`에서 관리합니다.
- 공통 타입과 Zod schema는 필요할 때 `packages/shared`에 둡니다.
- 인증 라이브러리는 인증 구현 코드와 함께 `apps/api/package.json`에 추가합니다.
- 스케줄 추천은 MVP에서 동기 API로 처리합니다. 별도 worker나 queue는 도입하지 않습니다.

## 4. Testing

| 영역 | 선택 | MVP 적용 범위 |
| --- | --- | --- |
| Frontend | Vitest `4.x`, React Testing Library `16.x`, jest-dom `6.x`, jsdom `29.x` | 복잡한 유틸 또는 hook 검증 |
| API | Jest `29.x`, Supertest `7.x` | 주요 엔드포인트 요청/응답, 인증, 검증 실패 |

테스트 라이브러리는 테스트 설정 파일과 첫 테스트 코드가 들어가는 작업에서 `package.json`에 함께 추가합니다.
Frontend는 기본적으로 typecheck/lint를 우선하고, 복잡한 유틸 또는 hook을 추가할 때 테스트를 작성합니다.
프론트 API mocking은 필요해지는 테스트 범위가 확정될 때 MSW 도입 여부와 버전을 함께 결정합니다.

### 테스트 우선순위

1. 스케줄 추천 입력 조건 검증
2. DRAFT/CONFIRMED 상태 전환
3. 인력 삭제 후 남은 인력 기준의 추천 생성
4. 가능 시간 저장/수정/삭제
5. 최소 인원 조건 검증
6. 인증 후 조직 존재 여부에 따른 라우팅

## 5. Infrastructure

### 1차 MVP 배포

| 영역 | 선택 |
| --- | --- |
| Web | Vercel |
| API | Railway |
| Database | Railway PostgreSQL |
| CI | GitHub Actions |

MVP에서는 Railway 안에서 API와 PostgreSQL을 함께 운영해 배포 복잡도를 낮춥니다.

## 6. API Documentation

| 단계 | 선택 |
| --- | --- |
| MVP 개발 중 | Notion 또는 Markdown 기반 API 명세 |
| 엔드포인트 안정 후 | OpenAPI/Swagger 문서화 |

MVP에서는 프론트와 API 작업자가 먼저 요청/응답 계약을 빠르게 맞추는 것이 우선입니다. OpenAPI/Swagger는 엔드포인트 구조가 안정된 뒤 도입합니다.

## 7. Workspace Structure

```txt
apps/
  api/          Express API
  web/          Next.js 운영 웹

packages/
  database/     Prisma schema, migrations, seed, Prisma client helper
  shared/       공유 타입, Zod schema, 유틸

docs/
  PRD.md
  SPEC.md
  stack.md
  adr/
```
