# apps/web — CLAUDE.md (운영 웹)

## 역할 및 범위

**스케줄 운영 전용 웹 애플리케이션**입니다.
MVP에서는 회원가입/로그인, 단일 조직 생성·수정, 인력 관리, 가능 시간 관리, 최소 인원 조건 관리, 스케줄 추천·조정·확정, 확정 스케줄 보관함 조회/export를 담당합니다.

MVP 범위에서는 별도 앱을 제공하지 않으므로, 운영 웹은 모바일·태블릿·데스크탑에서 사용할 수 있는 반응형 화면으로 구현합니다.

## 기술 스택

기술 스택과 버전은 루트 `docs/stack.md`를 단일 출처로 따른다. 이 문서에는 운영 웹에서 사용하는 기술의 역할과 적용 규칙만 기록한다.

- Framework: Next.js App Router
- Language: TypeScript
- UI Library: React
- Global State: Zustand
- Server State: TanStack Query
- Form: React Hook Form
- Validation: Zod
- Styling: Tailwind CSS
- UI Components: `@moyeorak/design-system`(1순위) + shadcn/ui(보조)

## 디렉터리 구조

```
apps/web/
└── src/
    ├── app/                  # Next.js App Router 페이지
    │   ├── (auth)/           # 로그인·회원가입 (비인증 레이아웃)
    │   ├── (admin)/          # 인증 후 운영 레이아웃
    │   │   ├── dashboard/        # 조직 정보, 확정 스케줄 달력
    │   │   ├── organization/     # 단일 조직 생성·수정
    │   │   ├── workers/          # 인력 관리
    │   │   ├── availability/     # 가능 시간 관리
    │   │   ├── staffing-rules/   # 최소 인원 조건
    │   │   ├── schedules/        # 스케줄 추천·조정·확정
    │   │   └── schedule-history/ # 보관함
    │   ├── moyeorak-test/    # 디자인 시스템 확인용 임시 페이지
    │   ├── globals.css
    │   └── layout.tsx
    ├── components/
    │   ├── ui/               # shadcn/ui 소스 복사 컴포넌트 (@moyeorak/design-system에 없는 것만)
    │   ├── layout/           # AdminShell, Sidebar 등
    │   └── common/           # 폼 필드, 상태 배지 등 공통 조합 컴포넌트
    ├── features/
    │   ├── auth/             # 로그인·회원가입 폼
    │   ├── dashboard/        # 대시보드
    │   ├── organization/     # 조직 생성·수정
    │   ├── workers/          # 인력 관리
    │   ├── availability/     # 가능 시간 관리
    │   ├── staffing-rules/   # 최소 인원 조건
    │   ├── schedules/        # 스케줄 추천·조정·확정
    │   └── schedule-history/ # 보관함
    ├── lib/                  # 공통 유틸
    └── global.d.ts
```

## 주요 규칙

### 라우팅 및 렌더링

- **App Router**를 사용합니다. `pages/` 디렉터리를 사용하지 마십시오.
- 데이터 패칭은 서버 컴포넌트(RSC)에서 초기 로드, 이후 인터랙션은 TanStack Query로 처리합니다.
- 클라이언트 컴포넌트는 필요한 최소 범위에만 `"use client"`를 선언합니다.

### 상태 관리

- **Zustand**: 필터 조건, 사이드바 상태, 모달 열림 상태 등 순수 UI 전역 상태에 사용합니다.
- **TanStack Query**: 서버에서 오는 모든 데이터(조직 정보, 인력 목록, 가능 시간, 스케줄 목록 등)에 사용합니다. 낙관적 업데이트(optimistic update)를 활용합니다.
- 두 상태를 혼용하지 않습니다. 서버 데이터를 Zustand에 저장하지 마십시오.

### 폼 및 유효성 검증

- 모든 폼은 **React Hook Form + Zod**로 작성합니다.
- Zod 스키마는 `packages/shared`에서 가져옵니다. 웹에서 별도로 정의하지 않습니다.

### 스타일링

- **Tailwind CSS** 유틸리티 클래스만 사용합니다. 인라인 `style` 속성 사용을 지양합니다.
- 디자인 토큰(색상, 간격, 폰트)은 Tailwind CSS 4의 CSS-first 방식에 맞춰 `src/app/globals.css`의 `@theme`와 CSS 변수에서 중앙 관리합니다.
- `max-w-[440px]`, `h-[52px]`, `px-[18px]`처럼 픽셀 값을 arbitrary value로 직접 넣지 않습니다. Tailwind 기본 scale을 먼저 사용하고, 반복되는 값은 `globals.css`의 token으로 승격합니다.
- 컴포넌트 로직과 스타일이 복잡해지면 `variants`(cva) 패턴으로 분리합니다.

