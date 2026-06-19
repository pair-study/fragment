# apps/web — CLAUDE.md (관리자 웹)

## 역할 및 범위

**관리자 전용 웹 애플리케이션**입니다.
근무자 초대·등록, 스케줄 확정, 근태 조회·수정, 급여 명세서 발급을 담당합니다.
대응 FR: FR-1(계정·조직), FR-2(스케줄 관리), FR-3(근태 관리), FR-4(급여), FR-5(인력 관리)

## 기술 스택

| 항목          | 기술                            | 버전                    |
| ------------- | ------------------------------- | ----------------------- |
| Framework     | Next.js (App Router)            | 15.3.x                  |
| Language      | TypeScript                      | 5.8.x                   |
| UI Library    | React                           | 19.1.x                  |
| Global State  | Zustand                         | 5.0.x                   |
| Server State  | TanStack Query                  | 5.74.x                  |
| Form          | React Hook Form                 | 7.54.x                  |
| Validation    | Zod                             | 3.24.x                  |
| Styling       | Tailwind CSS                    | 4.1.x                   |
| UI Components | @moyeorak/design-system (1순위) | 0.1.x (npm 패키지)      |
| UI Components | shadcn/ui (보조)                | latest (소스 복사 방식) |

## 디렉터리 구조

```
apps/web/
└── src/
    ├── app/                  # Next.js App Router 페이지
    │   ├── (auth)/           # 로그인·회원가입 (비인증 레이아웃)
    │   ├── (dashboard)/      # 인증 후 레이아웃
    │   │   ├── schedule/     # FR-2 스케줄 관리
    │   │   ├── attendance/   # FR-3 근태 관리
    │   │   ├── payroll/      # FR-4 급여
    │   │   └── members/      # FR-5 인력 관리
    │   ├── globals.css
    │   └── layout.tsx
    ├── components/
    │   ├── ui/               # shadcn/ui 소스 복사 컴포넌트 (@moyeorak/design-system에 없는 것만)
    │   ├── layout/           # AdminShell, SidebarNav, Topbar 등
    │   └── common/           # 폼 필드, 상태 배지 등 공통 조합 컴포넌트
    ├── features/             # 도메인별 컴포넌트 (stores/, schedule/, payroll/ 등)
    ├── hooks/                # 커스텀 훅
    ├── lib/
    │   ├── api/              # API 클라이언트 함수
    │   └── utils/            # 순수 유틸 함수
    └── stores/               # Zustand 스토어
```

## 주요 규칙

### 라우팅 및 렌더링

- **App Router**를 사용합니다. `pages/` 디렉터리를 사용하지 마십시오.
- 데이터 패칭은 서버 컴포넌트(RSC)에서 초기 로드, 이후 인터랙션은 TanStack Query로 처리합니다.
- 클라이언트 컴포넌트는 필요한 최소 범위에만 `"use client"`를 선언합니다.

### 상태 관리

- **Zustand**: 필터 조건, 선택된 조직 ID, 모달 열림 상태 등 순수 UI 전역 상태에 사용합니다.
- **TanStack Query**: 서버에서 오는 모든 데이터(스케줄 목록, 근태 목록 등)에 사용합니다. 낙관적 업데이트(optimistic update)를 활용합니다.
- 두 상태를 혼용하지 않습니다. 서버 데이터를 Zustand에 저장하지 마십시오.

### 폼 및 유효성 검증

- 모든 폼은 **React Hook Form + Zod**로 작성합니다.
- Zod 스키마는 `packages/shared`에서 가져옵니다. 웹에서 별도로 정의하지 않습니다.

### 스타일링

- **Tailwind CSS** 유틸리티 클래스만 사용합니다. 인라인 `style` 속성 사용을 지양합니다.
- 디자인 토큰(색상, 간격, 폰트)은 Tailwind CSS 4의 CSS-first 방식에 맞춰 `src/app/globals.css`의 `@theme`와 CSS 변수에서 중앙 관리합니다.
- `max-w-[440px]`, `h-[52px]`, `px-[18px]`처럼 픽셀 값을 arbitrary value로 직접 넣지 않습니다. Tailwind 기본 scale을 먼저 사용하고, 반복되는 값은 `globals.css`의 token으로 승격합니다.
- 컴포넌트 로직과 스타일이 복잡해지면 `variants`(cva) 패턴으로 분리합니다.

