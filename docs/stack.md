# 기술 스택 정의서

### 1. Frontend (사용자 인터페이스 및 클라이언트 로직)

- **Core:**
  - React `19.1.x` (웹·앱 공통)
  - Next.js `15.3.x` (웹 전용, TypeScript, App Router 기반)
  - React Native `0.79.x` (앱 전용)
  - Expo SDK `53.x` (앱 전용)

- **State Management (상태 관리):** (웹·앱 공통)
  - **Global State:** Zustand `5.0.x` (필터 조건 등 전역 UI 상태 관리)
  - **Server State:** TanStack Query (React Query) `5.74.x` (API 데이터 캐싱, 동기화 및 상태 관리)

- **Navigation (앱 전용):**
  - Expo Router `5.x` (파일 기반 라우팅, React Navigation 7.x 기반)

- **Form & Validation:** (웹·앱 공통)
  - React Hook Form `7.54.x`
  - Zod `3.24.x` (복잡한 폼 상태 및 데이터 유효성 검증, 스키마는 `packages/shared`에서 중앙 관리)

- **Styling:**
  - Tailwind CSS `4.1.x` (웹 전용, 유틸리티 클래스 기반)
  - NativeWind `4.x` (앱 전용, React Native에서 Tailwind 클래스 문법 사용)

- **UI Components:**
  - shadcn/ui `latest` (웹 전용, 소스 복사 방식 — Radix UI primitives + Tailwind 기반)
  - Gluestack UI `v2.x` (앱 전용, NativeWind 기반 React Native 컴포넌트 라이브러리)

---

### 2. Backend (서버 로직 및 데이터베이스)

- **Core:**
  - NestJS `11.x` (TypeScript)
  - Node.js `22.x` LTS

- **Database:** PostgreSQL `17.x` (RDBMS)

- **ORM:** Prisma `6.8.x` (타입 안정성을 보장하는 데이터베이스 통신 및 스키마 관리)
  - schema, migrations, seed, PrismaService는 `packages/database` 패키지에서 전담 관리
  - `apps/api`는 `packages/database`가 export하는 `DatabaseModule`만 import

- **Auth:**
  - @nestjs/jwt `10.x`
  - @nestjs/passport `10.x`
  - passport-jwt `4.x`

- **Validation:**
  - class-validator `0.14.x`
  - class-transformer `0.5.x`

- **API Docs:** @nestjs/swagger `11.x`

- **Task Scheduling:** @nestjs/schedule `4.x` (cron 기반 자동화, 퇴근 미처리 처리 등)

- **Queue (선택적):** @nestjs/bull + bull `4.x` (급여 계산·알림 대량 발송 비동기화 시 도입)

---

### 3. Testing (품질 보증 및 회귀 방지)

- **Frontend Testing:**
  - Vitest `3.x`
  - React Testing Library `16.x` (단위 테스트, 커스텀 훅 및 컴포넌트 렌더링 테스트)
  - MSW (Mock Service Worker) `2.x` (API 모킹)

- **Backend Testing:**
  - Jest `29.x`
  - Supertest `7.x` (NestJS 서비스 로직 단위 테스트 및 API 통합/E2E 테스트)

---

### 4. Infrastructure & DevOps (배포 및 인프라 구성)

- **Cloud Computing:** AWS
  - EC2 — 백엔드 서버(Node.js 22.x LTS) 및 Next.js SSR 서버
  - S3 + CloudFront — 정적 에셋 CDN 배포 (Next.js는 EC2에서 SSR로 서빙)

- **Mobile Build:** Expo Application Services (EAS Build) — React Native 앱 빌드 및 OTA 업데이트

- **CI/CD:** GitHub Actions (테스트 자동화 및 자동 배포 파이프라인 구축)
  - Node.js `22.x` runner
  - pnpm `10.x` 캐싱 적용

- **Monorepo Management:** pnpm Workspaces `10.x` (프론트엔드와 백엔드 코드의 통합 관리)
  - 주요 패키지: `packages/shared` (공유 타입·Zod 스키마·유틸), `packages/database` (Prisma 전담)

---

### 5. Collaboration & Documentation (협업 및 문서화)

- **API Docs:** Swagger UI (@nestjs/swagger `11.x` 내장 기능 활용) 또는 Notion (명확한 책임 경계와 응답 포맷 사전 조율)
- **Version Control:** Git `2.x`, GitHub (체계적인 브랜치 전략 및 코드 리뷰)
- **Git Hooks:** Husky `9.x` + commitlint `21.x` (커밋 메시지 컨벤션 강제, main·develop 직접 push 차단)

---

### 버전 선택 기준 및 주요 호환성 메모

| 항목 | 비고 |
|------|------|
| Node.js 22.x LTS | 2026년 현재 Active LTS. NestJS 11, Prisma 6 공식 지원 버전 |
| Next.js 15.3.x | React 19 정식 지원, App Router 안정화, Turbopack 기본 활성화 |
| React 19.1.x | Next.js 15 및 React Native 0.79와 호환 |
| React Native 0.79.x | New Architecture(Fabric) 기본 활성화, Expo SDK 53과 호환 |
| Expo SDK 53.x | React Native 0.79 기반, Expo Router 5 포함 |
| TanStack Query 5.74.x | React 19 concurrent 기능 완전 지원 |
| Prisma 6.8.x | PostgreSQL 17 지원, TypeScript 5.x 최적화 |
| Tailwind CSS 4.1.x | Oxide 엔진, CSS-first 설정 방식 (tailwind.config.ts 유지 가능) |
| shadcn/ui | 소스 복사 방식으로 버전 고정 불필요. Tailwind 4.x + Next.js 15 공식 지원 |
| NativeWind 4.x | Tailwind CSS 4 기반, RN 0.79 New Architecture 정식 지원 |
| Gluestack UI v2 | NativeWind 4 기반으로 설계되어 NativeWind와 공식 호환. Expo SDK 53 지원 |
| Zustand 5.0.x | React 19 호환, 내장 TypeScript 타입 개선 |