### 반응형 기준

- 모든 MVP 화면은 모바일, 태블릿, 데스크탑에서 핵심 액션이 가능해야 합니다.
- 모바일에서는 사이드바를 접힘/오버레이 내비게이션으로 사용하고, 본문 콘텐츠가 가로로 잘리지 않게 합니다.
- 테이블, 달력, 타임테이블처럼 폭이 큰 UI는 모바일에서 가로 스크롤 또는 리스트형 대체 레이아웃을 제공합니다.
- 버튼/입력 필드는 모바일에서 터치 가능한 크기를 유지하고, 텍스트가 버튼이나 셀 밖으로 넘치지 않게 합니다.
- 데스크탑 기준으로만 보이는 정보나 액션을 만들지 않습니다.

### UI 컴포넌트

MVP 화면은 아래 우선순위를 적용합니다.

1. **`@moyeorak/design-system`에 필요한 컴포넌트가 있으면 그것을 사용합니다.** (1순위)
2. 없는 컴포넌트만 **shadcn/ui**를 사용합니다. (보조)
3. 한 화면 안에서 두 라이브러리를 섞어 쓸 수 있습니다. 단, 같은 역할(예: 버튼)에 두 라이브러리 컴포넌트를 동시에 쓰지 않습니다 — 화면 단위로 우선순위 1번을 먼저 확인하고, 없는 요소만 2번으로 채웁니다.

`@moyeorak/design-system`:

- npm 패키지로 설치합니다(`pnpm add @moyeorak/design-system --filter @fragment/web`). 소스를 복사하지 않습니다.
- 컴포넌트는 패키지에서 직접 import합니다. 커스터마이징이 필요하면 패키지 자체를 수정(별도 레포)하거나, 불가피한 경우에만 `components/common/`에서 한 번 감쌉니다.
- 루트 레이아웃(`src/app/layout.tsx`)에서 `@moyeorak/design-system/dist/style.css`를 전역 import합니다.
- 패키지의 CSS는 Panda CSS 기반 자체 디자인 토큰을 쓰므로, shadcn/Tailwind 토큰(`--primary`, `--foreground` 등)과 색상·spacing이 동일하지 않습니다. 한 화면에 섞어 쓸 때 시각적으로 어긋나지 않는지 확인합니다.
- 버전은 `docs/stack.md`에 명시된 범위를 따릅니다. 메이저/마이너 업그레이드는 팀과 협의 후 `docs/stack.md`를 먼저 업데이트합니다.

shadcn/ui (보조):

- shadcn/ui는 패키지가 아닌 소스 복사 방식입니다. `components/ui/`에 복사된 파일을 직접 수정해 커스터마이징합니다.
- `pnpm dlx shadcn@latest add <component>`로 컴포넌트를 추가합니다. 추가 후 팀에 공유합니다.
- 두 라이브러리 모두에 없는 도메인 특화 컴포넌트(스케줄 달력, 가능 시간 타임테이블 등)는 `features/` 아래 도메인 컴포넌트로 구현합니다.
- shadcn/ui 내부적으로 Radix UI primitives를 사용하므로 별도 접근성(a11y) 처리가 필요하지 않습니다.

### 인증 처리

- JWT는 HTTP-only 쿠키에 저장합니다. `localStorage`에 저장하지 마십시오.
- 미인증 접근은 Next.js middleware에서 `/login`으로 리다이렉트합니다.

### 에러 처리

- API 에러는 TanStack Query의 `onError` 또는 `error boundary`에서 처리합니다.
- 사용자에게 노출되는 에러 메시지는 기능 명세서의 "예외 처리" 항목을 따릅니다.

## 테스트

테스트 설정과 첫 테스트 코드를 추가하는 작업에서 Vitest + React Testing Library를 `apps/web/package.json`에 함께 추가합니다.

- 테스트 파일은 별도 `test/` 디렉터리 없이 대상 파일 옆에 코로케이션합니다. (`ScheduleCard.tsx` → `ScheduleCard.test.tsx`)
- 커스텀 훅은 `renderHook`으로 단독 테스트합니다.
- API mocking은 필요해지는 테스트 범위가 확정될 때 MSW 도입 여부와 버전을 함께 결정합니다.

## 개발 서버

```bash
pnpm --filter @fragment/web dev    # http://localhost:3000
pnpm --filter @fragment/web build
pnpm --filter @fragment/web lint
```