### UI 컴포넌트

새로 구현하는 화면부터 아래 우선순위를 적용합니다. **기존에 이미 구현된 화면(인증, 조직 관리, 인력 관리, 급여정산)은 일괄 교체하지 않고 그대로 둡니다.**

1. **`@moyeorak/design-system`에 필요한 컴포넌트가 있으면 그것을 사용합니다.** (1순위)
2. 없는 컴포넌트만 **shadcn/ui**를 사용합니다. (보조)
3. 한 화면 안에서 두 라이브러리를 섞어 쓸 수 있습니다. 단, 같은 역할(예: 버튼)에 두 라이브러리 컴포넌트를 동시에 쓰지 않습니다 — 화면 단위로 우선순위 1번을 먼저 확인하고, 없는 요소만 2번으로 채웁니다.

`@moyeorak/design-system`:

- npm 패키지로 설치합니다(`pnpm add @moyeorak/design-system --filter @ilgam/web`). 소스를 복사하지 않습니다.
- 컴포넌트는 패키지에서 직접 import합니다. 커스터마이징이 필요하면 패키지 자체를 수정(별도 레포)하거나, 불가피한 경우에만 `components/common/`에서 한 번 감쌉니다.
- 루트 레이아웃(`src/app/layout.tsx`)에서 `@moyeorak/design-system/dist/style.css`를 전역 import합니다.
- 패키지의 CSS는 Panda CSS 기반 자체 디자인 토큰을 쓰므로, shadcn/Tailwind 토큰(`--primary`, `--foreground` 등)과 색상·spacing이 동일하지 않습니다. 한 화면에 섞어 쓸 때 시각적으로 어긋나지 않는지 확인합니다.
- 버전은 `docs/stack.md`에 명시된 범위(`0.1.x`)를 따릅니다. 메이저/마이너 업그레이드는 팀과 협의 후 `docs/stack.md`를 먼저 업데이트합니다.

shadcn/ui (보조):

- shadcn/ui는 패키지가 아닌 소스 복사 방식입니다. `components/ui/`에 복사된 파일을 직접 수정해 커스터마이징합니다.
- `pnpm dlx shadcn@latest add <component>`로 컴포넌트를 추가합니다. 추가 후 팀에 공유합니다.
- 두 라이브러리 모두에 없는 도메인 특화 컴포넌트(스케줄 캘린더, 근태 현황 타임라인 등)는 `components/features/`에 둘을 조합해 구현합니다.
- shadcn/ui 내부적으로 Radix UI primitives를 사용하므로 별도 접근성(a11y) 처리가 필요하지 않습니다.

### 인증 처리

- JWT는 HTTP-only 쿠키에 저장합니다. `localStorage`에 저장하지 마십시오.
- 미인증 접근은 Next.js middleware에서 `/login`으로 리다이렉트합니다.

### 에러 처리

- API 에러는 TanStack Query의 `onError` 또는 `error boundary`에서 처리합니다.
- 사용자에게 노출되는 에러 메시지는 기능 명세서의 "예외 처리" 항목을 따릅니다.

## 테스트

```bash
pnpm --filter @ilgam/web test          # 단위 테스트 (Vitest)
pnpm --filter @ilgam/web test:coverage # 커버리지 리포트
```

- **Vitest + React Testing Library**를 사용합니다.
- 테스트 파일은 별도 `test/` 디렉터리 없이 대상 파일 옆에 코로케이션합니다. (`ScheduleCard.tsx` → `ScheduleCard.test.tsx`)
- 커스텀 훅은 `renderHook`으로 단독 테스트합니다.
- API 호출은 `msw`로 모킹합니다.
- 커버리지 목표: 비즈니스 로직 훅·유틸 80% 이상.

## 개발 서버

```bash
pnpm --filter @ilgam/web dev    # http://localhost:3000
pnpm --filter @ilgam/web build
pnpm --filter @ilgam/web lint
```
